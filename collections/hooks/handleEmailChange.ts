import type { CollectionAfterChangeHook } from 'payload'
import crypto from 'crypto'

/**
 * guide.md 3.3절: 이메일 변경 시 새 이메일 재인증을 요구한다.
 * verify:true이므로 _verified를 false로 되돌리면 재인증 전까지 로그인이
 * 자동으로 막힌다.
 */
export const handleEmailChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== 'update' || !previousDoc) return doc
  if (!doc.email || doc.email === previousDoc.email) return doc
  // 탈퇴 처리로 인해 이메일이 익명화 주소로 바뀐 경우는 재인증 대상이 아니다.
  if (doc.status === 'withdrawn') return doc

  const token = crypto.randomBytes(20).toString('hex')

  await req.payload.update({
    collection: 'members',
    id: doc.id,
    data: { _verified: false, _verificationToken: token, status: 'pending' },
    overrideAccess: true,
    req,
  })

  const verificationURL = `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/api/members/verify-and-activate/${token}`

  await req.payload.sendEmail({
    to: doc.email,
    subject: '[봉림사] 변경된 이메일 인증을 완료해 주세요',
    html: `<p>이메일 주소가 변경되어 재인증이 필요합니다.</p><p><a href="${verificationURL}">${verificationURL}</a></p>`,
  })

  return doc
}
