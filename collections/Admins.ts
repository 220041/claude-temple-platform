import type { CollectionConfig } from 'payload'

import { writeAuditLog } from './hooks/writeAuditLog'

export const Admins: CollectionConfig = {
  slug: 'admins',
  labels: { singular: '관리자 계정', plural: '관리자 계정' },
  auth: true,
  admin: {
    group: '설정',
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'updatedAt'],
  },
  access: {
    create: ({ req: { user } }) => user?.collection === 'admins' && user.role === 'super-admin',
    read: ({ req: { user } }) => Boolean(user && user.collection === 'admins'),
    update: ({ req: { user } }) => user?.collection === 'admins' && user.role === 'super-admin',
    delete: ({ req: { user } }) => user?.collection === 'admins' && user.role === 'super-admin',
  },
  hooks: {
    // 첫 관리자 생성 화면(/admin/create-first-user)의 역할 기본값이 editor라, 그대로
    // 만들면 사이트 설정 저장·관리자 추가가 모두 최고관리자 전용이라 설치를 끝낼 수
    // 없다. 관리자가 한 명도 없을 때 만드는 계정은 항상 최고관리자로 만든다.
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'admins', overrideAccess: true, req })
        return totalDocs === 0 ? { ...data, role: 'super-admin' } : data
      },
    ],
    // guide.md 11.4절: 관리자 로그인·계정 변경을 감사기록에 남긴다.
    afterLogin: [
      async ({ user, req }) => {
        await writeAuditLog(req.payload, {
          actorId: user.id,
          action: 'admin-login',
          targetCollection: 'admins',
          targetId: user.id,
          req,
        })
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'update') return doc
        await writeAuditLog(req.payload, {
          actorId: req.user && req.user.collection === 'admins' ? req.user.id : undefined,
          action: 'admin-account-change',
          targetCollection: 'admins',
          targetId: doc.id,
          req,
        })
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: '최고관리자 (모든 설정 변경 가능)', value: 'super-admin' },
        { label: '편집자 (글·페이지 편집만 가능)', value: 'editor' },
      ],
    },
  ],
}
