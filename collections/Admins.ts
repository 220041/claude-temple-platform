import type { CollectionConfig } from 'payload'

import { writeAuditLog } from './hooks/writeAuditLog'

export const Admins: CollectionConfig = {
  slug: 'admins',
  auth: true,
  admin: {
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
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Editor', value: 'editor' },
      ],
    },
  ],
}
