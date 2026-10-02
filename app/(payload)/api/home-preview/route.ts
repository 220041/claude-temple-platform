import config from '@payload-config'
import { draftMode } from 'next/headers'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

/**
 * 홈페이지(HomePage 글로벌) 미리보기. app/(payload)/api/pages/preview/route.ts와
 * 동일한 2중 인증 패턴(secret + 관리자 세션) — 대상이 특정 slug가 아니라
 * "/" 고정이라는 점만 다르다.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (!secret || secret !== process.env.PAGE_PREVIEW_SECRET) {
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

  // 메뉴/푸터 미리보기는 홈이 "준비 중"이어도 정식 헤더·푸터가 보이는 /login으로 보낸다.
  redirect(searchParams.get('to') === 'shell' ? '/login' : '/')
}
