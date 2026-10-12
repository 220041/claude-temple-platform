import fs from 'node:fs'
import config from '../payload.config'
import { getPayload } from 'payload'

/**
 * 주간 백업 JSON(lib/backup.ts)을 **빈 새 DB**에 복구하는 수동 스크립트.
 *
 *   BACKUP_FILE=backup.json pnpm payload run scripts/restore-from-backup.ts
 *
 * - 마이그레이션이 끝난 비어 있는 DB에서만 실행한다(이미 데이터가 있으면 중단).
 * - id를 그대로 보존해 관계(게시물→게시판, 메뉴→페이지, 이미지 등)가 끊기지 않도록
 *   payload.db(저수준 어댑터)로 직접 넣는다. 훅·접근제어·검증을 거치지 않는다.
 * - 복구하지 않는 것: admins(비밀번호 해시가 백업에 없음 → 복구 후 새로 만들어야 함),
 *   members(이메일·실명이 백업에서 제거됨), reports/audit-logs/security-events(운영 기록),
 *   버전 이력, 업로드 파일 원본(Blob에 그대로 있고 media 문서의 url만 복구됨).
 *   이 컬렉션을 가리키던 필드(작성자 등)는 비운다.
 */
const SKIPPED = new Set(['admins', 'members', 'reports', 'audit-logs', 'security-events'])
// 건너뛴 컬렉션을 가리키는 필드 — 복구 시 비운다.
const NULLED_FIELDS: Record<string, string[]> = {
  posts: ['adminAuthor', 'memberAuthor'],
  comments: ['memberAuthor'],
}
// 외래키 의존 순서(부모 → 자식).
const ORDER = ['media-public', 'media-private', 'boards', 'pages', 'posts', 'comments']

const isPopulatedDoc = (v: unknown): v is { id: number | string } =>
  !!v && typeof v === 'object' && 'id' in v && 'createdAt' in v && 'updatedAt' in v

/** find(depth>0)가 펼쳐 둔 관계 문서를 id로 되돌린다(배열 행·블록은 createdAt이 없어 구분된다). */
function depopulate(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(depopulate)
  if (isPopulatedDoc(value)) return value.id
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, depopulate(v)]))
  }
  return value
}

/** 최상위 문서 자신은 그대로 두고 그 안의 값만 depopulate한다(문서도 id·createdAt·updatedAt을 가져 오인되기 때문). */
const depopulateDoc = (doc: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(doc).map(([k, v]) => [k, depopulate(v)]))

const isInternal = (slug: string) => slug.startsWith('payload-')

const file = process.env.BACKUP_FILE
if (!file) throw new Error('BACKUP_FILE 환경변수에 백업 JSON 경로를 지정하세요.')
const snapshot = JSON.parse(fs.readFileSync(file, 'utf8')) as {
  collections: Record<string, Record<string, unknown>[]>
  globals: Record<string, Record<string, unknown>>
}

const payload = await getPayload({ config })
const pool = (payload.db as unknown as { pool: { query: (q: string) => Promise<{ rows: Record<string, unknown>[] }> } }).pool

const existing = await pool.query(`select (select count(*) from pages)::int p, (select count(*) from boards)::int b, (select count(*) from posts)::int po`)
const e = existing.rows[0] as { p: number; b: number; po: number }
if (e.p + e.b + e.po > 0) throw new Error('대상 DB가 비어 있지 않습니다(pages/boards/posts). 빈 DB에서만 복구할 수 있습니다.')

const restored: Record<string, number> = {}
const slugs = [...ORDER, ...Object.keys(snapshot.collections).filter((s) => !ORDER.includes(s) && !SKIPPED.has(s) && !isInternal(s))]

for (const slug of slugs) {
  const docs = snapshot.collections[slug] ?? []
  // 댓글은 parentComment가 같은 컬렉션을 가리키므로 id 순(부모 먼저)으로 넣는다.
  const sorted = [...docs].sort((a, b) => Number(a.id) - Number(b.id))
  for (const raw of sorted) {
    const data = depopulateDoc(raw)
    for (const f of NULLED_FIELDS[slug] ?? []) delete data[f]
    await payload.db.create({ collection: slug as never, data: data as never })
  }
  restored[slug] = sorted.length
}

for (const [slug, raw] of Object.entries(snapshot.globals)) {
  await payload.db.updateGlobal({ slug: slug as never, data: depopulateDoc(raw) as never })
}

// serial 시퀀스를 복구된 최대 id 뒤로 옮겨, 이후 새 문서가 id 충돌 없이 생성되게 한다.
for (const slug of slugs) {
  const table = slug.replace(/-/g, '_')
  await pool.query(
    `select setval(pg_get_serial_sequence('"${table}"', 'id'), greatest((select coalesce(max(id), 0) from "${table}"), 1), (select count(*) > 0 from "${table}"))`,
  )
}

console.log('RESTORED', JSON.stringify(restored))
console.log('SKIPPED', JSON.stringify(Object.fromEntries([...SKIPPED].map((s) => [s, snapshot.collections[s]?.length ?? 0]))))
process.exit(0)
