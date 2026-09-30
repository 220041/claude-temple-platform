import type { Endpoint } from 'payload'
import crypto from 'crypto'
import { checkRateLimit } from '../../lib/rateLimit'

/**
 * guide.md 4.1절: 이메일 인증 완료를 회원 상태(status)에 반영하고,
 * 인증메일 재발송을 지원한다. Payload의 기본 verify(POST
 * /members/verify/:id) 오퍼레이션은 DB를 직접 갱신해 컬렉션 훅을
 * 우회하므로, status를 pending→active로 전환하려면 별도 엔드포인트가
 * 필요하다.
 */
export const verifyAndActivateEndpoint: Endpoint = {
  path: '/verify-and-activate/:token',
  method: 'get',
  handler: async (req) => {
    const base = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
    const token = req.routeParams?.token
    if (!token || typeof token !== 'string') {
      return Response.redirect(`${base}/verify-result?status=error`, 302)
    }

    const { docs } = await req.payload.find({
      collection: 'members',
      where: { _verificationToken: { equals: token } },
      overrideAccess: true,
      showHiddenFields: true,
      limit: 1,
      req,
    })
    const member = docs[0]

    if (!member) {
      return Response.redirect(`${base}/verify-result?status=error`, 302)
    }

    await req.payload.update({
      collection: 'members',
      id: member.id,
      data: {
        _verified: true,
        status: member.status === 'pending' ? 'active' : member.status,
      },
      overrideAccess: true,
      req,
    })

    return Response.redirect(`${base}/verify-result?status=success`, 302)
  },
}

export const resendVerificationEndpoint: Endpoint = {
  path: '/resend-verification',
  method: 'post',
  handler: async (req) => {
    const data = (await req.json?.()) as { email?: string } | undefined
    const email = data?.email

    // 이메일 존재 여부를 노출하지 않도록 항상 동일한 응답을 준다.
    const genericResponse = Response.json({
      message: '해당 이메일이 등록되어 있고 아직 인증되지 않았다면 인증 메일을 재발송했습니다.',
    })

    if (!email || typeof email !== 'string') return genericResponse

    const allowed = await checkRateLimit({
      identifier: email,
      endpoint: 'resend-verification',
      windowMs: 60 * 1000,
      req,
    })
    if (!allowed) return genericResponse

    const { docs } = await req.payload.find({
      collection: 'members',
      where: { email: { equals: email } },
      overrideAccess: true,
      showHiddenFields: true,
      limit: 1,
      req,
    })
    const member = docs[0]
    if (!member || member._verified) return genericResponse

    const token = crypto.randomBytes(20).toString('hex')
    await req.payload.update({
      collection: 'members',
      id: member.id,
      data: { _verificationToken: token },
      overrideAccess: true,
      req,
    })

    const verificationURL = `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/api/members/verify-and-activate/${token}`

    const siteSettings = await req.payload.findGlobal({ slug: 'site-settings', overrideAccess: true, req })
    const fromName = siteSettings.emailFromName || '사찰 홈페이지'

    await req.payload.sendEmail({
      to: member.email,
      subject: `${fromName} 이메일 인증을 완료해 주세요`,
      html: `<p>아래 링크를 클릭하면 이메일 인증이 완료됩니다.</p><p><a href="${verificationURL}">${verificationURL}</a></p>`,
    })

    return genericResponse
  },
}

export const memberAuthEndpoints: Endpoint[] = [verifyAndActivateEndpoint, resendVerificationEndpoint]
