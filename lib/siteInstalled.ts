import { getSiteSettings } from './payload'

/**
 * SiteSettings.installed가 true인지 여부. 빈 신규 사찰 DB는 이 값이
 * false로 남아 있으므로, 공개 화면이 특정 사찰 자료 대신 "설치
 * 미완료" 안내를 보여줄지 판단하는 유일한 기준으로 쓴다.
 */
export async function isSiteInstalled(): Promise<boolean> {
  const settings = await getSiteSettings()
  return Boolean(settings?.installed)
}
