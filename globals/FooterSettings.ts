import type { GlobalConfig } from 'payload'

import { adminOnly } from '../lib/access'
import { shellPreviewUrl } from '../lib/previewUrl'

/**
 * guide.md 6절: 푸터 — 주소, 전화번호, 이메일, 저작권 문구.
 * 계좌정보·SNS 링크는 기존 디자인에 노출 자리가 없고 운영자 요청으로
 * 이 단계에서는 제외한다.
 */
export const FooterSettings: GlobalConfig = {
  slug: 'footer-settings',
  admin: {
    group: '홈페이지',
    preview: () => shellPreviewUrl(),
  },
  versions: {
    drafts: {
      autosave: false,
      schedulePublish: true,
    },
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    { name: 'address', label: '주소', type: 'textarea' },
    { name: 'phone', label: '전화번호', type: 'text' },
    { name: 'fax', label: '팩스', type: 'text' },
    { name: 'email', label: '이메일', type: 'email' },
    { name: 'copyrightText', label: '저작권 문구', type: 'text' },
  ],
}
