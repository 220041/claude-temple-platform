import type { Field, GlobalBeforeValidateHook, GlobalConfig } from 'payload'

import { superAdminOnly } from '../lib/access'

/**
 * 내부 경로를 "외부 URL"에 입력하지 못하게 막는다 — 내부 페이지는
 * "기존 페이지 연결"을 쓰게 강제해, 메뉴 데이터가 항상 실제 Pages/
 * Boards 문서를 가리키게 한다(리네임 시 slugHistory 리다이렉트가
 * 자동으로 따라가도록).
 */
function validateExternalUrl(value: unknown, { siblingData }: { siblingData?: { linkType?: string } }) {
  if (siblingData?.linkType !== 'url') return true
  if (!value || typeof value !== 'string') return '외부 URL을 입력하세요.'
  if (value.trim() === '#') {
    return '"#"는 유효한 외부 URL이 아닙니다. 연결할 대상이 없다면 "연결 없음"을 선택하세요.'
  }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return 'http:// 또는 https://로 시작하는 절대 주소만 입력하세요 (예: https://example.com).'
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'http:// 또는 https://로 시작하는 절대 주소만 입력하세요.'
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL
  if (serverUrl) {
    try {
      if (parsed.origin === new URL(serverUrl).origin) {
        return '내부 페이지는 "기존 페이지 연결"을 사용하세요. 외부 URL에는 다른 사이트 주소만 입력할 수 있습니다.'
      }
    } catch {
      // NEXT_PUBLIC_SERVER_URL 자체가 잘못된 값이면 이 검사는 건너뛴다.
    }
  }

  return true
}

type MenuItemLike = {
  boardRef?: unknown
  children?: MenuItemLike[] | null
  externalUrl?: string | null
  label?: string | null
  linkType?: string | null
  pageRef?: unknown
  showInBottom?: boolean | null
  showInTop?: boolean | null
  visible?: boolean | null
}

function extractRefId(ref: unknown): string | null {
  if (ref === null || ref === undefined) return null
  if (typeof ref === 'object' && 'id' in (ref as Record<string, unknown>)) {
    return String((ref as { id: unknown }).id)
  }
  return String(ref)
}

function targetKey(item: MenuItemLike): string | null {
  if (item.linkType === 'page') {
    const id = extractRefId(item.pageRef)
    return id ? `page:${id}` : null
  }
  if (item.linkType === 'board') {
    const id = extractRefId(item.boardRef)
    return id ? `board:${id}` : null
  }
  if (item.linkType === 'url') {
    return item.externalUrl ? `url:${item.externalUrl}` : null
  }
  return null
}

/**
 * 같은 위치(상단/하단)에 노출되는 두 항목이 같은 대상(같은 페이지·
 * 게시판·URL)을 가리키면 저장을 거부한다. 순환 참조는 2단계 고정
 * 배열 구조상 애초에 불가능하므로 여기서 따로 검사하지 않는다.
 */
const validateNoDuplicateVisibleTargets: GlobalBeforeValidateHook = ({ data }) => {
  const items = (data?.items ?? []) as MenuItemLike[]
  const flat: MenuItemLike[] = []
  for (const item of items) {
    flat.push(item)
    for (const child of item.children ?? []) flat.push(child)
  }

  for (const [placement, placementLabel] of [
    ['showInTop', '상단'],
    ['showInBottom', '하단'],
  ] as const) {
    const seen = new Map<string, string>()
    for (const item of flat) {
      if (item.visible === false || item[placement] === false) continue
      const key = targetKey(item)
      if (!key) continue
      const existingLabel = seen.get(key)
      if (existingLabel) {
        throw new Error(
          `${placementLabel} 메뉴에서 "${existingLabel}"와 "${item.label ?? '(이름 없음)'}"가 같은 대상을 가리키고 있습니다. 하나만 남기거나 대상을 다르게 설정하세요.`,
        )
      }
      seen.set(key, item.label ?? '(이름 없음)')
    }
  }

  return data
}

/**
 * 메뉴 항목 필드 정의. 상단(top)에서만 children(2단계)을 갖는다 —
 * children 필드 자체가 없는 재귀 깊이 1로 고정해, 순환 참조가 데이터
 * 모델 수준에서 애초에 불가능하게 만든다(자기참조 포인터가 없음).
 */
function menuItemFields(opts: { withChildren: boolean }): Field[] {
  const fields: Field[] = [
    { name: 'label', label: '메뉴 이름', type: 'text', required: true },
    { name: 'visible', label: '메뉴에 표시', type: 'checkbox', defaultValue: true },
    { name: 'showInTop', label: '상단(PC/모바일) 메뉴에 표시', type: 'checkbox', defaultValue: true },
    { name: 'showInBottom', label: '하단(푸터) 메뉴에 표시', type: 'checkbox', defaultValue: true },
    {
      name: 'linkType',
      label: '연결 대상',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: '연결 없음 (하위 메뉴만 표시)', value: 'none' },
        { label: '새 페이지 만들기', value: 'newPage' },
        { label: '기존 페이지 연결', value: 'page' },
        { label: '게시판 연결', value: 'board' },
        { label: '외부 URL 연결', value: 'url' },
      ],
      admin: {
        description: '"새 페이지 만들기"는 저장되지 않는 화면 전용 선택지입니다 — 클릭 시 초안 페이지를 만들고 자동으로 "기존 페이지 연결"로 바뀝니다.',
      },
    },
    {
      name: 'newPageAction',
      label: '',
      type: 'ui',
      admin: {
        condition: (_, siblingData) => siblingData?.linkType === 'newPage',
        components: {
          Field: '@/components/admin/menu/CreateLinkedPageButton#CreateLinkedPageButton',
        },
      },
    },
    {
      name: 'pageRef',
      label: '연결할 페이지',
      type: 'relationship',
      relationTo: 'pages',
      admin: { condition: (_, siblingData) => siblingData?.linkType === 'page' },
    },
    {
      name: 'boardRef',
      label: '연결할 게시판',
      type: 'relationship',
      relationTo: 'boards',
      admin: { condition: (_, siblingData) => siblingData?.linkType === 'board' },
    },
    {
      name: 'externalUrl',
      label: '외부 URL',
      type: 'text',
      validate: validateExternalUrl,
      admin: {
        description: 'http(s)://로 시작하는 외부 주소만 허용됩니다. 내부 페이지는 "기존 페이지 연결"을 사용하세요.',
        condition: (_, siblingData) => siblingData?.linkType === 'url',
      },
    },
  ]

  if (opts.withChildren) {
    fields.push({
      name: 'children',
      label: '하위 메뉴 (2단계)',
      type: 'array',
      fields: menuItemFields({ withChildren: false }),
    })
  }

  return fields
}

/**
 * 상단·모바일·하단 메뉴가 공유하는 단일 원본. header.tsx/footer.tsx가
 * lib/menuLink.ts의 buildMenuTree()로 각각 showInTop/showInBottom을
 * 필터링해서 쓴다. 구조 변경은 최고관리자만 가능하다(플랫폼 전환
 * 작업지시서 §2).
 */
export const MainMenu: GlobalConfig = {
  slug: 'main-menu',
  admin: { group: '홈페이지' },
  access: {
    read: () => true,
    update: superAdminOnly,
  },
  hooks: {
    beforeValidate: [validateNoDuplicateVisibleTargets],
  },
  fields: [
    {
      name: 'items',
      label: '메뉴 항목 (1단계)',
      type: 'array',
      fields: menuItemFields({ withChildren: true }),
    },
  ],
}
