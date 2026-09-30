import config from '@payload-config'
import { draftMode } from 'next/headers'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

/**
 * guide.md 11.2: 관리자 콘텐츠 미리보기. Payload 세션이 있는 관리자만
 * Next.js draft mode를 켜고 초안(미게시) 상태의 정적 페이지를 볼 수 있다.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const secret = searchParams.get('secret')

  if (!slug || !secret || secret !== process.env.PAGE_PREVIEW_SECRET) {
    return new Response('Invalid preview request', { status: 401 })
  }

  const payload = await getPayload({ config })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user || user.collection !== 'admins') {
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  const draft = await draftMode()
  draft.enable()

  redirect(`/pages/${slug}`)
}
