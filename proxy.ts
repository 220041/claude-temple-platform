import { NextRequest, NextResponse } from 'next/server'

// lib/memberAuth.ts의 MEMBER_TOKEN_COOKIE와 반드시 같은 값을 유지해야 한다.
// 이 파일은 Edge 런타임에서 실행되는데, memberAuth.ts를 그대로 import하면
// payload.config.ts 전체(Node 전용 모듈 포함)가 딸려 들어와 빌드가 깨진다.
const MEMBER_TOKEN_COOKIE = 'member-token'

/**
 * Payload의 파일 스트리밍 엔드포인트(/api/media-private/file/...)는
 * Payload 자체 인증(표준 쿠키 또는 Authorization 헤더)만 인식하는데,
 * 회원 로그인은 관리자 쿠키와의 충돌을 피하려고 별도 쿠키(member-token,
 * lib/memberAuth.ts 참고)를 쓰고 서버 컴포넌트/액션 안에서만 수동으로
 * Authorization 헤더로 변환한다. 그래서 <img src="/api/media-private/...">
 * 같은 브라우저의 직접 요청은 그 변환을 거치지 않아, 회원이 자신의 비밀글
 * 이미지조차 볼 수 없었다(guide.md 24절 "비밀글 이미지 직접 접근 차단"
 * 점검 중 발견). 이 파일이 그 요청에 한해 같은 변환을 대신 해준다.
 *
 * Next.js 16부터 middleware.ts 컨벤션이 deprecated되고 proxy.ts로
 * 대체됐다(https://nextjs.org/docs/messages/middleware-to-proxy) —
 * export 함수 이름도 `middleware`가 아니라 `proxy`여야 한다.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(MEMBER_TOKEN_COOKIE)?.value
  if (!token) return NextResponse.next()

  const headers = new Headers(request.headers)
  headers.set('Authorization', `JWT ${token}`)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: '/api/media-private/file/:path*',
}
