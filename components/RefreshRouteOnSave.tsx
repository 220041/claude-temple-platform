"use client"

import { RefreshRouteOnSave as PayloadLivePreview } from "@payloadcms/live-preview-react"
import { useRouter } from "next/navigation"

/**
 * Payload 관리자 화면의 Live Preview 패널(iframe)에서 문서를 저장/발행할
 * 때마다 postMessage로 신호를 받아 이 라우트를 새로고침한다(App Router
 * router.refresh() — 전체 페이지 리로드가 아니라 서버 컴포넌트만 다시
 * 렌더링). draftMode가 켜진 미리보기 경로에서만 의미가 있으므로
 * app/(frontend)/pages/[slug]/page.tsx가 draft.isEnabled일 때만 렌더링한다.
 */
export function RefreshRouteOnSave() {
  const router = useRouter()

  return (
    <PayloadLivePreview
      refresh={() => router.refresh()}
      serverURL={process.env.NEXT_PUBLIC_SERVER_URL ?? ""}
    />
  )
}
