/**
 * 메뉴/푸터 미리보기 URL. 홈페이지는 "준비 중" 상태면 임시 헤더/푸터라 메뉴가
 * 안 보이므로, 항상 정식 헤더·푸터를 쓰는 /login으로 보낸다(api/home-preview
 * 라우트의 `to=shell`).
 */
export function shellPreviewUrl() {
  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  return `${base}/api/home-preview?to=shell&secret=${process.env.PAGE_PREVIEW_SECRET ?? ''}`
}
