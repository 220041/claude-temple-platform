'use server'

import { revalidatePath } from 'next/cache'
import { getPayloadClient } from '@/lib/payload'
import { getCurrentMember } from '@/lib/memberAuth'

export type ActionResult = { error: string } | { success: true }

export async function createCommentAction(
  path: string,
  postId: string,
  parentCommentId: string | null,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const member = await getCurrentMember()
  if (!member) return { error: '로그인이 필요합니다.' }

  const content = String(formData.get('content') ?? '').trim()
  if (!content) return { error: '댓글 내용을 입력해 주세요.' }

  const payload = await getPayloadClient()

  try {
    await payload.create({
      collection: 'comments',
      data: { post: Number(postId), parentComment: parentCommentId ? Number(parentCommentId) : undefined, content },
      user: member,
      overrideAccess: false,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : '댓글 작성에 실패했습니다.' }
  }

  revalidatePath(path)
  return { success: true }
}

/** <form action> 시그니처(반환값 void)에 맞춘 래퍼. */
export async function deleteCommentFormAction(path: string, commentId: string): Promise<void> {
  await deleteCommentAction(path, commentId)
}

export async function deleteCommentAction(path: string, commentId: string): Promise<ActionResult> {
  const member = await getCurrentMember()
  if (!member) return { error: '로그인이 필요합니다.' }

  const payload = await getPayloadClient()

  try {
    // trash:true는 이미 trash 상태인 문서를 대상으로 할 때만 붙인다
    // (posts.ts의 deletePostAction 주석 참고).
    await payload.update({
      collection: 'comments',
      id: commentId,
      data: { deletedAt: new Date().toISOString() },
      user: member,
      overrideAccess: false,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : '댓글 삭제에 실패했습니다.' }
  }

  revalidatePath(path)
  return { success: true }
}
