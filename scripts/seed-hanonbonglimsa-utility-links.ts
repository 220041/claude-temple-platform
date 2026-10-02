import config from '../payload.config'
import { getPayload } from 'payload'

/**
 * 하논봉림사 운영/개발 인스턴스 전용, 수동 1회 실행 스크립트.
 *
 * header.tsx 유틸리티 바의 "기도·법회"(/pages/prayer-info)·"오시는 길"
 * (/pages/location) 링크와 footer.tsx의 "관세음보살" 문구가 코드에 고정돼
 * 있던 것을 관리자 설정(MainMenu.utilityLinks / FooterSettings.tagline)으로
 * 옮기면서, 하논봉림사의 화면이 바뀌지 않도록 기존 값을 그대로 채운다.
 * 배포 후 `pnpm payload run scripts/seed-hanonbonglimsa-utility-links.ts`로
 * 한 번 실행한다. 이미 값이 있으면 건드리지 않는다(여러 번 실행해도 안전).
 * 다른 사찰에는 실행하지 않는다.
 */
const LINKS = [
  { label: '기도·법회', slug: 'prayer-info' },
  { label: '오시는 길', slug: 'location' },
]
const TAGLINE = '마음이 힘들때 "관세음보살"을 불러보세요.'

async function main() {
  const payload = await getPayload({ config })

  const menu = await payload.findGlobal({ slug: 'main-menu', draft: true, overrideAccess: true, depth: 0 })
  if (menu._status === 'draft') {
    payload.logger.warn('main-menu에 게시하지 않은 초안이 있어 건너뜁니다. 먼저 게시하거나 되돌린 뒤 다시 실행하세요.')
  } else if (Array.isArray(menu.utilityLinks) && menu.utilityLinks.length > 0) {
    payload.logger.info('main-menu.utilityLinks가 이미 있어 건너뜁니다.')
  } else {
    const utilityLinks = []
    for (const link of LINKS) {
      const found = await payload.find({
        collection: 'pages',
        where: { slug: { equals: link.slug } },
        limit: 1,
        draft: true,
        overrideAccess: true,
      })
      const page = found.docs[0]
      if (!page) {
        payload.logger.warn(`slug "${link.slug}" 페이지가 없어 "${link.label}" 링크는 만들지 않습니다.`)
        continue
      }
      utilityLinks.push({ label: link.label, linkType: 'page' as const, pageRef: page.id })
    }
    if (utilityLinks.length > 0) {
      await payload.updateGlobal({
        slug: 'main-menu',
        overrideAccess: true,
        data: { utilityLinks, _status: 'published' },
      })
      payload.logger.info(`utilityLinks ${utilityLinks.length}개 생성 완료.`)
    }
  }

  const footer = await payload.findGlobal({ slug: 'footer-settings', draft: true, overrideAccess: true })
  if (footer._status === 'draft') {
    payload.logger.warn('footer-settings에 게시하지 않은 초안이 있어 tagline 설정을 건너뜁니다.')
  } else if (footer.tagline) {
    payload.logger.info('footer-settings.tagline이 이미 있어 건너뜁니다.')
  } else {
    await payload.updateGlobal({
      slug: 'footer-settings',
      overrideAccess: true,
      data: { tagline: TAGLINE, _status: 'published' },
    })
    payload.logger.info('footer tagline 설정 완료.')
  }
}

// `payload run`은 스크립트의 동기 구간이 끝나면 곧바로 종료하므로 top-level await를 쓴다.
try {
  await main()
  process.exit(0)
} catch (err) {
  console.error(err)
  process.exit(1)
}
