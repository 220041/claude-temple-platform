import { pathForBoardKey } from './boards'
import type { MainMenu } from '../payload-types'

type RawMenuItem = NonNullable<MainMenu['items']>[number]
type RawMenuChild = NonNullable<RawMenuItem['children']>[number]

export type ResolvedMenuLink = {
  label: string
  href: string | null
  children: { label: string; href: string | null }[]
}

type LinkTarget = Pick<RawMenuItem | RawMenuChild, 'linkType' | 'pageRef' | 'boardRef' | 'externalUrl'>

function resolveHref(item: LinkTarget): string | null {
  switch (item.linkType) {
    case 'page': {
      const ref = item.pageRef
      if (ref && typeof ref === 'object' && typeof ref.slug === 'string') return `/pages/${ref.slug}`
      return null
    }
    case 'board': {
      const ref = item.boardRef
      if (ref && typeof ref === 'object' && typeof ref.boardKey === 'string') return pathForBoardKey(ref.boardKey)
      return null
    }
    case 'url':
      return item.externalUrl || null
    default:
      return null
  }
}

/**
 * 헤더 유틸리티 바 링크. 대상 페이지가 비공개라 해석에 실패한 항목(href
 * 없음)은 죽은 링크가 되지 않도록 제외한다.
 */
export function buildUtilityLinks(menu: MainMenu | null | undefined): { label: string; href: string }[] {
  const links: { label: string; href: string }[] = []
  for (const link of menu?.utilityLinks ?? []) {
    const href = resolveHref(link)
    if (href) links.push({ label: link.label, href })
  }
  return links
}

/**
 * MainMenu.items를 header.tsx/footer.tsx가 바로 쓸 수 있는 트리로
 * 변환한다. visible이 아니거나 해당 위치(top/bottom)에 표시되지 않는
 * 항목은 제외 — "#" 플레이스홀더였던 항목들은 백필 시 visible:false로
 * 전환돼 있으므로 여기서 자연히 걸러진다(죽은 링크가 아니라 완전히
 * 사라짐).
 */
export function buildMenuTree(menu: MainMenu | null | undefined, placement: 'top' | 'bottom'): ResolvedMenuLink[] {
  const items = menu?.items ?? []
  const placementKey = placement === 'top' ? 'showInTop' : 'showInBottom'

  return items
    .filter((item) => item.visible !== false && item[placementKey] !== false)
    .map((item) => ({
      label: item.label,
      href: resolveHref(item),
      children: (item.children ?? [])
        .filter((child) => child.visible !== false && child[placementKey] !== false)
        .map((child) => ({ label: child.label, href: resolveHref(child) })),
    }))
}
