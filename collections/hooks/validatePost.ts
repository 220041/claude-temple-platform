import type { CollectionBeforeValidateHook } from 'payload'

const MAX_EXTERNAL_LINKS = 5

function countExternalLinks(text: string): number {
  const matches = text.match(/https?:\/\/[^\s]+/g)
  return matches ? matches.length : 0
}

/**
 * guide.md 7.1/7.2/9.2절: 게시판 정책(상단 고정 최대 개수, 봉림사 소식
 * 선정 가능 여부)과 게시물당 외부 링크 최대 5개를 서버에서 강제한다.
 */
export const validatePost: CollectionBeforeValidateHook = async ({ data, req, originalDoc, operation }) => {
  if (!data) return data
  const boardId = data.board ?? originalDoc?.board
  if (!boardId) return data

  const board = await req.payload.findByID({
    collection: 'boards',
    id: typeof boardId === 'object' ? boardId.id : boardId,
    overrideAccess: true,
    req,
  })

  if (!board) throw new Error('존재하지 않는 게시판입니다.')

  if (data.showInTempleNews && !board.allowTempleNewsSelection) {
    throw new Error('이 게시판은 봉림사 소식 선정을 지원하지 않습니다.')
  }

  if (data.visibility === 'secret' && !board.allowSecret) {
    throw new Error('이 게시판은 비밀글을 지원하지 않습니다.')
  }

  if (data.pinned) {
    const existingId = operation === 'update' ? originalDoc?.id : undefined
    const { totalDocs } = await req.payload.count({
      collection: 'posts',
      where: {
        and: [
          { board: { equals: typeof boardId === 'object' ? boardId.id : boardId } },
          { pinned: { equals: true } },
          ...(existingId ? [{ id: { not_equals: existingId } }] : []),
        ],
      },
      overrideAccess: true,
      req,
    })
    if (totalDocs >= (board.maxPinned ?? 0)) {
      throw new Error(`이 게시판은 상단 고정을 최대 ${board.maxPinned}개까지만 허용합니다.`)
    }
  }

  if (typeof data.content === 'string' && countExternalLinks(data.content) > MAX_EXTERNAL_LINKS) {
    throw new Error(`게시물 본문의 외부 링크는 최대 ${MAX_EXTERNAL_LINKS}개까지 허용됩니다.`)
  }

  // guide.md 3.3/9.2절: 정지된 회원은 글을 쓸 수 없고, 게시물은 1분당
  // 1건·하루 최대 20건으로 제한한다.
  if (operation === 'create' && req.user && req.user.collection === 'members') {
    const memberId = req.user.id
    const member = await req.payload.findByID({ collection: 'members', id: memberId, overrideAccess: true, req })
    if (member?.status !== 'active') {
      throw new Error('이용 정지 중이거나 인증이 완료되지 않은 계정은 게시물을 작성할 수 없습니다.')
    }
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
    const { totalDocs: recentCount } = await req.payload.count({
      collection: 'posts',
      where: { and: [{ memberAuthor: { equals: memberId } }, { createdAt: { greater_than: oneMinuteAgo } }] },
      overrideAccess: true,
      req,
    })
    if (recentCount > 0) {
      throw new Error('게시물은 1분에 1건만 작성할 수 있습니다.')
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { totalDocs: todayCount } = await req.payload.count({
      collection: 'posts',
      where: { and: [{ memberAuthor: { equals: memberId } }, { createdAt: { greater_than: todayStart.toISOString() } }] },
      overrideAccess: true,
      req,
    })
    if (todayCount >= 20) {
      throw new Error('게시물은 하루 최대 20건까지 작성할 수 있습니다.')
    }
  }

  return data
}
