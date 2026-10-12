import config from '../payload.config'
import { getPayload } from 'payload'
import fs from 'fs'
import path from 'path'

/**
 * 하논봉림사 운영/개발 인스턴스 전용, 수동 1회 실행 스크립트.
 *
 * prayer-section.tsx에 고정돼 있던 마스코트 이미지(public/images/logo-mascot.png)를
 * 관리자 설정(HomePage.prayerMascot)으로 옮기면서, 하논봉림사의 화면이 바뀌지
 * 않도록 기존 이미지를 업로드해 연결한다. 배포 후
 * `pnpm payload run scripts/seed-hanonbonglimsa-home-mascot.ts`로 한 번 실행한다.
 * 이미 값이 있으면 건드리지 않는다(여러 번 실행해도 안전). 다른 사찰에는 실행하지 않는다.
 */
const MASCOT_FILE = 'public/images/logo-mascot.png'
const MASCOT_ALT = '봉림사 마스코트'

async function main() {
  const payload = await getPayload({ config })

  const home = await payload.findGlobal({ slug: 'home-page', draft: true, overrideAccess: true, depth: 0 })
  if (home._status === 'draft') {
    payload.logger.warn('home-page에 게시하지 않은 초안이 있어 건너뜁니다. 먼저 게시하거나 되돌린 뒤 다시 실행하세요.')
    return
  }
  if (home.prayerMascot) {
    payload.logger.info('home-page.prayerMascot이 이미 있어 건너뜁니다.')
    return
  }

  // 이전 실행에서 올려 둔 파일이 있으면 다시 올리지 않고 재사용한다.
  const existing = await payload.find({
    collection: 'media-public',
    where: { alt: { equals: MASCOT_ALT } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  let mediaId = existing.docs[0]?.id

  if (!mediaId) {
    const filePath = path.resolve(process.cwd(), MASCOT_FILE)
    if (!fs.existsSync(filePath)) {
      payload.logger.warn(`마스코트 파일을 찾을 수 없어 건너뜁니다: ${filePath}`)
      return
    }
    const created = await payload.create({
      collection: 'media-public',
      data: { alt: MASCOT_ALT },
      filePath,
      overrideAccess: true,
    })
    mediaId = created.id
  }

  await payload.updateGlobal({
    slug: 'home-page',
    overrideAccess: true,
    data: { prayerMascot: mediaId, _status: 'published' },
  })
  payload.logger.info(`home-page.prayerMascot을 media-public#${mediaId}로 설정했습니다.`)
}

await main()
