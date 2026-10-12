import type { CollectionConfig } from 'payload'

const superAdminOnly = ({ req: { user } }: { req: { user: { collection?: string; role?: string } | null } }) =>
  Boolean(user && user.collection === 'admins' && user.role === 'super-admin')

/**
 * guide.md 11.4절: 관리자 로그인·계정 변경, 게시·보관·복원·영구삭제,
 * 회원 정지·해제·강제탈퇴, 신고 처리, 사이트 설정 변경, 데이터 복구
 * 실행을 기록한다. 최고관리자만 열람하고(3.1절), 아무도 수정·삭제할
 * 수 없는 불변 로그다. 생성은 서버 코드(hooks/writeAuditLog.ts)에서만
 * overrideAccess로 수행하므로 access.create는 항상 막아둔다.
 */
export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  labels: { singular: '감사 기록', plural: '감사 기록' },
  admin: {
    group: '운영',
    useAsTitle: 'action',
    defaultColumns: ['action', 'actor', 'targetCollection', 'targetId', 'createdAt'],
  },
  access: {
    read: superAdminOnly,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'actor', label: '처리한 관리자', type: 'relationship', relationTo: 'admins', required: true },
    {
      name: 'action',
      label: '처리 종류',
      type: 'select',
      required: true,
      options: [
        { label: '관리자 로그인', value: 'admin-login' },
        { label: '관리자 계정 변경', value: 'admin-account-change' },
        { label: '콘텐츠 게시', value: 'content-publish' },
        { label: '콘텐츠 보관', value: 'content-archive' },
        { label: '콘텐츠 복원', value: 'content-restore' },
        { label: '콘텐츠 영구삭제', value: 'content-permanent-delete' },
        { label: '회원 글 승인 상태 변경', value: 'content-moderation' },
        { label: '회원 정지', value: 'member-suspend' },
        { label: '회원 정지 해제', value: 'member-reactivate' },
        { label: '회원 강제탈퇴', value: 'member-force-withdraw' },
        { label: '신고 처리', value: 'report-processed' },
        { label: '사이트 설정 변경', value: 'site-settings-change' },
        { label: '데이터 복구 실행', value: 'data-restore' },
      ],
    },
    { name: 'targetCollection', label: '대상 종류', type: 'text' },
    { name: 'targetId', label: '대상 번호', type: 'text' },
    { name: 'reason', label: '사유', type: 'text' },
    { name: 'metadata', label: '상세 정보', type: 'json' },
  ],
}
