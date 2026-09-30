import config from '../payload.config'
import { getPayload } from 'payload'

/**
 * 하논봉림사 운영 인스턴스 전용, 수동 1회 실행 스크립트.
 *
 * 원래 migrations/20260930_034000_backfill_main_menu.ts의 up()이었다 —
 * 매핑 실패(대상 페이지/게시판 없음) 시 예외를 던지는 로직이 공용
 * 마이그레이션 체인에 있으면, 하논봉림사 콘텐츠가 없는 빈 신규 사찰 DB는
 * 이 마이그레이션에서 무조건 멈춰 이후 모든 마이그레이션이 막힌다
 * (검토 문서 R3). 실행 로직만 여기로 옮기고 원래 마이그레이션은
 * no-op으로 바꿨다.
 *
 * 하논봉림사 운영/개발 DB에는 이미 적용이 끝났으므로 다시 실행할 필요는
 * 없다. 새로운 하논봉림사 인스턴스를 처음부터 세팅할 일이 생기면
 * (동일한 header.tsx/footer.tsx 하드코딩 메뉴가 있는 경우에만)
 * `pnpm payload run scripts/seed-hanonbonglimsa-main-menu.ts`로 수동
 * 실행한다. 다른 사찰에는 실행하지 않는다 — 새 사찰은 관리자 화면에서
 * 메뉴를 직접 구성한다.
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

async function main() {
  const payload = await getPayload({ config })

  const existing = await payload.findGlobal({ slug: 'main-menu', overrideAccess: true })
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
        })
        const page = docs[0]
        if (!page) {
          throw new Error(
            `메뉴 백필 실패: "${child.label}"(${child.href})에 해당하는 페이지(slug=${slug})를 찾을 수 없습니다. ` +
              '먼저 해당 페이지를 만들거나, 이 스크립트의 NAV_ITEMS를 최신 상태로 다시 확인하세요.',
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
    data: { items },
  })

  payload.logger.info('하논봉림사 main-menu 백필 완료.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
