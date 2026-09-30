import type { Field, GlobalConfig } from 'payload'

import { superAdminOnly } from '../lib/access'

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
 * 상단·모바일·하단 메뉴가 공유하는 단일 원본. header.tsx/footer.tsx는
 * 각각 showInTop/showInBottom으로 이 데이터를 필터링해서 쓴다(Stage 2
 * 백필 전까지는 이 글로벌이 비어 있으므로 기존 하드코딩 navItems/
 * footerGroups가 그대로 렌더링된다 — 실제 전환은 별도 커밋에서 진행).
 * 구조 변경은 최고관리자만 가능하다(플랫폼 전환 작업지시서 §2).
 */
export const MainMenu: GlobalConfig = {
  slug: 'main-menu',
  admin: { group: '홈페이지' },
  access: {
    read: () => true,
    update: superAdminOnly,
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
