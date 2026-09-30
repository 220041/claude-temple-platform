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
import { PopupSettings } from './globals/PopupSettings'
import { SiteSettings } from './globals/SiteSettings'
import { buildEmailAdapter } from './lib/email'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL,
  admin: {
    user: Admins.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeDashboard: ['@/components/admin/RateLimitAlertCard#RateLimitAlertCard'],
    },
  },
  collections: [Admins, Members, MediaPublic, MediaPrivate, Pages, Boards, Posts, Comments, Reports, AuditLogs, SecurityEvents],
  globals: [SiteSettings, HomePage, FooterSettings, PopupSettings],
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
