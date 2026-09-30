import type { Payload } from 'payload'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

type MediaRef = { relationTo: 'media-public' | 'media-private'; id: string }

function extractPolyRefs(doc: Record<string, unknown> | null | undefined): MediaRef[] {
  if (!doc) return []
  const refs: MediaRef[] = []
  const add = (rel: unknown) => {
    if (rel && typeof rel === 'object' && 'relationTo' in rel && 'value' in rel) {
      const { relationTo, value } = rel as { relationTo: string; value: unknown }
      if (relationTo !== 'media-public' && relationTo !== 'media-private') return
      const id = value && typeof value === 'object' && 'id' in value ? (value as { id: unknown }).id : value
      if (id !== null && id !== undefined) refs.push({ relationTo, id: String(id) })
    }
  }
  add(doc.featuredImage)
  const images = Array.isArray(doc.images) ? doc.images : []
  for (const row of images) add((row as { image?: unknown })?.image)
  return refs
}

function extractDirectUploadId(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'object' && 'id' in value) return String((value as { id: unknown }).id)
  return String(value)
}

/**
 * blocks/pageBlocks.ts의 photo/gallery 블록은 media-public을 직접
 * relationTo로 참조한다(Posts의 featuredImage/images처럼 poly가 아님).
 */
function extractPageBlockMediaIds(doc: Record<string, unknown> | null | undefined): string[] {
  if (!doc) return []
  const ids: string[] = []
  const blocks = Array.isArray(doc.blocks) ? doc.blocks : []
  for (const block of blocks) {
    const b = block as { blockType?: string; image?: unknown; images?: unknown[] }
    if (b.blockType === 'photo') {
      const id = extractDirectUploadId(b.image)
      if (id) ids.push(id)
    } else if (b.blockType === 'gallery') {
      for (const row of b.images ?? []) {
        const id = extractDirectUploadId((row as { image?: unknown })?.image)
        if (id) ids.push(id)
      }
    }
  }
  return ids
}

/**
 * guide.md 10.6/20절: 소프트 삭제된 게시물·댓글이 30일을 넘기면 영구삭제한다.
 * 게시물 영구삭제는 cascadeDeletePostRelations 훅이 댓글까지 함께 정리해준다
 * (10단계에서 trash:true 누락 버그를 수정한 바로 그 훅).
 */
export async function purgeExpiredTrash(payload: Payload) {
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS).toISOString()

  const { docs: expiredPosts } = await payload.find({
    collection: 'posts',
    trash: true,
    overrideAccess: true,
    limit: 1000,
    where: { deletedAt: { less_than: cutoff } },
  })

  let deletedPosts = 0
  for (const post of expiredPosts) {
    await payload.delete({ collection: 'posts', id: post.id, trash: true, overrideAccess: true })
    deletedPosts++
  }

  // 댓글만 단독으로 소프트 삭제된 경우(게시물은 살아있음)도 30일 후 영구삭제 대상이다.
  const { docs: expiredComments } = await payload.find({
    collection: 'comments',
    trash: true,
    overrideAccess: true,
    limit: 1000,
    where: { deletedAt: { less_than: cutoff } },
  })

  let deletedComments = 0
  for (const comment of expiredComments) {
    try {
      await payload.delete({ collection: 'comments', id: comment.id, trash: true, overrideAccess: true })
      deletedComments++
    } catch {
      // 위에서 게시물과 함께 이미 정리됐을 수 있다(무시하고 계속 진행).
    }
  }

  return { deletedPosts, deletedComments }
}

const MEDIA_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000

/**
 * guide.md 10.6절: 게시물·페이지에 연결되지 않은 고아 미디어 파일을 정리한다.
 * media-public은 Posts/Pages 외에 HomePage/PopupSettings 전역 설정에서도
 * 쓰이므로 그쪽 참조까지 전부 확인한 뒤에 지운다(잘못 지우면 홈페이지·페이지
 * 이미지가 깨진다) — media-private은 회원 게시물 업로드로만 쓰이므로 Posts만
 * 확인.
 *
 * 검토 문서(PLATFORM_REVIEW_2026-09-30.md R2) 지적: 이전 버전은 Pages를
 * 전혀 조회하지 않아 페이지 사진 블록이 쓰는 미디어가 고아로 오인될 수
 * 있었고, 보존된 버전(versions) 히스토리도 스캔하지 않아 "이전 버전으로
 * 복원" 기능이 사진을 잃을 수 있었다. 둘 다 여기서 함께 참조로 인식한다.
 * 또한 업로드 직후 아직 문서 저장 전인 파일을 실수로 지우지 않도록,
 * 생성된 지 24시간이 안 된 미디어는 참조 여부와 무관하게 삭제 대상에서
 * 제외한다.
 */
export async function purgeOrphanMedia(payload: Payload) {
  const usedPublic = new Set<string>()
  const usedPrivate = new Set<string>()

  const { docs: allPosts } = await payload.find({
    collection: 'posts',
    trash: true,
    overrideAccess: true,
    limit: 0,
    pagination: false,
  })
  for (const post of allPosts) {
    for (const ref of extractPolyRefs(post as unknown as Record<string, unknown>)) {
      if (ref.relationTo === 'media-public') usedPublic.add(ref.id)
      else usedPrivate.add(ref.id)
    }
  }

  const { docs: allPages } = await payload.find({
    collection: 'pages',
    overrideAccess: true,
    limit: 0,
    pagination: false,
  })
  for (const page of allPages) {
    for (const id of extractPageBlockMediaIds(page as unknown as Record<string, unknown>)) {
      usedPublic.add(id)
    }
  }

  // 보존된 버전(과거에 저장됐다가 이후 교체된 버전)이 참조하는 미디어도
  // "이전 버전으로 복원" 시 필요하므로 함께 보호한다.
  const { docs: pageVersions } = await payload.findVersions({
    collection: 'pages',
    overrideAccess: true,
    limit: 0,
    pagination: false,
  })
  for (const { version } of pageVersions) {
    for (const id of extractPageBlockMediaIds(version as unknown as Record<string, unknown>)) {
      usedPublic.add(id)
    }
  }

  const { docs: postVersions } = await payload.findVersions({
    collection: 'posts',
    overrideAccess: true,
    limit: 0,
    pagination: false,
  })
  for (const { version } of postVersions) {
    for (const ref of extractPolyRefs(version as unknown as Record<string, unknown>)) {
      if (ref.relationTo === 'media-public') usedPublic.add(ref.id)
      else usedPrivate.add(ref.id)
    }
  }

  const homePage = await payload.findGlobal({ slug: 'home-page', overrideAccess: true })
  const slides = Array.isArray(homePage.mainSlides) ? homePage.mainSlides : []
  for (const slide of slides) {
    const id = extractDirectUploadId((slide as { image?: unknown })?.image)
    if (id) usedPublic.add(id)
  }
  for (const id of [
    extractDirectUploadId(homePage.templeIntro?.image),
    extractDirectUploadId(homePage.monkIntro?.image),
  ]) {
    if (id) usedPublic.add(id)
  }
  const cards = Array.isArray(homePage.prayerCards) ? homePage.prayerCards : []
  for (const card of cards) {
    const id = extractDirectUploadId((card as { image?: unknown })?.image)
    if (id) usedPublic.add(id)
  }

  const popup = await payload.findGlobal({ slug: 'popup-settings', overrideAccess: true })
  const popupImageId = extractDirectUploadId(popup.image)
  if (popupImageId) usedPublic.add(popupImageId)

  // Stage 1: SiteSettings.logo도 media-public을 참조한다. 여기서 빠뜨리면
  // 사이트 로고가 "고아 파일"로 오인돼 정리 작업에 삭제될 수 있다.
  const siteSettings = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })
  const logoId = extractDirectUploadId(siteSettings.logo)
  if (logoId) usedPublic.add(logoId)

  const gracePeriodCutoff = Date.now() - MEDIA_GRACE_PERIOD_MS
  const isPastGracePeriod = (media: { createdAt?: string | null }) => {
    const createdAt = media.createdAt ? new Date(media.createdAt).getTime() : 0
    return createdAt <= gracePeriodCutoff
  }

  let deletedPublic = 0
  const { docs: publicMedia } = await payload.find({
    collection: 'media-public',
    overrideAccess: true,
    limit: 0,
    pagination: false,
  })
  for (const media of publicMedia) {
    if (!usedPublic.has(String(media.id)) && isPastGracePeriod(media)) {
      await payload.delete({ collection: 'media-public', id: media.id, overrideAccess: true })
      deletedPublic++
    }
  }

  let deletedPrivate = 0
  const { docs: privateMedia } = await payload.find({
    collection: 'media-private',
    overrideAccess: true,
    limit: 0,
    pagination: false,
  })
  for (const media of privateMedia) {
    if (!usedPrivate.has(String(media.id)) && isPastGracePeriod(media)) {
      await payload.delete({ collection: 'media-private', id: media.id, overrideAccess: true })
      deletedPrivate++
    }
  }

  return { deletedPublic, deletedPrivate }
}
