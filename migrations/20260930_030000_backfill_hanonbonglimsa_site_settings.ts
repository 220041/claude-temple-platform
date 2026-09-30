import { type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * no-op으로 남겨둔 과거 마이그레이션 — 검토 문서(PLATFORM_REVIEW_2026-09-30.md
 * R3) 지적: 하논봉림사 전용 데이터 백필이 공용 마이그레이션 체인에 있으면
 * 빈 신규 사찰 DB에도 installed:true와 봉림사 정체성이 조용히 주입된다.
 *
 * 이미 하논봉림사 운영/개발 DB에는 적용이 끝났으므로(마이그레이션 이력은
 * 이름으로 추적되어 이 파일 내용을 바꿔도 재실행되지 않는다) 그 결과는
 * 그대로 유지된다. 실제 백필 로직은
 * scripts/seed-hanonbonglimsa-site-settings.ts로 옮겼다 — 필요하면 그
 * 스크립트를 수동으로 실행한다.
 */
export async function up(_args: MigrateUpArgs): Promise<void> {}

// 백필한 설정값은 이후 관리자가 직접 수정했을 수 있어, 되돌리면 편집
// 내용을 덮어쓸 위험이 있다. 데이터 복구가 아닌 구조 변경만 down에서
// 되돌리는 원칙(20260929_000000_backfill_page_versions.ts와 동일)에 따라
// 이 데이터 백필은 의도적으로 비가역적으로 둔다.
export async function down(_args: MigrateDownArgs): Promise<void> {}
