import type { CollectionConfig } from 'payload'

import { validateAndStripImage } from './hooks/validateAndStripImage'

/**
 * guide.md 10.1: 홈페이지/정적 페이지/관리자 작성 게시물/회주·주지스님
 * 포토갤러리/법문·공지 이미지 등 공개해도 되는 이미지 전용 저장소.
 */
export const MediaPublic: CollectionConfig = {
  slug: 'media-public',
  admin: {
    group: '미디어',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user && user.collection === 'admins'),
    update: ({ req: { user } }) => Boolean(user && user.collection === 'admins'),
    delete: ({ req: { user } }) => Boolean(user && user.collection === 'admins'),
  },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 400,
        fit: 'cover',
      },
    ],
    resizeOptions: {
      width: 2560,
      height: 2560,
      fit: 'inside',
      withoutEnlargement: true,
    },
  },
  hooks: {
    beforeOperation: [validateAndStripImage],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
}
