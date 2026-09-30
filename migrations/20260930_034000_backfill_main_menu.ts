import { type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * header.tsx의 navItems/footerGroups(둘 다 링크 집합이 동일함을 확인했다)를
 * MainMenu.items로 변환한다. 각 하위 항목의 href를 Pages(slug)/Boards
 * (boardKey, lib/boards.ts의 BOARD_PATHS 역매핑)에서 실제로 찾아
 * pageRef/boardRef로 연결하고, "#" 플레이스홀더 3개는 linkType:'none',
 * visible:false로 전환한다(가짜 대상을 만들지 않음).
 *
 * 매핑 실패(대상 문서를 찾지 못함)는 조용히 건너뛰지 않고 마이그레이션을
 * 중단한다 — 투자한 사찰 콘텐츠 조사가 최신 상태인지 다시 확인해야 한다는
 * 신호이기 때문이다.
 */

type NavChild = { label: string; href: string }
type NavGroup = { label: string; children: NavChild[] }

// components/header.tsx의 navItems 원문(백필 시점 스냅샷).
const NAV_ITEMS: NavGroup[] = [
  {
    label: '봉림사 소개',
    children: [
      { label: '봉림사 역사', href: '/pages/temple-history' },
      { label: '언론 속 봉림사', href: '/press' },
      { label: '오시는 길', href: '/pages/location' },
    ],
  },
  {
    label: '기도 · 법회',
    children: [
      { label: '연중기도', href: '#' },
      { label: '관음42수주기도', href: '#' },
      { label: '어린이·청소년 법회', href: '#' },
    ],
  },
  {
    label: '회주·주지스님',
    children: [
      { label: '행장', href: '/pages/monk-biography' },
      { label: '법문', href: '/dharma' },
      { label: '포토갤러리', href: '/gallery/monks' },
    ],
  },
  {
    label: '봉림 풍경',
    children: [
      { label: '공지사항', href: '/notices' },
      { label: '감로당', href: '/stories/gamrodang' },
      { label: '포토갤러리', href: '/gallery/scenery' },
      { label: '자유게시판', href: '/community' },
    ],
  },
]

// components/footer.tsx의 footerGroups 원문. children href/label 집합은
// NAV_ITEMS와 100% 동일 — 유일한 차이는 두 번째 그룹의 표시 라벨
// ("기도 법회" vs "기도 · 법회") 뿐이므로 별도 데이터를 만들지 않고
// NAV_ITEMS 백필 결과에 showInBottom만 얹는다.

// lib/boards.ts의 BOARD_PATHS를 역으로 뒤집은 것 — path -> boardKey.
const PATH_TO_BOARD_KEY: Record<string, string> = {
  '/notices': 'notices',
  '/dharma': 'dharma',
  '/press': 'press',
  '/gallery/monks': 'monk-gallery',
  '/gallery/scenery': 'scenery-gallery',
  '/community': 'community',
  '/stories/bonglimsa': 'stories',
  '/stories/gamrodang': 'gamrodang',
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const existing = await payload.findGlobal({ slug: 'main-menu', overrideAccess: true, req })
  if (Array.isArray(existing.items) && existing.items.length > 0) {
    payload.logger.info('main-menu.items가 이미 있어 백필을 건너뜁니다.')
    return
  }

  const items = []

  for (const group of NAV_ITEMS) {
    const children = []

    for (const child of group.children) {
      if (child.href === '#') {
        children.push({
          label: child.label,
          visible: false,
          showInTop: true,
          showInBottom: true,
          linkType: 'none' as const,
        })
        continue
      }

      if (child.href.startsWith('/pages/')) {
        const slug = child.href.replace('/pages/', '')
        const { docs } = await payload.find({
          collection: 'pages',
          where: { slug: { equals: slug } },
          overrideAccess: true,
          limit: 1,
          req,
        })
        const page = docs[0]
        if (!page) {
          throw new Error(
            `메뉴 백필 실패: "${child.label}"(${child.href})에 해당하는 페이지(slug=${slug})를 찾을 수 없습니다. ` +
              '먼저 해당 페이지를 만들거나, 이 마이그레이션의 NAV_ITEMS를 최신 상태로 다시 확인하세요.',
          )
        }
        children.push({
          label: child.label,
          visible: true,
          showInTop: true,
          showInBottom: true,
          linkType: 'page' as const,
          pageRef: page.id,
        })
        continue
      }

      const boardKey = PATH_TO_BOARD_KEY[child.href]
      if (!boardKey) {
        throw new Error(`메뉴 백필 실패: "${child.label}"(${child.href})를 페이지/게시판 어느 쪽으로도 매핑할 수 없습니다.`)
      }
      const { docs } = await payload.find({
        collection: 'boards',
        where: { boardKey: { equals: boardKey } },
        overrideAccess: true,
        limit: 1,
        req,
      })
      const board = docs[0]
      if (!board) {
        throw new Error(
          `메뉴 백필 실패: "${child.label}"(${child.href})에 해당하는 게시판(boardKey=${boardKey})을 찾을 수 없습니다. ` +
            '먼저 Boards 컬렉션에 해당 게시판을 만드세요.',
        )
      }
      children.push({
        label: child.label,
        visible: true,
        showInTop: true,
        showInBottom: true,
        linkType: 'board' as const,
        boardRef: board.id,
      })
    }

    items.push({
      label: group.label,
      visible: true,
      showInTop: true,
      showInBottom: true,
      linkType: 'none' as const,
      children,
    })
  }

  await payload.updateGlobal({
    slug: 'main-menu',
    overrideAccess: true,
    req,
    data: { items },
  })
}

// 백필된 메뉴는 이후 관리자가 직접 편집했을 수 있어, 되돌리면 편집
// 내용을 덮어쓸 위험이 있다(20260930_030000 백필과 동일 원칙).
export async function down(_args: MigrateDownArgs): Promise<void> {}
