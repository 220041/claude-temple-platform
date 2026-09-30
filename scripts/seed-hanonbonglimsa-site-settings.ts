import config from '../payload.config'
import { getPayload } from 'payload'
import fs from 'fs'
import path from 'path'

/**
 * 하논봉림사 운영 인스턴스 전용, 수동 1회 실행 스크립트.
 *
 * 원래 migrations/20260930_030000_backfill_hanonbonglimsa_site_settings.ts의
 * up()이었다 — 공용 마이그레이션 체인에 사찰 전용 데이터 백필이 섞여 있으면
 * 빈 신규 사찰 DB에도 하논봉림사 정체성이 조용히 주입되는 문제(검토 문서 R3)가
 * 있어, 실행 로직만 여기로 옮기고 원래 마이그레이션은 no-op으로 바꿨다.
 *
 * 하논봉림사 운영/개발 DB에는 이미 위 마이그레이션으로 적용이 끝났으므로
 * 다시 실행할 필요는 없다 — 새로운 하논봉림사 인스턴스를 처음부터 세팅할
 * 일이 생기면 `pnpm payload run scripts/seed-hanonbonglimsa-site-settings.ts`로
 * 수동 실행한다. 다른 사찰에는 실행하지 않는다.
 */
async function main() {
  const payload = await getPayload({ config })

  const existing = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })
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
    })
    logoId = logo.id
  } else {
    payload.logger.warn(`로고 파일을 찾을 수 없어 logo 필드 없이 백필합니다: ${logoPath}`)
  }

  await payload.updateGlobal({
    slug: 'site-settings',
    overrideAccess: true,
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

  payload.logger.info('하논봉림사 site-settings 백필 완료.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
