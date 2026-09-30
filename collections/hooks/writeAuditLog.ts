import type { Payload } from 'payload'

type CreateArgs = Parameters<Payload['create']>[0]

type AuditAction =
  | 'admin-login'
  | 'admin-account-change'
  | 'content-publish'
  | 'content-archive'
  | 'content-restore'
  | 'content-permanent-delete'
  | 'member-suspend'
  | 'member-reactivate'
  | 'member-force-withdraw'
  | 'report-processed'
  | 'site-settings-change'
  | 'data-restore'

/**
 * guide.md 11.4절 감사기록 대상 이벤트를 기록하는 공용 헬퍼.
 * actorId가 없으면(시스템 동작 등) 기록을 남기지 않는다 — AuditLogs.actor는
 * 필수 필드이므로 실행 주체가 확인되는 경우만 남긴다.
 */
export async function writeAuditLog(
  payload: Payload,
  args: {
    actorId: number | string | undefined
    action: AuditAction
    targetCollection?: string
    targetId?: string | number
    reason?: string
    metadata?: Record<string, unknown>
    req?: CreateArgs['req']
  },
) {
  if (!args.actorId) return

  try {
    await payload.create({
      collection: 'audit-logs',
      data: {
        actor: Number(args.actorId),
        action: args.action,
        targetCollection: args.targetCollection,
        targetId: args.targetId !== undefined ? String(args.targetId) : undefined,
        reason: args.reason,
        metadata: args.metadata,
      },
      overrideAccess: true,
      req: args.req,
    })
  } catch (err) {
    payload.logger.error({ err }, 'Failed to write audit log')
  }
}
