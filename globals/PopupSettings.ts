import type { GlobalConfig } from 'payload'

const adminOnly = ({ req: { user } }: { req: { user: { collection?: string } | null } }) =>
  Boolean(user && user.collection === 'admins')

/** guide.md 6절: 팝업 — 제목, 이미지, 연결 URL, 노출 시작일/종료일, 하루 동안 보지 않기. */
export const PopupSettings: GlobalConfig = {
  slug: 'popup-settings',
  admin: {
    group: '홈페이지',
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    { name: 'enabled', label: '노출 여부', type: 'checkbox', defaultValue: false },
    { name: 'title', label: '제목', type: 'text' },
    { name: 'image', label: '이미지', type: 'upload', relationTo: 'media-public' },
    { name: 'linkUrl', label: '연결 URL', type: 'text' },
    { name: 'startDate', label: '노출 시작일', type: 'date' },
    { name: 'endDate', label: '노출 종료일', type: 'date' },
    {
      name: 'allowHideForOneDay',
      label: '하루 동안 보지 않기 옵션 표시',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
