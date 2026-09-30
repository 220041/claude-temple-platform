import type { CollectionAfterChangeHook } from 'payload'

import { writeAuditLog } from './writeAuditLog'

/**
 * guide.md 11.4절: 회원 정지·해제·강제탈퇴를 감사기록에 남긴다. status
 * 필드는 관리자만 수정할 수 있으므로(Members.ts), 이 훅에서 감지하는
 * 전이는 전부 관리자 조치다.
 */
export const auditMemberStatusChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (!req.user || req.user.collection !== 'admins') return doc
  if (!previousDoc || previousDoc.status === doc.status) return doc

  if (doc.status === 'suspended') {
    await writeAuditLog(req.payload, {
      actorId: req.user.id,
      action: 'member-suspend',
      targetCollection: 'members',
      targetId: doc.id,
      reason: doc.suspensionReason,
      req,
    })
  } else if (previousDoc.status === 'suspended' && doc.status === 'active') {
    await writeAuditLog(req.payload, {
      actorId: req.user.id,
      action: 'member-reactivate',
      targetCollection: 'members',
      targetId: doc.id,
      req,
    })
  } else if (doc.status === 'withdrawn') {
    await writeAuditLog(req.payload, {
      actorId: req.user.id,
      action: 'member-force-withdraw',
      targetCollection: 'members',
      targetId: doc.id,
      req,
    })
  }

  return doc
}
