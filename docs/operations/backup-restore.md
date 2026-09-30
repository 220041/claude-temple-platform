# 백업과 복구 (guide.md 20절)

이 문서는 실제로 실행 가능한 명령 형태로 백업·복구 절차를 기록한다.
`DATABASE_URL`/`DIRECT_URL`은 `.env.local`(로컬) 또는 Vercel 프로젝트
환경변수(운영)에 등록된 값을 그대로 쓴다 — 이 문서에는 실제 값을 적지 않는다.

## 사전 준비

* `pg_dump`/`psql`(PostgreSQL 클라이언트)이 로컬에 설치돼 있어야 한다.
* Supabase 프로젝트 대시보드 → Database → Connection string에서
  `DIRECT_URL`(pooler 아닌 direct 연결)을 확인할 수 있다. 덤프/복구는
  반드시 **pooler가 아닌 direct 연결**로 해야 한다(pgbouncer 트랜잭션
  모드에서는 일부 pg_dump 옵션이 깨질 수 있음).

## 1. 수동 백업 (운영 배포 전 / 주요 기능 변경 전 반드시 실행)

```bash
# .env.local의 DIRECT_URL 값을 사용. 파일명에 날짜를 넣어 구분한다.
pg_dump "$DIRECT_URL" -F c -f "backup_$(date +%Y%m%d_%H%M%S).dump"
```

* `-F c`(custom format)는 `pg_restore`로 선택적 복구가 가능해 plain SQL보다 유연하다.
* 백업 파일은 저장소에 커밋하지 말 것(개인정보 포함) — 로컬 안전한 위치나
  별도 백업 스토리지에 보관한다.

## 2. 게시물·회원·댓글만 선택적으로 내보내기 (guide.md 20절 "게시물·회원·댓글 내보내기 절차")

전체 DB 덤프 대신 특정 테이블만 필요할 때:

```bash
pg_dump "$DIRECT_URL" -F c -t posts -t comments -t members -t members_sessions \
  -f "content_export_$(date +%Y%m%d).dump"
```

Payload local API로 JSON 형태로 내보내려면 `payload run` 스크립트로
`payload.find({ collection: '...', overrideAccess: true, limit: 0, pagination: false })`
결과를 파일로 저장하는 방식도 가능하다(관계가 자동으로 populate돼 사람이
읽기엔 더 편하지만, 복구용으로는 SQL 덤프가 더 정확하다).

## 3. Supabase 자동 백업/PITR 확인 — ✅ 확인 완료 (2026-08-08): 현재 플랜에서 사용 불가

사용자가 Supabase 프로젝트 대시보드에서 직접 확인한 결과, 자동 일일 백업과
Point-in-Time Recovery(PITR) 둘 다 유료 플랜이 필요해 현재(무료 플랜)는 설정할
수 없다. **당분간은 위 1번의 수동 `pg_dump` 백업에 전적으로 의존한다** — 운영
배포 전/주요 기능 변경 전에는 반드시 수동 백업을 실행할 것. 유료 플랜으로
전환하거나(실제 도메인/계정 이전 시점에 재검토 가능) 수동 백업 주기를 정기적으로
(예: 주 1회) 늘리는 방안을 고려할 것.

## 4. 복구 절차

**custom format 덤프에서 전체 복구:**

```bash
pg_restore -d "$DIRECT_URL" --clean --if-exists "backup_20260807_120000.dump"
```

* `--clean --if-exists`는 기존 객체를 먼저 지우고 새로 만든다 — **운영 DB에
  대해 실행하기 전 반드시 사용자 승인을 받을 것**, 되돌릴 수 없다.

**Supabase 대시보드에서 PITR로 특정 시점 복구:** (PITR이 활성화된 경우)
Database → Backups → Point in Time Recovery에서 복구할 시점을 선택 →
새 프로젝트 또는 기존 프로젝트에 복구. 이 경로는 대시보드 UI 조작이 필요해
사용자가 직접 수행해야 한다.

## 5. Vercel Blob 파일 목록과 DB 참조 정합성 점검

```bash
npx vercel blob list --store-id <store_id> --limit 1000
```

DB(`media-public`/`media-private` 테이블의 `filename` 컬럼)에 없는
blob 파일이 있으면 고아 파일이다 — `lib/cleanup.ts`의 `purgeOrphanMedia()`는
**DB 문서 기준**으로 고아를 판정하므로(어떤 게시물에도 안 쓰이는 media
문서를 지움), blob 스토리지에만 남고 DB 문서 자체가 이미 없는 경우(업로드
성공 후 DB insert 실패 같은 극단적 케이스)는 별도로 이 명령으로 대조 확인해야
한다 — 이번 세션에서는 이 정합성 점검 스크립트까지는 만들지 않았다.

## 6. 마이그레이션 롤백

`docs/operations/migrations.md` 참고. `payload migrate:down`으로 마지막
마이그레이션을 되돌릴 수 있으나, 로컬 실습은 아직 하지 않았다.

## 7. 소프트 삭제 30일 유지 / 30일 후 영구정리 / 고아 파일 정리

`lib/cleanup.ts`(guide.md 10.6절, `app/(payload)/api/cron/run-jobs/route.ts`에서
매일 자동 실행)가 처리한다. 소프트 삭제 자체(30일 보관 시작)는 6~8단계에서
이미 구현된 회원 셀프서비스 삭제/관리자 숨김 기능이 담당한다.
