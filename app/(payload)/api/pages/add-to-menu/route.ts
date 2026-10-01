import config from '@payload-config'
import { getPayload } from 'payload'

function extractRefId(ref: unknown): string | null {
  if (ref === null || ref === undefined) return null
  if (typeof ref === 'object' && 'id' in (ref as Record<string, unknown>)) {
    return String((ref as { id: unknown }).id)
  }
  return String(ref)
}

/**
 * 페이지 편집 화면의 "메뉴에 추가" 버튼(components/admin/pages/AddToMenuButton.tsx)이
 * 호출하는 엔드포인트 — 메뉴 편집 화면의 "새 페이지 만들기"(app/(payload)/api/menu/create-linked-page/route.ts)와
 * 정반대 방향이다. 메뉴 구조 변경은 최고관리자 전용이라는 기존 원칙(R5,
 * collections/Boards.ts의 superAdminOnly)을 그대로 따른다.
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

  const body = await request.json().catch(() => null)
  const pageId = body?.pageId
  if (pageId === undefined || pageId === null) {
    return Response.json({ error: 'pageId가 필요합니다.' }, { status: 400 })
  }

  const page = await payload.findByID({ collection: 'pages', id: pageId, overrideAccess: true }).catch(() => null)
  if (!page) {
    return Response.json({ error: '페이지를 찾을 수 없습니다.' }, { status: 404 })
  }

  const menu = await payload.findGlobal({ slug: 'main-menu', overrideAccess: true })
  const items = Array.isArray(menu.items) ? menu.items : []

  const alreadyLinked = items.some((item) => item.linkType === 'page' && extractRefId(item.pageRef) === String(pageId))
  if (alreadyLinked) {
    return Response.json({ error: '이 페이지는 이미 메뉴에 연결되어 있습니다.' }, { status: 409 })
  }

  await payload.updateGlobal({
    slug: 'main-menu',
    overrideAccess: true,
    data: {
      items: [
        ...items,
        {
          label: page.title,
          visible: true,
          showInTop: true,
          showInBottom: true,
          linkType: 'page',
          pageRef: pageId,
          children: [],
        },
      ],
    },
  })

  return Response.json({ ok: true })
}
