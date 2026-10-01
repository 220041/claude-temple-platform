import type { CollectionBeforeChangeHook } from 'payload'

const getRelationId = (value: unknown): string | number | undefined => {
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: string | number }).id
  if (typeof value === 'string' || typeof value === 'number') return value
  return undefined
}

/**
 * guide.md 7.1/7.2절: authorType·adminAuthor·memberAuthor는 클라이언트가
 * 보낸 값을 신뢰하지 않고 요청자의 실제 로그인 신원으로 서버가 지정한다.
 * 회원 게시물은 작성 즉시 공개한다(관리자 콘텐츠는 기존 draft/publish
 * 흐름을 그대로 유지).
 *
 * Stage 3: moderationStatus도 같은 이유로(클라이언트가 못 정하고 신원+
 * board 정책으로 서버가 결정) 여기서 함께 지정한다. 작성 시: 회원 작성 +
 * 해당 board가 승인제(requiresApproval)면 pending, 그 외(관리자 작성
 * 포함)는 전부 approved. 수정 시: 회원 본인이 승인제 게시판의 자기 글을
 * 고치면 승인/반려 상태와 무관하게 항상 다시 pending으로 돌린다 — 반려
 * 건만 특별취급하면 "이미 승인된 글을 몰래 다른 내용으로 바꿔치기"가
 * 가능해지므로, 내용이 바뀌면 재검수한다는 일관 규칙으로 둔다.
 */
export const setPostAuthor: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  const { user, payload } = req

  if (operation === 'create') {
    if (user && user.collection === 'members') {
      data.authorType = 'member'
      data.memberAuthor = user.id
      data.adminAuthor = undefined
      data._status = 'published'

      const boardId = getRelationId(data.board)
      const board = boardId ? await payload.findByID({ collection: 'boards', id: boardId, overrideAccess: true, req }) : null
      data.moderationStatus = board?.memberPostApproval === 'requiresApproval' ? 'pending' : 'approved'
    } else if (user && user.collection === 'admins') {
      data.authorType = 'admin'
      data.adminAuthor = data.adminAuthor ?? user.id
      data.memberAuthor = undefined
      data.moderationStatus = 'approved'
    }
    return data
  }

  if (user && user.collection === 'members' && originalDoc?.authorType === 'member') {
    const boardId = getRelationId(originalDoc.board)
    const board = boardId ? await payload.findByID({ collection: 'boards', id: boardId, overrideAccess: true, req }) : null
    if (board?.memberPostApproval === 'requiresApproval') {
      data.moderationStatus = 'pending'
      data.moderationReason = null
    }
  }

  return data
}
