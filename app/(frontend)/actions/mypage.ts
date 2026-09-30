'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { getCurrentMember, MEMBER_TOKEN_COOKIE } from '@/lib/memberAuth'

export type ActionResult = { error: string } | { success: true }

export async function updateNicknameAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const member = await getCurrentMember()
  if (!member) return { error: '로그인이 필요합니다.' }

  const nickname = String(formData.get('nickname') ?? '').trim()
  if (!nickname) return { error: '닉네임을 입력해 주세요.' }

  const payload = await getPayloadClient()
  try {
    await payload.update({
      collection: 'members',
      id: member.id,
      data: { nickname },
      user: member,
      overrideAccess: false,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : '닉네임 변경에 실패했습니다.' }
  }

  return { success: true }
}

export async function updateEmailAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const member = await getCurrentMember()
  if (!member) return { error: '로그인이 필요합니다.' }

  const email = String(formData.get('email') ?? '').trim()
  const currentPassword = String(formData.get('currentPassword') ?? '')
  if (!email || !currentPassword) return { error: '새 이메일과 현재 비밀번호를 입력해 주세요.' }

  const payload = await getPayloadClient()

  try {
    await payload.login({ collection: 'members', data: { email: member.email, password: currentPassword } })
  } catch {
    return { error: '현재 비밀번호가 올바르지 않습니다.' }
  }

  try {
    // handleEmailChange 훅이 재인증 메일 발송과 status=pending 전환을 처리한다.
    await payload.update({
      collection: 'members',
      id: member.id,
      data: { email },
      user: member,
      overrideAccess: false,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : '이메일 변경에 실패했습니다.' }
  }

  return { success: true }
}

export async function changePasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const member = await getCurrentMember()
  if (!member) return { error: '로그인이 필요합니다.' }

  const currentPassword = String(formData.get('currentPassword') ?? '')
  const newPassword = String(formData.get('newPassword') ?? '')
  const newPasswordConfirm = String(formData.get('newPasswordConfirm') ?? '')

  if (!currentPassword || !newPassword) return { error: '모든 항목을 입력해 주세요.' }
  if (newPassword !== newPasswordConfirm) return { error: '새 비밀번호가 일치하지 않습니다.' }

  const payload = await getPayloadClient()

  try {
    await payload.login({ collection: 'members', data: { email: member.email, password: currentPassword } })
  } catch {
    return { error: '현재 비밀번호가 올바르지 않습니다.' }
  }

  try {
    await payload.update({
      collection: 'members',
      id: member.id,
      data: { password: newPassword },
      user: member,
      overrideAccess: false,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.' }
  }

  return { success: true }
}

export async function withdrawAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const member = await getCurrentMember()
  if (!member) return { error: '로그인이 필요합니다.' }

  const currentPassword = String(formData.get('currentPassword') ?? '')
  if (!currentPassword) return { error: '비밀번호를 입력해 주세요.' }

  const payload = await getPayloadClient()

  try {
    await payload.login({ collection: 'members', data: { email: member.email, password: currentPassword } })
  } catch {
    return { error: '비밀번호가 올바르지 않습니다.' }
  }

  try {
    // status 필드는 관리자만 수정 가능하도록 잠겨 있어(Members.ts), 본인
    // 탈퇴는 memberAuthEndpoints.ts와 동일하게 overrideAccess:true로
    // 우회한다. 실명·이메일 익명화는 validateMember 훅이 자동 처리한다
    // (게시물/댓글은 그대로 남긴다 — guide.md 3.3절).
    await payload.update({
      collection: 'members',
      id: member.id,
      data: { status: 'withdrawn' },
      overrideAccess: true,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : '회원 탈퇴에 실패했습니다.' }
  }

  ;(await cookies()).delete(MEMBER_TOKEN_COOKIE)
  redirect('/')
}
