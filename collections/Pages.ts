import type { CollectionConfig } from 'payload'

import { pageBlocks } from '../blocks/pageBlocks'

const adminOnly = ({ req: { user } }: { req: { user: { collection?: string } | null } }) =>
  Boolean(user && user.collection === 'admins')

/**
 * guide.md 4단계/5.2절: 정적 페이지. 메뉴 구조·URL·레이아웃은 코드로 고정하고,
 * 관리자는 제한된 블록으로 본문 콘텐츠만 편집한다.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    group: '홈페이지',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    preview: (doc, { req }) => {
      const base = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
      const slug = typeof doc?.slug === 'string' ? doc.slug : ''
      // 미리보기 URL 전용 값. 앱 인증에 쓰이는 PAYLOAD_SECRET을 그대로
      // 노출하면 그 값이 유출됐을 때 로그인 토큰 위조까지 가능해지므로,
      // 용도를 미리보기 링크 검증으로만 한정한 별도 값을 쓴다(실제 접근
      // 제어는 이 값과 무관하게 app/(payload)/api/pages/preview/route.ts가
      // 관리자 세션을 따로 검증한다).
      return `${base}/api/pages/preview?slug=${encodeURIComponent(slug)}&secret=${process.env.PAGE_PREVIEW_SECRET ?? ''}`
    },
  },
  access: {
    read: ({ req: { user } }) => {
      if (user && user.collection === 'admins') return true
      return { _status: { equals: 'published' } }
    },
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  versions: {
    drafts: {
      autosave: false,
      schedulePublish: true,
    },
    maxPerDoc: 30,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL 경로: /pages/이 값' },
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: pageBlocks,
    },
  ],
}
