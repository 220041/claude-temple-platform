import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionBeforeDeleteHook } from 'payload'

import { writeAuditLog } from './writeAuditLog'

/**
 * guide.md 11.4절: 관리자가 수행한 게시·보관·복원을 감사기록에 남긴다
 * (회원 자신의 즉시공개 게시물 작성은 대상이 아니다 — 그건 운영 조치가
 * 아니라 일반적인 글쓰기다).
 */
export const auditPostChanges: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (!req.user || req.user.collection !== 'admins') return doc

  if (previousDoc && previousDoc._status !== 'published' && doc._status === 'published') {
    await writeAuditLog(req.payload, {
      actorId: req.user.id,
      action: 'content-publish',
      targetCollection: 'posts',
      targetId: doc.id,
      req,
    })
  }

  if (previousDoc && !previousDoc.archived && doc.archived) {
    await writeAuditLog(req.payload, {
      actorId: req.user.id,
      action: 'content-archive',
      targetCollection: 'posts',
      targetId: doc.id,
      req,
    })
  }

  if (previousDoc && previousDoc.moderationStatus !== doc.moderationStatus) {
    await writeAuditLog(req.payload, {
      actorId: req.user.id,
      action: 'content-moderation',
      targetCollection: 'posts',
      targetId: doc.id,
      reason: doc.moderationReason || undefined,
      metadata: { from: previousDoc.moderationStatus, to: doc.moderationStatus },
      req,
    })
  }

  if (previousDoc?.deletedAt && !doc.deletedAt) {
    await writeAuditLog(req.payload, {
      actorId: req.user.id,
      action: 'content-restore',
      targetCollection: 'posts',
      targetId: doc.id,
      req,
    })
  }

  return doc
}

export const auditPostPermanentDelete: CollectionAfterDeleteHook = async ({ id, req }) => {
  if (!req.user || req.user.collection !== 'admins') return
  await writeAuditLog(req.payload, {
    actorId: req.user.id,
    action: 'content-permanent-delete',
    targetCollection: 'posts',
    targetId: id,
    req,
  })
}

/**
 * guide.md 10.3절: 영구삭제 시 고아 데이터가 남지 않게 한다. comments.post는
 * 필수 필드라 게시물을 먼저 지우면 FK 제약(ON DELETE SET NULL 기본값)과
 * 충돌해 게시물 삭제 자체가 실패하므로, beforeDelete에서 댓글을 먼저
 * 정리한다(afterDelete 시점에는 이미 삭제가 실패해 실행되지 않는다).
 */
export const cascadeDeletePostRelations: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const { docs: comments } = await req.payload.find({
    collection: 'comments',
    where: { post: { equals: id } },
    trash: true,
    overrideAccess: true,
    limit: 1000,
    req,
  })
  for (const comment of comments) {
    // 위 find가 trash:true로 이미 trash 상태인 댓글까지 대상에 포함했으므로,
    // 삭제 시에도 trash:true를 줘야 그 댓글이 "찾아진다"(가이드에서 이미
    // 여러 번 확인한 패턴: trash 파라미터를 안 주면 이미 trash인 문서는
    // 기본 조회 범위에서 빠져 NotFound가 난다).
    await req.payload.delete({ collection: 'comments', id: comment.id, trash: true, overrideAccess: true, req })
  }
}
