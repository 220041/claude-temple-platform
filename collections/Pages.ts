import type { CollectionConfig, PayloadRequest } from 'payload'

import { pageBlocks } from '../blocks/pageBlocks'
import { adminOnly } from '../lib/access'
import { isReservedPath } from '../lib/reservedPaths'

/**
 * guide.md 4단계/5.2절: 정적 페이지. 메뉴 구조·URL·레이아웃은 코드로 고정하고,
 * 관리자는 제한된 블록으로 본문 콘텐츠만 편집한다.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: '페이지', plural: '페이지' },
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
  hooks: {
    // slug가 바뀌면 옛 주소를 slugHistory에 남겨, 기존에 공유된 링크가
    // 깨지지 않고 새 주소로 리다이렉트되게 한다(app/(frontend)/pages/[slug]/page.tsx).
    beforeChange: [
      ({ data, originalDoc, operation }) => {
        if (operation !== 'update' || !originalDoc) return data
        if (typeof data.slug !== 'string' || data.slug === originalDoc.slug) return data
        const history = Array.isArray(originalDoc.slugHistory) ? originalDoc.slugHistory : []
        data.slugHistory = [...history, { slug: originalDoc.slug, changedAt: new Date().toISOString() }]
        return data
      },
    ],
  },
  fields: [
    { name: 'title', label: '제목', type: 'text', required: true },
    {
      name: 'statusBadge',
      label: '',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/pages/StatusBadge#StatusBadge',
        },
      },
    },
    {
      name: 'slug',
      label: '주소 이름',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL 경로: /pages/이 값' },
      validate: async (value: string | null | undefined, { req, id }: { req: PayloadRequest; id?: number | string }) => {
        if (typeof value !== 'string' || !value) return '주소를 입력하세요.'
        if (isReservedPath(value)) return `"${value}"는 시스템이 사용하는 예약된 경로라 페이지 주소로 쓸 수 없습니다.`

        // 다른 페이지의 "이전 주소(slugHistory)"와 겹치면 리다이렉트가
        // 서로 충돌하므로, 살아있는 slug의 unique 제약과 별개로 여기서도 막는다.
        const { totalDocs } = await req.payload.find({
          collection: 'pages',
          where: {
            and: [{ 'slugHistory.slug': { equals: value } }, ...(id ? [{ id: { not_equals: id } }] : [])],
          },
          overrideAccess: true,
          limit: 1,
        })
        if (totalDocs > 0) return `"${value}"는 다른 페이지의 이전 주소로 이미 쓰인 적이 있어 사용할 수 없습니다.`

        return true
      },
    },
    {
      name: 'slugHistory',
      label: '이전 주소 기록',
      type: 'array',
      admin: { readOnly: true, description: '이전 주소 자동 기록(직접 수정 불가) — 옛 링크를 새 주소로 안내하는 데 쓰인다.' },
      fields: [
        { name: 'slug', type: 'text', required: true },
        { name: 'changedAt', label: '변경일', type: 'date' },
      ],
    },
    {
      name: 'templatePicker',
      label: '',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/pages/TemplatePicker#TemplatePicker',
        },
      },
    },
    {
      name: 'blocks',
      label: '내용 구성',
      type: 'blocks',
      blocks: pageBlocks,
    },
    {
      name: 'addToMenuAction',
      label: '',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/pages/AddToMenuButton#AddToMenuButton',
        },
      },
    },
  ],
}
