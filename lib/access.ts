type AccessUser = { collection?: string; role?: string } | null

/** 로그인한 관리자(super-admin, editor 모두)라면 허용. */
export const adminOnly = ({ req: { user } }: { req: { user: AccessUser } }) =>
  Boolean(user && user.collection === 'admins')

/** adminOnly와 동일한 조건의 별칭. Boards처럼 update를 "아무 관리자"로 두는 곳에서 의미를 드러내기 위해 별도 이름을 둔다. */
export const anyAdmin = adminOnly

/**
 * 관리자 화면 사이드바에서 편집자에게는 숨긴다(admin.hidden). 편집자가 수정할 수 없는
 * 메뉴가 입력칸만 열린 채 보이는 혼란을 막기 위한 것이며, 접근 제어는 서버 쪽 access 규칙이 맡는다.
 */
export const hiddenFromEditors = ({ user }: { user?: unknown }) =>
  (user as { role?: string } | null | undefined)?.role !== 'super-admin'

/**
 * 초안(draft)을 쓰는 글로벌(홈페이지·메뉴·푸터)의 공개 읽기 규칙. 이 글로벌들은 읽기를 모두에게
 * 열어 두는데, Payload는 `?draft=true`를 붙인 읽기를 별도로 막지 않아 게시 전 초안이 익명에게
 * 노출됐다. 관리자가 아니면 draft=true 요청을 거부하고 게시본만 읽게 한다.
 * (화면 미리보기는 서버에서 로컬 API로 읽으므로 이 규칙의 영향을 받지 않는다.)
 */
export const publicReadNoDraft = ({
  req,
}: {
  req: { user?: unknown; query?: unknown; searchParams?: URLSearchParams }
}) => {
  const user = req.user as { collection?: string } | null | undefined
  if (user && user.collection === 'admins') return true
  const query = (req.query ?? {}) as Record<string, unknown>
  const wantsDraft = String(query.draft) === 'true' || req.searchParams?.get('draft') === 'true'
  return !wantsDraft
}

/** 구조·정체성 설정(사이트 정보, 메뉴 등)은 최고관리자만 변경 가능. */
export const superAdminOnly = ({ req: { user } }: { req: { user: AccessUser } }) =>
  Boolean(user && user.collection === 'admins' && user.role === 'super-admin')

/**
 * 필드 단위 쓰기 권한 — 관리자만 값을 정할 수 있는 필드(고정·조회수·사찰 소식 노출 등)에 쓴다.
 * 회원이 REST로 직접 값을 보내도 저장되지 않는다. 시스템이 overrideAccess로 갱신하는 코드는 영향을 받지 않는다.
 */
export const adminOnlyField = ({ req: { user } }: { req: { user?: unknown } }) =>
  Boolean(user && (user as { collection?: string }).collection === 'admins')

