type AccessUser = { collection?: string; role?: string } | null

/** 로그인한 관리자(super-admin, editor 모두)라면 허용. */
export const adminOnly = ({ req: { user } }: { req: { user: AccessUser } }) =>
  Boolean(user && user.collection === 'admins')

/** adminOnly와 동일한 조건의 별칭. Boards처럼 update를 "아무 관리자"로 두는 곳에서 의미를 드러내기 위해 별도 이름을 둔다. */
export const anyAdmin = adminOnly

/** 구조·정체성 설정(사이트 정보, 메뉴 등)은 최고관리자만 변경 가능. */
export const superAdminOnly = ({ req: { user } }: { req: { user: AccessUser } }) =>
  Boolean(user && user.collection === 'admins' && user.role === 'super-admin')
