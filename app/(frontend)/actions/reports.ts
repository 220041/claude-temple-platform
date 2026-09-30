'use server'

import { getPayloadClient } from '@/lib/payload'
import { getCurrentMember } from '@/lib/memberAuth'

export type ActionResult = { error: string } | { success: true }

const REASONS = new Set(['ad', 'abuse', 'illegal', 'privacy', 'spam', 'conflict', 'other'])

export async function createReportAction(
  targetCollection: 'posts' | 'comments',
  targetId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const member = await getCurrentMember()
  if (!member) return { error: '로그인이 필요합니다.' }

  const reason = String(formData.get('reason') ?? '')
  if (!REASONS.has(reason)) return { error: '신고 사유를 선택해 주세요.' }
  const reasonDetail = String(formData.get('reasonDetail') ?? '') || undefined

  const payload = await getPayloadClient()

  try {
    await payload.create({
      collection: 'reports',
      data: {
        target: { relationTo: targetCollection, value: Number(targetId) },
        reason: reason as 'ad' | 'abuse' | 'illegal' | 'privacy' | 'spam' | 'conflict' | 'other',
        reasonDetail,
      },
      user: member,
      overrideAccess: false,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : '신고 접수에 실패했습니다.' }
  }

  return { success: true }
}
