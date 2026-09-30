'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { MEMBER_TOKEN_COOKIE } from '@/lib/memberAuth'
import { checkRateLimit } from '@/lib/rateLimit'

async function clientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}

export type ActionResult = { error: string } | { success: true }

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  if (!email || !password) return { error: '이메일과 비밀번호를 입력해 주세요.' }

  const payload = await getPayloadClient()

  try {
    const result = await payload.login({ collection: 'members', data: { email, password } })
    if (!result.token) return { error: '로그인에 실패했습니다.' }

    ;(await cookies()).set(MEMBER_TOKEN_COOKIE, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }

  redirect('/mypage')
}

export async function logoutAction() {
  ;(await cookies()).delete(MEMBER_TOKEN_COOKIE)
  redirect('/')
}

export async function registerAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const nickname = String(formData.get('nickname') ?? '')
  const realName = String(formData.get('realName') ?? '')
  const agreeTerms = formData.get('agreeTerms') === 'on'
  const agreePrivacy = formData.get('agreePrivacy') === 'on'
  const agreeBoardPolicy = formData.get('agreeBoardPolicy') === 'on'

  if (!email || !password || !nickname || !realName) {
    return { error: '모든 항목을 입력해 주세요.' }
  }
  if (!agreeTerms || !agreePrivacy || !agreeBoardPolicy) {
    return { error: '이용약관, 개인정보처리방침, 게시판 운영정책에 모두 동의해야 합니다.' }
  }

  const allowed = await checkRateLimit({
    identifier: await clientIp(),
    endpoint: 'register',
    windowMs: 60 * 60 * 1000,
    max: 3,
  })
  if (!allowed) return { error: '잠시 후 다시 시도해 주세요.' }

  const payload = await getPayloadClient()

  // guide.md 16절: 최종 정책 문안이 확정될 때까지는 TBD 상태를 버전
  // 문자열로 남긴다(guide.md 23/26절: 임의로 실제 약관 문구를 만들지 않음).
  const policyVersion = 'tbd-' + new Date().getFullYear()

  try {
    // overrideAccess: false로 access.create를 실제로 태워야
    // PUBLIC_REGISTRATION_ENABLED 잠금(guide.md 4.2)이 적용된다 —
    // 로컬 API는 기본값이 overrideAccess: true라 그냥 두면 이 게이트가
    // 통째로 무시된다.
    await payload.create({
      collection: 'members',
      data: {
        email,
        password,
        nickname,
        realName,
        termsVersion: policyVersion,
        privacyVersion: policyVersion,
        boardPolicyVersion: policyVersion,
        agreedAt: new Date().toISOString(),
      },
      overrideAccess: false,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : '가입에 실패했습니다.' }
  }

  redirect('/register/done')
}

export async function forgotPasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) return { error: '이메일을 입력해 주세요.' }

  // 존재 여부를 노출하지 않기 위해 rate limit에 걸려도 동일한 성공 응답을
  // 준다 — 다만 실제 이메일 발송은 건너뛴다.
  const allowed = await checkRateLimit({
    identifier: email,
    endpoint: 'forgot-password',
    windowMs: 5 * 60 * 1000,
  })
  if (!allowed) return { success: true }

  const payload = await getPayloadClient()

  // 이메일 존재 여부를 노출하지 않도록 항상 동일한 성공 응답을 준다
  // (memberAuthEndpoints.ts의 resendVerificationEndpoint와 동일한 패턴).
  try {
    await payload.forgotPassword({ collection: 'members', data: { email }, disableEmail: false })
  } catch {
    // 존재하지 않는 이메일이어도 동일하게 성공으로 응답한다.
  }

  return { success: true }
}

export async function resetPasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const token = String(formData.get('token') ?? '')
  const password = String(formData.get('password') ?? '')
  const passwordConfirm = String(formData.get('passwordConfirm') ?? '')

  if (!token) return { error: '유효하지 않은 재설정 링크입니다.' }
  if (!password) return { error: '새 비밀번호를 입력해 주세요.' }
  if (password !== passwordConfirm) return { error: '비밀번호가 일치하지 않습니다.' }

  const payload = await getPayloadClient()

  try {
    const result = await payload.resetPassword({ collection: 'members', data: { token, password }, overrideAccess: true })
    if (!result.token) return { error: '비밀번호 재설정에 실패했습니다.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : '재설정 링크가 만료되었거나 유효하지 않습니다.' }
  }

  redirect('/login')
}
