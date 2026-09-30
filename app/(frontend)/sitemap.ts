import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { pathForBoardKey } from '@/lib/boards'

const STATIC_PATHS = [
  '/',
  '/notices',
  '/dharma',
  '/press',
  '/gallery/monks',
  '/gallery/scenery',
  '/community',
  '/stories/bonglimsa',
  '/stories/gamrodang',
  '/temple-news',
  '/search',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const payload = await getPayloadClient()

  const [pages, posts] = await Promise.all([
    // overrideAccess:true는 접근 제어(admins만 열람 가능한 draft)를 건너뛸
    // 뿐, _status 필터는 별도로 걸어줘야 한다 — 걸지 않으면 아직 게시되지
    // 않은 draft 페이지까지 공개 sitemap에 노출되는 버그가 있었다.
    payload.find({
      collection: 'pages',
      where: { _status: { equals: 'published' } },
      overrideAccess: true,
      limit: 0,
      pagination: false,
    }),
    // overrideAccess:false + user 없음 = 익명 방문자가 실제로 볼 수 있는
    // 게시물만 나온다(초안/보관/숨김/삭제/만료 자동 제외, guide.md 15절).
    // 비밀글은 목록 마스킹 노출을 위해 문서 자체는 통과되므로(guide.md
    // 9.3, Posts.ts secretFieldReadAccess) visibility로 명시적으로
    // 다시 제외해야 한다(guide.md 24절: sitemap에서 비공개 콘텐츠 제외).
    payload.find({
      collection: 'posts',
      where: { visibility: { not_equals: 'secret' } },
      overrideAccess: false,
      limit: 0,
      pagination: false,
      depth: 1,
    }),
  ])

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({ url: `${base}${path}` }))

  const pageEntries: MetadataRoute.Sitemap = pages.docs.map((page) => ({
    url: `${base}/pages/${page.slug}`,
    lastModified: page.updatedAt,
  }))

  const postEntries: MetadataRoute.Sitemap = posts.docs
    .map((post) => {
      const board = post.board as { boardKey?: string }
      if (!board?.boardKey) return null
      return { url: `${base}${pathForBoardKey(board.boardKey)}/${post.id}`, lastModified: post.updatedAt }
    })
    .filter((entry): entry is { url: string; lastModified: string } => entry !== null)

  return [...staticEntries, ...pageEntries, ...postEntries]
}
