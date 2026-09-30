import config from '@payload-config'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

const VIEWED_COOKIE = 'viewed-posts'
const DEDUP_WINDOW_SECONDS = 60 * 60 * 24 // guide.md 13.3: 새로고침마다 무제한 증가 방지(하루 1회)

/**
 * guide.md 13.3절: 조회수를 세되, 단순 새로고침으로 무한정 증가하지 않게
 * 최소한의 중복 방지를 적용한다. 로그인 여부와 무관하게 브라우저 쿠키에
 * "오늘 이미 본 게시물 id 목록"을 저장해 판별한다(좋아요/추천처럼 계정
 * 단위로 관리할 필요는 없다고 guide가 명시).
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const viewed = new Set((cookieStore.get(VIEWED_COOKIE)?.value ?? '').split(',').filter(Boolean))

  if (viewed.has(id)) {
    return NextResponse.json({ counted: false })
  }

  const payload = await getPayload({ config })

  try {
    const post = await payload.findByID({ collection: 'posts', id, overrideAccess: true })
    await payload.update({
      collection: 'posts',
      id,
      data: { viewCount: (post.viewCount ?? 0) + 1 },
      overrideAccess: true,
    })
  } catch {
    return NextResponse.json({ counted: false })
  }

  viewed.add(id)
  const response = NextResponse.json({ counted: true })
  response.cookies.set(VIEWED_COOKIE, [...viewed].join(','), {
    maxAge: DEDUP_WINDOW_SECONDS,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  })
  return response
}
