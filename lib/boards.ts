import { getPayloadClient } from './payload'
import { getCurrentMemberCached } from './memberAuth'

const PAGE_SIZE = 20

export { BOARD_PATHS, isLegacyBoardKey, pathForBoardKey } from './boardPaths'

/** 검색 필터 드롭다운·sitemap에서 전체 게시판 목록이 필요할 때 쓴다. */
export async function getAllBoards() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'boards',
    overrideAccess: true,
    limit: 0,
    pagination: false,
    sort: 'displayName',
  })
  return docs
}

export async function getBoardByKey(boardKey: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'boards',
    where: { boardKey: { equals: boardKey } },
    overrideAccess: true,
    limit: 1,
  })
  return docs[0] ?? null
}

/**
 * guide.md 13.1/13.2절 목록 조회. 비밀글은 목록에 마스킹 표시하는 대신
 * 아예 제외한다(작성자 본인 마이페이지에서만 확인) — Posts.access.read가
 * 이미 그렇게 필터링하므로 그 결과를 그대로 쓴다. 상단 고정 게시물을
 * 먼저, 그 다음 최신순으로 정렬한다.
 */
export async function getPostsForBoard(boardKey: string, page = 1) {
  const board = await getBoardByKey(boardKey)
  if (!board) return { board: null, posts: [], totalPages: 0, totalDocs: 0 }

  const payload = await getPayloadClient()
  const member = await getCurrentMemberCached()

  const result = await payload.find({
    collection: 'posts',
    where: { board: { equals: board.id } },
    sort: ['-pinned', '-createdAt'],
    page,
    limit: PAGE_SIZE,
    user: member ?? undefined,
    overrideAccess: false,
    depth: 1,
  })

  return { board, posts: result.docs, totalPages: result.totalPages, totalDocs: result.totalDocs }
}

export async function getPostDetail(boardKey: string, id: string) {
  const board = await getBoardByKey(boardKey)
  if (!board) return null

  const payload = await getPayloadClient()
  const member = await getCurrentMemberCached()

  try {
    const post = await payload.findByID({
      collection: 'posts',
      id,
      user: member ?? undefined,
      overrideAccess: false,
      depth: 2,
    })
    if (!post || String((post.board as { id?: unknown })?.id ?? post.board) !== String(board.id)) return null
    return { board, post }
  } catch {
    return null
  }
}

export async function getCommentsForPost(postId: string) {
  const payload = await getPayloadClient()
  const member = await getCurrentMemberCached()

  const { docs } = await payload.find({
    collection: 'comments',
    where: { post: { equals: postId } },
    sort: 'createdAt',
    limit: 200,
    user: member ?? undefined,
    overrideAccess: false,
    depth: 1,
  })
  return docs
}

/** 마이페이지 14절: 본인 게시물/댓글 목록. 소유자 본인 조회이므로 접근 제어를 그대로 태운다. */
export async function getMyPosts(memberId: number | string, page = 1) {
  const payload = await getPayloadClient()
  const member = await getCurrentMemberCached()

  const result = await payload.find({
    collection: 'posts',
    where: { memberAuthor: { equals: memberId } },
    sort: '-createdAt',
    page,
    limit: PAGE_SIZE,
    user: member ?? undefined,
    overrideAccess: false,
    depth: 1,
  })
  return { posts: result.docs, totalPages: result.totalPages, totalDocs: result.totalDocs }
}

export async function getMyComments(memberId: number | string, page = 1) {
  const payload = await getPayloadClient()
  const member = await getCurrentMemberCached()

  const result = await payload.find({
    collection: 'comments',
    where: { memberAuthor: { equals: memberId } },
    sort: '-createdAt',
    page,
    limit: PAGE_SIZE,
    user: member ?? undefined,
    overrideAccess: false,
    depth: 2, // comment.post.board까지 채워야 목록에서 게시판명/링크를 만들 수 있다.
  })
  return { comments: result.docs, totalPages: result.totalPages, totalDocs: result.totalDocs }
}

/**
 * 홈페이지 "봉림사 소식" + `/temple-news` guide.md 8절/15절: 게시판 무관하게
 * showInTempleNews로 선정된 게시물을 모은다. 비밀글은 선정 여부와 무관하게
 * 항상 제외한다(뷰어가 작성자 본인이어도 이 목록에는 노출하지 않는다).
 */
export async function getTempleNewsPosts(limit = 7) {
  const payload = await getPayloadClient()
  const member = await getCurrentMemberCached()

  const result = await payload.find({
    collection: 'posts',
    where: { and: [{ showInTempleNews: { equals: true } }, { visibility: { not_equals: 'secret' } }] },
    sort: ['-templeNewsPinned', '-createdAt'],
    limit,
    user: member ?? undefined,
    overrideAccess: false,
    depth: 1,
  })
  return result.docs
}

export function isNew(dateStr?: string | null) {
  if (!dateStr) return false
  const days = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  return days >= 0 && days <= 3
}

export function resolveAuthorName(post: {
  authorType?: string | null
  adminAuthor?: unknown
  memberAuthor?: unknown
}): string {
  if (post.authorType === 'member') {
    const m = post.memberAuthor as { nickname?: string; status?: string } | number | null
    if (m && typeof m === 'object') {
      return m.status === 'withdrawn' ? '탈퇴한 회원' : (m.nickname ?? '회원')
    }
    return '회원'
  }
  const a = post.adminAuthor as { name?: string } | number | null
  if (a && typeof a === 'object') return a.name ?? '관리자'
  return '관리자'
}
