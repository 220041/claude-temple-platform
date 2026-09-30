import { type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'
import fs from 'fs'
import path from 'path'

/**
 * 하논봉림사의 현재 하드코딩된 사찰 정체성 값을 SiteSettings 데이터로
 * 옮긴다. installed:true가 되는 순간부터 layout.tsx/헤더/푸터/이메일이
 * 이 문서를 읽어 렌더링하므로, 여기서 옮기는 값은 기존 하드코딩과
 * 정확히 같아야 화면이 바뀌지 않는다(app/(frontend)/layout.tsx,
 * components/header.tsx, components/location-section.tsx 원문 대조 완료).
 *
 * 이 마이그레이션은 하논봉림사 데이터를 갖는 인스턴스에 1회만 실행한다.
 * 빈 신규 사찰 DB는 이 마이그레이션을 건너뛰어(또는 실행해도 로고 파일이
 * 없어 실패해) installed:false로 남는 것이 정상이다.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const existing = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true, req })
  if (existing.installed) {
    payload.logger.info('site-settings.installed가 이미 true라 백필을 건너뜁니다.')
    return
  }

  const logoPath = path.resolve(process.cwd(), 'public/images/logo-combined.png')
  let logoId: number | undefined
  if (fs.existsSync(logoPath)) {
    const logo = await payload.create({
      collection: 'media-public',
      data: { alt: '대한불교조계종 봉림사 Bonglimsa' },
      filePath: logoPath,
      overrideAccess: true,
      req,
    })
    logoId = logo.id
  } else {
    payload.logger.warn(`로고 파일을 찾을 수 없어 logo 필드 없이 백필합니다: ${logoPath}`)
  }

  await payload.updateGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    req,
    data: {
      installed: true,
      siteName: '하논봉림사',
      siteShortName: '봉림사',
      siteNameEn: 'Bonglimsa',
      siteDescription:
        '제주 한라산 기슭에 자리한 봉림사(Bonglimsa)는 천년의 역사를 간직한 수행과 기도의 도량입니다.',
      siteKeywords: '봉림사, 하논봉림사, 제주사찰, 불교, 기도, 법회, Bonglimsa, bonglimsa',
      ...(logoId ? { logo: logoId } : {}),
      logoAlt: '대한불교조계종 봉림사 Bonglimsa',
      themeColor: '#263328',
      colors: {
        accent: '#9b6b3f',
        ink: '#20251f',
        deep: '#263328',
        pine: '#405343',
        paper: '#f5f1e8',
      },
      emailFromName: '[봉림사]',
      location: {
        lat: 33.2509992116399,
        lng: 126.539461742188,
        mapLabel: '봉림사',
        zoomLevel: 4,
      },
    },
  })
}

// 백필한 설정값은 이후 관리자가 직접 수정했을 수 있어, 되돌리면 편집
// 내용을 덮어쓸 위험이 있다. 데이터 복구가 아닌 구조 변경만 down에서
// 되돌리는 원칙(20260929_000000_backfill_page_versions.ts와 동일)에 따라
// 이 데이터 백필은 의도적으로 비가역적으로 둔다.
export async function down(_args: MigrateDownArgs): Promise<void> {}
