import config from '@payload-config'
import { getPayload } from 'payload'
import { isReservedPath } from '@/lib/reservedPaths'

/**
 * 메뉴 편집 화면의 "새 페이지 만들기" 선택지가 호출하는 엔드포인트.
 * app/(payload)/api/pages/preview/route.ts와 같은 2중 인증 패턴(세션
 * 확인은 secret 쿼리 대신 여기서는 메뉴 구조 변경 권한이므로
 * super-admin 역할까지 확인)을 쓴다 — 초안 Pages 문서를 만들고
 * {id, slug}를 돌려주면, 관리자 화면이 그 자리에서 linkType을
 * 'page'로, pageRef를 새 문서 id로 바꿔치기한다.
 */
export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user || user.collection !== 'admins') {
    return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }
  if (user.role !== 'super-admin') {
    return Response.json({ error: '메뉴 구조를 변경할 권한이 없습니다.' }, { status: 403 })
  }

  const slug = await generateUniqueSlug(payload)

  const page = await payload.create({
    collection: 'pages',
    data: { title: '새 페이지', slug, blocks: [], _status: 'draft' },
    overrideAccess: true,
  })

  return Response.json({ id: page.id, slug: page.slug })
}

async function generateUniqueSlug(payload: Awaited<ReturnType<typeof getPayload>>): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `new-page-${Math.random().toString(36).slice(2, 8)}`
    if (isReservedPath(candidate)) continue

    const [bySlug, byHistory] = await Promise.all([
      payload.find({ collection: 'pages', where: { slug: { equals: candidate } }, overrideAccess: true, limit: 1 }),
      payload.find({ collection: 'pages', where: { 'slugHistory.slug': { equals: candidate } }, overrideAccess: true, limit: 1 }),
    ])
    if (bySlug.totalDocs === 0 && byHistory.totalDocs === 0) return candidate
  }
  throw new Error('고유한 주소를 생성하지 못했습니다. 다시 시도해주세요.')
}
