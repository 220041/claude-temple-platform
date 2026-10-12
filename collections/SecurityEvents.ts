import type { CollectionConfig } from 'payload'

const superAdminOnly = ({ req: { user } }: { req: { user: { collection?: string; role?: string } | null } }) =>
  Boolean(user && user.collection === 'admins' && user.role === 'super-admin')

/**
 * 공개 엔드포인트(비밀번호 재설정/회원가입/이메일 재발송/게시물 작성)의
 * rate limit 시도 기록. AuditLogs는 관리자 행위 전용(actor가 admins
 * 필수)이라 이메일/IP 같은 익명 식별자를 넣을 수 없어 별도 컬렉션으로
 * 분리한다. `lib/rateLimit.ts`가 매 시도마다 기록을 남기고(blocked
 * 여부와 무관하게, 다음 판단의 기준점이 되도록), 실제로 제한에 걸린
 * 시도만 `blocked: true`로 표시한다.
 */
export const SecurityEvents: CollectionConfig = {
  slug: 'security-events',
  labels: { singular: '보안 이벤트', plural: '보안 이벤트' },
  admin: {
    group: '운영',
    useAsTitle: 'identifier',
    defaultColumns: ['endpoint', 'identifier', 'blocked', 'createdAt'],
  },
  access: {
    read: superAdminOnly,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'endpoint', label: '요청 경로', type: 'text', required: true, index: true },
    { name: 'identifier', label: '식별 값', type: 'text', required: true, index: true },
    { name: 'blocked', label: '차단 여부', type: 'checkbox', defaultValue: false, index: true },
  ],
}
