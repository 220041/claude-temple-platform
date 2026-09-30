'use server'

import { del } from '@vercel/blob'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { getBoardByKey, pathForBoardKey } from '@/lib/boards'
import { getCurrentMember } from '@/lib/memberAuth'

export type ActionResult = { error: string } | { success: true }

/**
 * guide.md 10.7절: 이제 클라이언트가 파일을 서버로 직접 보내지 않고
 * Vercel Blob에 먼저 업로드한 뒤(app/(payload)/api/blob-upload),
 * 그 결과 URL만 여기로 넘어온다(4.5MB 서버리스 요청 본문 제한 우회).
 * 서버는 그 URL에서 바이트를 다시 받아와 기존과 동일하게
 * media-private에 저장한다 — MIME/시그니처 검증과 EXIF 제거는
 * validateAndStripImage 훅이 그대로 처리하므로 보안 보장은 동일하다.
 * 처리 후(성공이든 실패든) 임시 스테이징 blob은 반드시 지운다.
 */
async function uploadMemberImages(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  member: NonNullable<Awaited<ReturnType<typeof getCurrentMember>>>,
  stagingUrls: string[],
) {
  const uploaded: { relationTo: 'media-private'; value: number }[] = []
  for (const url of stagingUrls) {
    if (!url) continue
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('임시 업로드 파일을 가져오지 못했습니다.')
      const arrayBuffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') ?? 'application/octet-stream'
      const filename = decodeURIComponent(url.split('/').pop() ?? 'upload')

      const doc = await payload.create({
        collection: 'media-private',
        data: {},
        file: {
          data: Buffer.from(arrayBuffer),
          mimetype: contentType,
          name: filename,
          size: arrayBuffer.byteLength,
        },
        user: member,
        overrideAccess: false,
      })
      uploaded.push({ relationTo: 'media-private', value: Number(doc.id) })
    } finally {
      await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN_PUBLIC }).catch(() => {})
    }
  }
  return uploaded
}


export async function createPostAction(boardKey: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const member = await getCurrentMember()
  if (!member) return { error: '로그인이 필요합니다.' }

  const board = await getBoardByKey(boardKey)
  if (!board) return { error: '게시판을 찾을 수 없습니다.' }

  const title = String(formData.get('title') ?? '').trim()
  const content = String(formData.get('content') ?? '').trim()
  const isSecret = formData.get('visibility') === 'secret'

  if (!title || !content) return { error: '제목과 내용을 입력해 주세요.' }

  const payload = await getPayloadClient()
  const stagingUrls = formData.getAll('imageBlobUrls').filter((v): v is string => typeof v === 'string' && v.length > 0)

  let postId: number
  try {
    const images = await uploadMemberImages(payload, member, stagingUrls)

    const post = await payload.create({
      collection: 'posts',
      data: {
        board: board.id,
        title,
        content,
        visibility: isSecret ? 'secret' : 'public',
        featuredImage: images[0],
        images: images.map((image) => ({ image })),
      },
      user: member,
      overrideAccess: false,
    })
    postId = post.id
  } catch (err) {
    // redirect()는 내부적으로 특수한 에러를 던져 Next.js가 캐치하게 하므로,
    // 이 catch가 그걸 가로채지 않도록 try 블록에는 실제 실패 가능 지점만 둔다.
    return { error: err instanceof Error ? err.message : '게시물 작성에 실패했습니다.' }
  }

  revalidatePath(pathForBoardKey(boardKey))
  redirect(`${pathForBoardKey(boardKey)}/${postId}`)
}

export async function updatePostAction(
  boardKey: string,
  postId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const member = await getCurrentMember()
  if (!member) return { error: '로그인이 필요합니다.' }

  const title = String(formData.get('title') ?? '').trim()
  const content = String(formData.get('content') ?? '').trim()
  const isSecret = formData.get('visibility') === 'secret'

  if (!title || !content) return { error: '제목과 내용을 입력해 주세요.' }

  const payload = await getPayloadClient()

  try {
    await payload.update({
      collection: 'posts',
      id: postId,
      data: { title, content, visibility: isSecret ? 'secret' : 'public' },
      user: member,
      overrideAccess: false,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : '게시물 수정에 실패했습니다.' }
  }

  revalidatePath(pathForBoardKey(boardKey))
  redirect(`${pathForBoardKey(boardKey)}/${postId}`)
}

export async function deletePostAction(boardKey: string, postId: string): Promise<ActionResult> {
  const member = await getCurrentMember()
  if (!member) return { error: '로그인이 필요합니다.' }

  const payload = await getPayloadClient()

  try {
    // guide.md 10.3: 회원 삭제는 즉시 영구삭제가 아니라 소프트 삭제(30일 보관).
    // trash:true는 "이미 trash 상태인 문서"를 대상 조회에 포함하는 옵션이라
    // 아직 삭제 전인 문서를 처음 trash로 보낼 때는 붙이면 안 된다(대상이
    // 안 잡혀 access 단계에서 거부당한다) — 8단계에서 복원 테스트만 해보고
    // 이 최초-삭제 경로는 실제로 호출해보지 않아 놓쳤던 부분.
    await payload.update({
      collection: 'posts',
      id: postId,
      data: { deletedAt: new Date().toISOString() },
      user: member,
      overrideAccess: false,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : '게시물 삭제에 실패했습니다.' }
  }

  revalidatePath(pathForBoardKey(boardKey))
  redirect(pathForBoardKey(boardKey))
}

/** <form action> 시그니처(반환값 void)에 맞춘 래퍼. */
export async function deletePostFormAction(boardKey: string, postId: string): Promise<void> {
  await deletePostAction(boardKey, postId)
}
