/**
 * 최상위 경로 중 페이지·게시판·메뉴가 절대 가져다 쓸 수 없는 이름들.
 * `app/(frontend)/*`의 실제 라우트 폴더 + `(payload)`가 예약하는
 * /admin, /api를 모두 나열한다. 새 페이지 slug 자동생성, 메뉴의
 * 외부 URL 검증(동일 출처 내부 경로 차단) 양쪽에서 재사용한다.
 */
export const RESERVED_PATHS = [
  'admin',
  'api',
  'login',
  'register',
  'forgot-password',
  'reset-password',
  'mypage',
  'verify-result',
  'search',
  'pages',
  'notices',
  'dharma',
  'press',
  'gallery',
  'community',
  'stories',
  'temple-news',
] as const

export function isReservedPath(segment: string): boolean {
  const normalized = segment.trim().toLowerCase().replace(/^\/+|\/+$/g, '')
  const firstSegment = normalized.split('/')[0]
  return (RESERVED_PATHS as readonly string[]).includes(firstSegment)
}
