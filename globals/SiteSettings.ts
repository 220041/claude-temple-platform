import type { GlobalConfig } from 'payload'

import { writeAuditLog } from '../collections/hooks/writeAuditLog'

const adminOnly = ({ req: { user } }: { req: { user: { collection?: string } | null } }) =>
  Boolean(user && user.collection === 'admins')

/**
 * guide.md 21절 권장 Global. 사이트 전역 기본값을 담는다.
 * 상세 SEO 필드(9단계)는 이후 단계에서 이 Global에 이어서 추가한다.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: '홈페이지',
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    // guide.md 11.4절: 사이트 설정 변경을 감사기록에 남긴다.
    afterChange: [
      async ({ doc, req }) => {
        if (req.user && req.user.collection === 'admins') {
          await writeAuditLog(req.payload, {
            actorId: req.user.id,
            action: 'site-settings-change',
            targetCollection: 'site-settings',
            req,
          })
        }
        return doc
      },
    ],
  },
  fields: [
    { name: 'siteName', label: '사이트명', type: 'text' },
    { name: 'siteDescription', label: '사이트 설명', type: 'textarea' },
  ],
}
