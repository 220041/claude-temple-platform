// Payload의 postgresAdapter는 push 모드(NODE_ENV !== 'production'일 때
// 기본 활성화)에서 payload.init()이 호출될 때마다 payload_migrations에
// batch=-1 "dev" 마커 행을 다시 만든다(pushDevSchema.js). 로컬 dev
// 서버나 payload run 스크립트를 한 번만 더 돌려도 이 마커가 재생성되고,
// 그 상태로 배포하면 payload migrate가 비대화형 환경에서 확인 프롬프트를
// 띄우다 타임아웃으로 배포가 실패한다(guide.md 10.3절 관련 이슈).
//
// 이 마커는 로컬 작업 중 계속 다시 생길 수 있으므로, 매 배포 시점
// (vercel-build)에 payload migrate 실행 직전 이 마커만 자동으로 지운다.
// 실제 마이그레이션 이력(batch >= 1)은 전혀 건드리지 않는 안전한 정리다.
//
// payload_migrations 테이블 자체가 아직 없는 완전히 빈 신규 DB(baseline
// 마이그레이션이 한 번도 돈 적 없는 새 사찰 설치)에서도 vercel-build가
// 이 스크립트부터 실행하므로, DELETE 전에 테이블 존재를 먼저 확인한다
// (검토 문서 R3) — 없으면 조용히 종료하고 baseline이 정상적으로 테이블을
// 만들도록 둔다.
import pg from 'pg'

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

const { rows } = await client.query("SELECT to_regclass('public.payload_migrations') AS reg")
if (!rows[0]?.reg) {
  console.log('[clear-dev-migration-marker] payload_migrations 테이블이 아직 없어 건너뜁니다(신규 설치).')
  await client.end()
  process.exit(0)
}

const result = await client.query('DELETE FROM payload_migrations WHERE batch = -1')
console.log(`[clear-dev-migration-marker] removed ${result.rowCount} dev-mode marker row(s)`)
await client.end()
