import type { CollectionBeforeChangeHook } from 'payload'

/**
 * guide.md 7.1/7.2절: authorType·adminAuthor·memberAuthor는 클라이언트가
 * 보낸 값을 신뢰하지 않고 요청자의 실제 로그인 신원으로 서버가 지정한다.
 * 회원 게시물은 작성 즉시 공개한다(관리자 콘텐츠는 기존 draft/publish
 * 흐름을 그대로 유지).
 */
export const setPostAuthor: CollectionBeforeChangeHook = ({ data, operation, req: { user } }) => {
  if (operation !== 'create') return data

  if (user && user.collection === 'members') {
    data.authorType = 'member'
    data.memberAuthor = user.id
    data.adminAuthor = undefined
    data._status = 'published'
  } else if (user && user.collection === 'admins') {
    data.authorType = 'admin'
    data.adminAuthor = data.adminAuthor ?? user.id
    data.memberAuthor = undefined
  }

  return data
}
