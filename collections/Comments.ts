import type { Access, CollectionConfig, Where } from 'payload'

import { validateComment } from './hooks/validateComment'

const getRelationId = (value: unknown): string | number | undefined => {
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: string | number }).id
  if (typeof value === 'string' || typeof value === 'number') return value
  return undefined
}

/**
 * guide.md 9.1절: 댓글과 1단계 답글(parentComment)만 지원한다. 비밀글의
 * 댓글은 그 게시물을 볼 수 있는 사람만 볼 수 있다(Posts.access.read와
 * 동일한 조건을 게시물 관계를 통해 재사용).
 */
export const Comments: CollectionConfig = {
  slug: 'comments',
  trash: true,
  admin: {
    group: '게시판',
    useAsTitle: 'content',
    defaultColumns: ['post', 'memberAuthor', 'content', 'reportCount', 'createdAt'],
  },
  access: {
    read: (async ({ req }) => {
      const { user, payload } = req
      if (user && user.collection === 'admins') return true

      const now = new Date().toISOString()
      const readablePostIds = await payload.find({
        collection: 'posts',
        limit: 0,
        pagination: false,
        overrideAccess: true,
        req,
        where: {
          and: [
            { _status: { equals: 'published' } },
            { archived: { not_equals: true } },
            { hiddenAt: { exists: false } },
            { or: [{ expiresAt: { exists: false } }, { expiresAt: { greater_than: now } }] },
            user && user.collection === 'members'
              ? { or: [{ visibility: { not_equals: 'secret' } }, { memberAuthor: { equals: user.id } }] }
              : { visibility: { not_equals: 'secret' } },
            // Stage 3: Posts.access.read의 moderationStatus 조건과 동일하게
            // 맞춘다 — 안 그러면 승인대기/반려 글 자체는 안 보여도 거기 달린
            // 댓글은 이 inline where를 그대로 통과해 노출된다.
            user && user.collection === 'members'
              ? { or: [{ moderationStatus: { not_in: ['pending', 'rejected'] } }, { memberAuthor: { equals: user.id } }] }
              : { moderationStatus: { not_in: ['pending', 'rejected'] } },
          ],
        },
      })

      const where: Where = {
        and: [{ hiddenAt: { exists: false } }, { post: { in: readablePostIds.docs.map((d) => d.id) } }],
      }
      return where
    }) satisfies Access,
    create: ({ req: { user } }) => Boolean(user && user.collection === 'members'),
    update: (async ({ req, id }) => {
      const { user, payload } = req
      if (user && user.collection === 'admins') return true
      if (!user || user.collection !== 'members' || id === undefined) return false
      const doc = await payload.findByID({ collection: 'comments', id, overrideAccess: true, req })
      return Boolean(doc && getRelationId(doc.memberAuthor) === user.id)
    }) satisfies Access,
    // Posts.ts와 동일한 이유로 delete를 data.deletedAt 유무에 따라 분기한다:
    // 본인 댓글의 trash 진입은 허용, 진짜 영구삭제는 최고관리자만 허용.
    delete: (async ({ req, id, data }) => {
      const { user, payload } = req
      if (user && user.collection === 'admins' && user.role === 'super-admin') return true

      const isTrashEntry = data && typeof data === 'object' && 'deletedAt' in data && data.deletedAt != null
      if (isTrashEntry && user && user.collection === 'members' && id !== undefined) {
        const doc = await payload.findByID({ collection: 'comments', id, overrideAccess: true, req })
        return Boolean(doc && getRelationId(doc.memberAuthor) === user.id)
      }

      return false
    }) satisfies Access,
  },
  hooks: {
    beforeValidate: [validateComment],
  },
  fields: [
    { name: 'post', type: 'relationship', relationTo: 'posts', required: true, index: true },
    { name: 'parentComment', type: 'relationship', relationTo: 'comments' },
    { name: 'content', type: 'textarea', required: true },
    { name: 'memberAuthor', type: 'relationship', relationTo: 'members', admin: { readOnly: true } },
    { name: 'hiddenAt', label: '관리자 숨김 시각', type: 'date', admin: { readOnly: true } },
    { name: 'moderationReason', label: '관리자 조치 사유', type: 'text' },
    {
      name: 'reportCount',
      label: '누적 신고 수',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, components: { Cell: '@/components/admin/ReportCountCell#ReportCountCell' } },
    },
  ],
}
