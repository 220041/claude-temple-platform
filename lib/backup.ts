import type { Payload } from 'payload'
import { put, list, del } from '@vercel/blob'

const RETENTION_DAYS = 28
const BACKUP_PREFIX = 'backups/'

// 컬렉션별로 백업 JSON에서 제거할 필드. Members.email/realName은 guide.md가
// 여러 곳에서 "실명·이메일은 민감 정보"로 다루는 것과 같은 이유로 제외한다
// (nickname/status 등 복구에 필요한 값은 남긴다). 비밀번호 해시는 Payload의
// auth 컬렉션 조회 결과에 애초에 포함되지 않는다(별도 처리 불필요).
const REDACT_FIELDS: Record<string, string[]> = {
  members: ['email', 'realName'],
}

function redact(collectionSlug: string, docs: unknown[]): unknown[] {
  const fields = REDACT_FIELDS[collectionSlug]
  if (!fields) return docs
  return docs.map((doc) => {
    const copy = { ...(doc as Record<string, unknown>) }
    for (const field of fields) delete copy[field]
    return copy
  })
}

/** list() 결과에서 보관 기한(RETENTION_DAYS)이 지난 백업 파일을 걸러낸다 — 순수 함수라 실제 Blob 업로드 없이 단위 검증 가능. */
export function filterExpiredBackups(
  blobs: { pathname: string; uploadedAt: Date }[],
  now: Date = new Date(),
): { pathname: string; uploadedAt: Date }[] {
  const cutoff = now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000
  return blobs.filter((b) => b.uploadedAt.getTime() < cutoff)
}

export type BackupSummary = {
  backupUrl: string
  collectionCounts: Record<string, number>
  deletedOldBackups: string[]
}

/**
 * 구조화 데이터(모든 컬렉션·글로벌)만 JSON으로 백업한다 — 업로드된 이미지
 * 원본은 이미 Vercel Blob에 내구성 있게 저장돼 있어 매주 전부 재복사하지
 * 않는다(서버리스 실행 시간/메모리 한도 위험 대비 이득이 적음). 가장
 * 복구하기 어려운 건 관계로 얽힌 콘텐츠(게시물·설정·메뉴)이지 파일 자체가
 * 아니다. 컬렉션/글로벌 목록은 하드코딩하지 않고 payload.config에서
 * 동적으로 가져와 새 컬렉션이 추가돼도 자동으로 포함되게 한다.
 */
export async function runWeeklyBackup(payload: Payload): Promise<BackupSummary> {
  const collectionCounts: Record<string, number> = {}
  const collectionsData: Record<string, unknown[]> = {}

  for (const { slug } of payload.config.collections) {
    const { docs } = await payload.find({ collection: slug, limit: 0, pagination: false, overrideAccess: true })
    collectionsData[slug] = redact(slug, docs)
    collectionCounts[slug] = docs.length
  }

  const globalsData: Record<string, unknown> = {}
  for (const { slug } of payload.config.globals) {
    globalsData[slug] = await payload.findGlobal({ slug, overrideAccess: true })
  }

  const body = JSON.stringify(
    { generatedAt: new Date().toISOString(), collections: collectionsData, globals: globalsData },
    null,
    2,
  )

  const token = process.env.BLOB_READ_WRITE_TOKEN_PRIVATE
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN_PRIVATE이 설정되지 않았습니다.')

  const filename = `${BACKUP_PREFIX}backup-${new Date().toISOString().slice(0, 10)}.json`
  const uploaded = await put(filename, body, {
    access: 'public', // 이 저장소의 Blob 플러그인은 access:'public'만 지원한다(오늘 세션에서 확인) — 보호는 추측 불가능한 랜덤 접미사 + 어디에도 링크하지 않는 것으로 한다.
    addRandomSuffix: true,
    contentType: 'application/json',
    token,
  })

  const { blobs } = await list({ prefix: BACKUP_PREFIX, token })
  const expired = filterExpiredBackups(blobs)
  if (expired.length > 0) {
    await del(expired.map((b) => b.pathname), { token })
  }

  return {
    backupUrl: uploaded.url,
    collectionCounts,
    deletedOldBackups: expired.map((b) => b.pathname),
  }
}
