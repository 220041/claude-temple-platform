import type { CollectionAfterReadHook } from 'payload'

const SENSITIVE_FIELDS = [
  'email',
  'realName',
  'status',
  'suspensionReason',
  'suspensionUntil',
  'lastNicknameChangeAt',
  'createdAt',
  'updatedAt',
  'loginAttempts',
  'lockUntil',
]

/**
 * guide.md 3.2절: 실명·이메일·가입일·최근 로그인·계정 상태·정지 사유는
 * 관리자와 본인만 볼 수 있고, 닉네임만 공개 정보다. 이 필드들을 각각
 * field-level access로 잠그는 대신, 응답 시점에 한 번에 마스킹한다
 * (email은 Payload가 자동 주입하는 필드라 field 배열에서 재정의할 수
 * 없다).
 */
export const redactMemberFields: CollectionAfterReadHook = ({ doc, req: { user }, overrideAccess }) => {
  // overrideAccess:true는 신뢰할 수 있는 서버 내부 호출(커스텀 엔드포인트,
  // 다른 컬렉션의 훅 등)에서만 사용하므로 마스킹을 건너뛴다. 공개
  // REST/GraphQL API 요청은 항상 overrideAccess:false로 들어온다.
  if (overrideAccess) return doc

  const isSelf = Boolean(user && user.collection === 'members' && user.id === doc.id)
  const isAdmin = Boolean(user && user.collection === 'admins')

  if (isSelf || isAdmin) return doc

  const redacted = { ...doc }
  for (const field of SENSITIVE_FIELDS) {
    delete redacted[field]
  }
  return redacted
}
