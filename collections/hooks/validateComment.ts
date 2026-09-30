import type { CollectionBeforeValidateHook } from 'payload'

const MIN_INTERVAL_MS = 30 * 1000
const MAX_PER_DAY = 100

const getRelationId = (value: unknown): string | number | undefined => {
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: string | number }).id
  if (typeof value === 'string' || typeof value === 'number') return value
  return undefined
}

/**
 * guide.md 9.1절: 댓글과 1단계 답글만 허용(답글의 답글 금지), 게시판·
 * 게시물의 댓글 허용 설정을 확인, 30초당 1건·일일 최대 100건 제한을
 * 서버에서 강제한다.
 */
export const validateComment: CollectionBeforeValidateHook = async ({ data, req, operation }) => {
  if (!data || operation !== 'create') return data

  const { user, payload } = req
  if (!user || user.collection !== 'members') {
    throw new Error('이메일 인증 회원만 댓글을 작성할 수 있습니다.')
  }

  const author = await payload.findByID({ collection: 'members', id: user.id, overrideAccess: true, req })
  if (author?.status !== 'active') {
    throw new Error('이용 정지 중이거나 인증이 완료되지 않은 계정은 댓글을 작성할 수 없습니다.')
  }

  const postId = getRelationId(data.post)
  if (!postId) throw new Error('게시물을 찾을 수 없습니다.')

  const post = await payload.findByID({ collection: 'posts', id: postId, overrideAccess: true, req })
  if (!post) throw new Error('게시물을 찾을 수 없습니다.')

  const board = await payload.findByID({ collection: 'boards', id: getRelationId(post.board)!, overrideAccess: true, req })
  if (!board) throw new Error('게시판을 찾을 수 없습니다.')

  const boardAllowsComments = board.allowPerPostCommentToggle ? post.commentPolicy !== 'blocked' : board.defaultAllowComments
  const postBlocksComments = post.commentPolicy === 'blocked'
  if (!boardAllowsComments || postBlocksComments) {
    throw new Error('이 게시물은 댓글을 허용하지 않습니다.')
  }

  if (data.parentComment) {
    const parentId = getRelationId(data.parentComment)
    const parent = await payload.findByID({ collection: 'comments', id: parentId!, overrideAccess: true, req })
    if (!parent) throw new Error('원 댓글을 찾을 수 없습니다.')
    if (getRelationId(parent.post) !== postId) throw new Error('답글은 같은 게시물의 댓글에만 달 수 있습니다.')
    if (parent.parentComment) {
      throw new Error('답글에는 다시 답글을 달 수 없습니다(1단계 답글까지만 허용).')
    }
  }

  const now = Date.now()
  const { docs: recent } = await payload.find({
    collection: 'comments',
    where: { memberAuthor: { equals: user.id } },
    sort: '-createdAt',
    limit: 1,
    overrideAccess: true,
    req,
  })
  if (recent[0] && now - new Date(recent[0].createdAt).getTime() < MIN_INTERVAL_MS) {
    throw new Error('댓글은 30초에 1건만 작성할 수 있습니다.')
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { totalDocs } = await payload.count({
    collection: 'comments',
    where: {
      and: [{ memberAuthor: { equals: user.id } }, { createdAt: { greater_than: todayStart.toISOString() } }],
    },
    overrideAccess: true,
    req,
  })
  if (totalDocs >= MAX_PER_DAY) {
    throw new Error(`댓글은 하루 최대 ${MAX_PER_DAY}건까지 작성할 수 있습니다.`)
  }

  data.memberAuthor = user.id

  return data
}
