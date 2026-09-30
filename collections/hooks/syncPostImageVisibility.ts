import type { CollectionAfterChangeHook } from 'payload'

type PolyRelation = { relationTo: string; value: number | string } | number | string | null | undefined

function extractPrivateMediaIds(doc: Record<string, unknown>): (number | string)[] {
  const ids: (number | string)[] = []

  const addIfPrivate = (rel: PolyRelation) => {
    if (rel && typeof rel === 'object' && rel.relationTo === 'media-private') {
      // payload.create/update 호출부가 depth를 명시하지 않으면 관계 필드가
      // populate돼 rel.value가 raw id가 아니라 미디어 문서 전체 객체로 올
      // 수 있다(post-detail.tsx의 폴리모픽 필드 이슈와 같은 함정). 그 경우
      // id를 다시 꺼내야 하며, 안 그러면 뒤에서 payload.update(id: <object>)
      // 호출이 그대로 SQL에 객체를 넘겨 "invalid input syntax for type
      // integer" 에러로 실패한다(10단계에서 cleanup 테스트 중 재현·발견).
      const value = rel.value
      const id = value && typeof value === 'object' && 'id' in value ? (value as { id: number | string }).id : value
      ids.push(id)
    }
  }

  addIfPrivate(doc.featuredImage as PolyRelation)
  const images = Array.isArray(doc.images) ? doc.images : []
  for (const row of images) {
    addIfPrivate((row as { image?: PolyRelation })?.image)
  }

  return ids
}

function isPostVisible(doc: Record<string, unknown>): boolean {
  if (doc._status !== 'published') return false
  if (doc.archived) return false
  if (doc.hiddenAt) return false
  if (doc.expiresAt && new Date(doc.expiresAt as string).getTime() <= Date.now()) return false
  return true
}

/**
 * guide.md 10.1/10.3: MediaPrivate.access.read는 파일 스트리밍 시 다른
 * 컬렉션과 조인할 수 없으므로, 게시물이 저장될 때마다 이 게시물이
 * 참조하는 media-private 문서에 "공개 가능 여부"를 그대로 복제해 둔다.
 */
export const syncPostImageVisibility: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const currentIds = extractPrivateMediaIds(doc)
  const previousIds = previousDoc ? extractPrivateMediaIds(previousDoc) : []

  const isPublic = isPostVisible(doc) && doc.visibility !== 'secret'
  const ownerMember = doc.authorType === 'member' ? doc.memberAuthor : null
  const ownerId =
    ownerMember && typeof ownerMember === 'object' && 'id' in ownerMember
      ? (ownerMember as { id: unknown }).id
      : ownerMember

  for (const id of currentIds) {
    await req.payload.update({
      collection: 'media-private',
      id,
      data: { isPublic, ownerMember: ownerId },
      overrideAccess: true,
      req,
    })
  }

  // 게시물에서 빠진 이미지는 더 이상 이 게시물 덕분에 공개될 이유가
  // 없으므로 비공개로 되돌린다(다른 게시물이 같은 이미지를 재사용하는
  // 경우는 이 스키마에서 발생하지 않는다).
  const removedIds = previousIds.filter((id) => !currentIds.includes(id))
  for (const id of removedIds) {
    await req.payload.update({
      collection: 'media-private',
      id,
      data: { isPublic: false, ownerMember: null },
      overrideAccess: true,
      req,
    })
  }

  return doc
}
