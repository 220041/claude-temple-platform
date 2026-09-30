import type { Where } from 'payload'
import { getPayloadClient } from './payload'
import { getCurrentMemberCached } from './memberAuth'

const PAGE_SIZE = 20

export type SearchParams = {
  q?: string
  board?: string
  from?: string
  to?: string
  page?: number
}

/**
 * guide.md 13.4절 통합검색. Posts.access.read가 초안/보관/숨김/삭제/
 * 만료는 걸러주지만, 비밀글은 목록 마스킹 노출을 위해 문서 자체는
 * 통과시킨다(guide.md 9.3, Posts.ts의 secretFieldReadAccess) — 그래서
 * 검색에서는 visibility로 비밀글을 명시적으로 다시 제외해야 한다
 * (guide.md 9.3/13.4절: 비밀글은 검색 결과에서 항상 제외).
 * 검색 대상 필드는 제목/본문/작성자 닉네임뿐이며, 실명·이메일·법문자
 * 필드는 애초에 Posts 스키마 최상위에 없어 검색 조건에 노출되지 않는다.
 */
export async function searchPosts({ q, board, from, to, page = 1 }: SearchParams) {
  const query = (q ?? '').trim()
  if (!query) return { posts: [], totalPages: 0, totalDocs: 0 }

  const payload = await getPayloadClient()
  const member = await getCurrentMemberCached()

  const and: Where[] = [
    { visibility: { not_equals: 'secret' } },
    {
      or: [
        { title: { like: query } },
        { content: { like: query } },
        { 'memberAuthor.nickname': { like: query } },
      ],
    },
  ]

  if (board) and.push({ 'board.boardKey': { equals: board } })
  if (from) and.push({ createdAt: { greater_than_equal: new Date(from).toISOString() } })
  if (to) and.push({ createdAt: { less_than_equal: new Date(`${to}T23:59:59.999Z`).toISOString() } })

  const result = await payload.find({
    collection: 'posts',
    where: { and },
    sort: '-createdAt',
    page,
    limit: PAGE_SIZE,
    user: member ?? undefined,
    overrideAccess: false,
    depth: 1,
  })

  return { posts: result.docs, totalPages: result.totalPages, totalDocs: result.totalDocs }
}
