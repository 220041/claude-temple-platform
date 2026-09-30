import { cache } from 'react'
import { cookies } from 'next/headers'
import { getPayloadClient } from './payload'

/**
 * Payload는 auth-enabled 컬렉션의 로그인 쿠키 이름을 전역
 * `cookiePrefix`(기본 "payload") 하나로만 정한다 — 컬렉션별로 다른
 * 쿠키 이름을 주는 옵션이 없다. Admins와 Members가 둘 다 기본값을
 * 쓰면 같은 이름의 쿠키(`payload-token`)를 공유하게 되어, 관리자로
 * 로그인한 채 동시에 회원으로도 로그인하면 한쪽 세션이 다른 쪽을
 * 덮어써 버린다(guide.md 3.1/3.2 "관리자 컬렉션은 회원 컬렉션과
 * 분리한다"의 정신에 어긋남).
 *
 * 그래서 회원 로그인은 Payload의 기본 쿠키를 아예 쓰지 않는다. 로그인
 * 성공 시 응답으로 받은 JWT를 우리가 직접 별도 이름의 쿠키
 * (MEMBER_TOKEN_COOKIE)에 저장하고, 이후 요청에서는 그 값을
 * `Authorization: JWT <token>` 헤더로 변환해 payload.auth()에 넘긴다.
 * 관리자 쪽은 Payload 표준 쿠키 흐름을 그대로 쓰므로 서로 충돌하지
 * 않는다.
 */
export const MEMBER_TOKEN_COOKIE = 'member-token'

export async function getCurrentMember() {
  const token = (await cookies()).get(MEMBER_TOKEN_COOKIE)?.value
  if (!token) return null

  const payload = await getPayloadClient()
  const headers = new Headers({ Authorization: `JWT ${token}` })
  const { user } = await payload.auth({ headers })

  if (!user || user.collection !== 'members') return null
  return user
}

export const getCurrentMemberCached = cache(getCurrentMember)
