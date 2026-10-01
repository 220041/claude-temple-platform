import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Admins } from './collections/Admins'
import { AuditLogs } from './collections/AuditLogs'
import { Boards } from './collections/Boards'
import { Comments } from './collections/Comments'
import { MediaPrivate } from './collections/MediaPrivate'
import { MediaPublic } from './collections/MediaPublic'
import { Members } from './collections/Members'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Reports } from './collections/Reports'
import { SecurityEvents } from './collections/SecurityEvents'
import { FooterSettings } from './globals/FooterSettings'
import { HomePage } from './globals/HomePage'
import { MainMenu } from './globals/MainMenu'
import { PopupSettings } from './globals/PopupSettings'
import { SiteSettings } from './globals/SiteSettings'
import { buildEmailAdapter } from './lib/email'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL,
  admin: {
    user: Admins.slug,
    meta: {
      // 사찰마다 다른 admin.meta는 Payload config 평가 시점에 DB를 읽어야
      // 해 복잡도가 크다(관리자 화면 부팅 전 DB 왕복) — 이번 범위에서는
      // 범용 문구만 두고, 사찰별 관리자 타이틀은 이후 단계로 미룬다.
      titleSuffix: ' | 관리자',
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    // Pages/HomePage 편집 화면에 PC는 분할 화면, 모바일은 편집/미리보기
    // 전환 탭을 제공한다(Payload 관리자 UI가 기본 제공). url은 각각의
    // 기존 미리보기 라우트(secret 확인 + draftMode 활성화 후 리다이렉트)를
    // 재사용 — 그래야 iframe이 공개본이 아니라 초안을 보여준다.
    livePreview: {
      collections: ['pages'],
      globals: ['home-page'],
      url: ({ data, globalConfig }) => {
        const base = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
        const secret = process.env.PAGE_PREVIEW_SECRET ?? ''
        if (globalConfig?.slug === 'home-page') {
          return `${base}/api/home-preview?secret=${secret}`
        }
        return `${base}/api/pages/preview?slug=${encodeURIComponent(data.slug ?? '')}&secret=${secret}`
      },
      breakpoints: [
        { label: '모바일', name: 'mobile', width: 375, height: 667 },
        { label: '태블릿', name: 'tablet', width: 768, height: 1024 },
      ],
    },
    components: {
      beforeDashboard: [
        '@/components/admin/RateLimitAlertCard#RateLimitAlertCard',
        '@/components/admin/ModerationQueueCard#ModerationQueueCard',
        '@/components/admin/QuickActionsCard#QuickActionsCard',
        '@/components/admin/menu/MenuLinkWarnings#MenuLinkWarnings',
      ],
    },
  },
  collections: [Admins, Members, MediaPublic, MediaPrivate, Pages, Boards, Posts, Comments, Reports, AuditLogs, SecurityEvents],
  globals: [SiteSettings, HomePage, FooterSettings, PopupSettings, MainMenu],
  editor: lexicalEditor(),
  email: buildEmailAdapter(),
  secret: process.env.PAYLOAD_SECRET || '',
  // next.js also depends on a (slightly older) sharp version, so pnpm keeps
  // two physical copies around; TS resolves payload's `sharp` type against
  // that other copy's structurally-near-identical-but-nominally-different
  // types. Functionally this is the same sharp we tested against above.
  sharp: sharp as unknown as Parameters<typeof buildConfig>[0]['sharp'],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),
  plugins: [
    // Public media: URLs point directly at the Vercel Blob CDN for speed —
    // these are fine to expose since access.read on the collection is public.
    vercelBlobStorage({
      collections: {
        [MediaPublic.slug]: { disablePayloadAccessControl: true },
      },
      token: process.env.BLOB_READ_WRITE_TOKEN_PUBLIC,
      addRandomSuffix: true,
    }),
    // Private media: leave disablePayloadAccessControl at its default
    // (false), so `url` stays Payload's own /api/media-private/file/...
    // endpoint. Payload proxies that request through the collection's
    // access.read check before streaming the blob, so the real CDN URL is
    // never exposed to the client (guide.md 10.1/10.3).
    vercelBlobStorage({
      collections: {
        [MediaPrivate.slug]: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN_PRIVATE,
      addRandomSuffix: true,
    }),
  ],
})
