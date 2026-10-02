import { getPayload } from 'payload'
import config from '@payload-config'

type FlatItem = {
  boardRef?: unknown
  externalUrl?: string | null
  label?: string | null
  linkType?: string | null
  pageRef?: unknown
}

function extractRefId(ref: unknown): number | string | null {
  if (ref === null || ref === undefined) return null
  if (typeof ref === 'object' && 'id' in (ref as Record<string, unknown>)) {
    return (ref as { id: number | string }).id
  }
  return ref as number | string
}

/**
 * 메뉴 항목이 가리키는 페이지/게시판이 삭제됐거나(관계가 끊김) 페이지가
 * 비공개(draft) 상태면 경고만 표시한다 — 저장을 막지는 않는다(지시서
 * 4.1절 "게시 전에 경고" 문구를 차단이 아닌 경고로 해석). 메뉴 편집
 * 화면과 관리자 대시보드 양쪽에서 재사용한다.
 */
export async function MenuLinkWarnings() {
  const payload = await getPayload({ config })
  const menu = await payload.findGlobal({ slug: 'main-menu', draft: true, overrideAccess: true, depth: 0 })

  const items = (menu.items ?? []) as FlatItem[]
  const flat: FlatItem[] = []
  for (const item of items) {
    flat.push(item)
    for (const child of (item as { children?: FlatItem[] }).children ?? []) flat.push(child)
  }
  for (const link of ((menu as { utilityLinks?: FlatItem[] }).utilityLinks ?? [])) flat.push(link)

  const warnings: string[] = []

  for (const item of flat) {
    const label = item.label ?? '(이름 없음)'
    if (item.linkType === 'page') {
      const id = extractRefId(item.pageRef)
      if (!id) {
        warnings.push(`메뉴 "${label}"에 연결된 페이지가 없습니다.`)
        continue
      }
      try {
        const page = await payload.findByID({ collection: 'pages', id, overrideAccess: true })
        if (page._status !== 'published') {
          warnings.push(`메뉴 "${label}"이 연결된 페이지("${page.title}")는 아직 공개되지 않은 초안 상태입니다.`)
        }
      } catch {
        warnings.push(`메뉴 "${label}"이 연결된 페이지를 찾을 수 없습니다(삭제되었을 수 있습니다).`)
      }
    } else if (item.linkType === 'board') {
      const id = extractRefId(item.boardRef)
      if (!id) {
        warnings.push(`메뉴 "${label}"에 연결된 게시판이 없습니다.`)
        continue
      }
      try {
        await payload.findByID({ collection: 'boards', id, overrideAccess: true })
      } catch {
        warnings.push(`메뉴 "${label}"이 연결된 게시판을 찾을 수 없습니다(삭제되었을 수 있습니다).`)
      }
    }
  }

  if (warnings.length === 0) return null

  return (
    <div
      style={{
        margin: '16px 0',
        padding: '16px 20px',
        borderRadius: '6px',
        background: '#4a3312',
        border: '1px solid #d97706',
        color: '#fff',
      }}
    >
      <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>⚠️ 메뉴 연결 확인 필요 {warnings.length}건</p>
      <ul style={{ margin: '10px 0 0', paddingLeft: '18px', fontSize: '13px' }}>
        {warnings.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ul>
    </div>
  )
}
