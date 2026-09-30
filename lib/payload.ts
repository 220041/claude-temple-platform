import { cache } from 'react'
import config from '@payload-config'
import { getPayload } from 'payload'

export const getPayloadClient = cache(async () => getPayload({ config }))

/**
 * 홈페이지 CMS Global 조회. guide.md 6절: CMS 연결이 실패해도 화면이
 * 깨지지 않아야 하므로 오류 시 null을 반환하고 호출부에서 기본값으로
 * 대체한다(운영 전에는 샘플 데이터 노출 여부를 별도로 검증해야 한다).
 */
export const getHomePage = cache(async () => {
  try {
    const payload = await getPayloadClient()
    return await payload.findGlobal({ slug: 'home-page' })
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
