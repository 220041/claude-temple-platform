import { cache } from 'react'
import config from '@payload-config'
import { getPayload } from 'payload'

export const getPayloadClient = cache(async () => getPayload({ config }))

/**
 * 홈페이지 CMS Global 조회. guide.md 6절: CMS 연결이 실패해도 화면이
 * 깨지지 않아야 하므로 오류 시 null을 반환하고 호출부에서 기본값으로
 * 대체한다(운영 전에는 샘플 데이터 노출 여부를 별도로 검증해야 한다).
 *
 * isDraft(Next.js draftMode)가 true일 때만 아직 공개 안 한 초안을
 * 읽는다 — app/(frontend)/pages/[slug]/page.tsx의 getPage()와 동일한
 * draft/overrideAccess 패턴. 기본값(false)은 기존 동작과 동일하게
 * 항상 공개본(base 테이블의 현재 값)을 읽는다.
 */
export const getHomePage = cache(async (isDraft = false) => {
  try {
    const payload = await getPayloadClient()
    return await payload.findGlobal({ slug: 'home-page', draft: isDraft, overrideAccess: isDraft })
  } catch {
    return null
  }
})

export const getFooterSettings = cache(async () => {
  try {
    const payload = await getPayloadClient()
    return await payload.findGlobal({ slug: 'footer-settings' })
  } catch {
    return null
  }
})

export const getPopupSettings = cache(async () => {
  try {
    const payload = await getPayloadClient()
    return await payload.findGlobal({ slug: 'popup-settings' })
  } catch {
    return null
  }
})

export const getSiteSettings = cache(async () => {
  try {
    const payload = await getPayloadClient()
    return await payload.findGlobal({ slug: 'site-settings' })
  } catch {
    return null
  }
})

export const getMainMenu = cache(async () => {
  try {
    const payload = await getPayloadClient()
    // overrideAccess 기본값(true)으로 두면 pageRef 관계 populate도 Pages.access.read를
    // 건너뛰어, 미공개(draft) 페이지가 공개 메뉴 트리에 실제 링크로 노출된다
    // (app/(frontend)/pages/[slug]/page.tsx는 overrideAccess:false로 올바르게 막고
    // 있어 "메뉴엔 보이는데 클릭하면 404"인 죽은 링크가 생기는 원인이었다).
    return await payload.findGlobal({ slug: 'main-menu', overrideAccess: false })
  } catch {
    return null
  }
})
