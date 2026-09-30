import { type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * no-op으로 남겨둔 과거 마이그레이션 — 검토 문서(PLATFORM_REVIEW_2026-09-30.md
 * R3) 지적: 매핑 실패 시 예외를 던지는 하논봉림사 전용 백필이 공용
 * 마이그레이션 체인에 있으면, 하논봉림사 콘텐츠가 없는 빈 신규 사찰 DB는
 * 이 마이그레이션에서 무조건 멈춰 이후 모든 마이그레이션이 막힌다.
 *
 * 이미 하논봉림사 운영/개발 DB에는 적용이 끝났으므로(마이그레이션 이력은
 * 이름으로 추적되어 이 파일 내용을 바꿔도 재실행되지 않는다) 그 결과는
 * 그대로 유지된다. 실제 백필 로직은
 * scripts/seed-hanonbonglimsa-main-menu.ts로 옮겼다 — 필요하면 그
 * 스크립트를 수동으로 실행한다.
 */
export async function up(_args: MigrateUpArgs): Promise<void> {}

// 백필된 메뉴는 이후 관리자가 직접 편집했을 수 있어, 되돌리면 편집
// 내용을 덮어쓸 위험이 있다(20260930_030000 백필과 동일 원칙).
export async function down(_args: MigrateDownArgs): Promise<void> {}
