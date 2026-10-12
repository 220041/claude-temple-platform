import type { CollectionConfig } from 'payload'

import { writeAuditLog } from './hooks/writeAuditLog'

const isAdmin = (user: { collection?: string } | null) => Boolean(user && user.collection === 'admins')

const getRelationId = (value: unknown): string | number | undefined => {
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: string | number }).id
  if (typeof value === 'string' || typeof value === 'number') return value
  return undefined
}

/**
 * guide.md 12절: 게시물·댓글 신고. 자동 숨김/자동 삭제는 하지 않고
 * 관리자가 유지/숨김/삭제/회원제한 중 하나를 선택해 처리한다. 신고·
 * 관리자 조치 기록은 최소 1년 보관한다(AuditLogs와 별도로 이 컬렉션
 * 자체를 삭제하지 않는 것으로 보관 요건을 충족한다).
 */
export const Reports: CollectionConfig = {
  slug: 'reports',
  labels: { singular: '신고', plural: '신고' },
  admin: {
    group: '운영',
    useAsTitle: 'reason',
    defaultColumns: ['target', 'reason', 'resolution', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => isAdmin(user),
    create: ({ req: { user } }) => Boolean(user && user.collection === 'members'),
    update: ({ req: { user } }) => isAdmin(user),
    delete: () => false,
  },
  hooks: {
    beforeChange: [
      ({ data, req: { user } }) => {
        if (user && user.collection === 'members') {
          data.reporterMember = user.id
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        // 신고 접수 시 대상 게시물/댓글의 신고 누적 수를 올린다(3건 이상 시
        // 관리자 화면에서 긴급 검토 대상으로 식별할 수 있도록).
        if (operation === 'create') {
          const collection = doc.target?.relationTo
          const id = getRelationId(doc.target?.value)
          if (collection && id !== undefined) {
            // 신고수 증가는 참고용 카운터일 뿐이라, 일시적인 DB 락 경합으로
            // 실패해도 신고 접수 자체가 실패해서는 안 된다.
            try {
              const current = await req.payload.findByID({ collection, id, overrideAccess: true, req })
              await req.payload.update({
                collection,
                id,
                data: { reportCount: (current?.reportCount ?? 0) + 1 },
                overrideAccess: true,
                req,
              })
            } catch (err) {
              req.payload.logger.error({ err }, 'Failed to increment reportCount')
            }
          }
        }

        // 처리 완료(resolution이 새로 채워짐)를 감사기록에 남긴다.
        if (doc.resolution && doc.resolution !== previousDoc?.resolution) {
          await writeAuditLog(req.payload, {
            actorId: req.user && req.user.collection === 'admins' ? req.user.id : undefined,
            action: 'report-processed',
            targetCollection: 'reports',
            targetId: doc.id,
            reason: doc.resolutionReason,
            metadata: { resolution: doc.resolution, target: doc.target },
            req,
          })
        }

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'target',
      label: '신고 대상',
      type: 'relationship',
      relationTo: ['posts', 'comments'],
      required: true,
    },
    {
      name: 'reason',
      label: '신고 사유',
      type: 'select',
      required: true,
      options: [
        { label: '광고·홍보', value: 'ad' },
        { label: '욕설·비방', value: 'abuse' },
        { label: '음란·불법 콘텐츠', value: 'illegal' },
        { label: '개인정보 노출', value: 'privacy' },
        { label: '도배', value: 'spam' },
        { label: '종교·정치 분쟁 유도', value: 'conflict' },
        { label: '기타', value: 'other' },
      ],
    },
    { name: 'reasonDetail', label: '상세 사유', type: 'textarea' },
    { name: 'reporterMember', label: '신고한 회원', type: 'relationship', relationTo: 'members', admin: { readOnly: true } },
    {
      name: 'resolution',
      label: '처리 결과',
      type: 'select',
      options: [
        { label: '유지', value: 'kept' },
        { label: '숨김', value: 'hidden' },
        { label: '삭제', value: 'deleted' },
        { label: '회원 제한', value: 'memberRestricted' },
      ],
    },
    { name: 'resolutionReason', label: '처리 사유', type: 'text' },
  ],
}
