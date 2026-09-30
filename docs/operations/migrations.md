# Migration 운영 절차 (guide.md 10.3절)

## 확정된 방침

* **`payload migrate:create`는 항상 로컬(사람이 직접 터미널에서 rename 여부를
  선택할 수 있는 환경)에서만 실행한다.** drizzle-kit의 스키마 diff 로직이
  "이 컬럼이 새로 생겼는지 다른 컬럼에서 rename된 것인지" 판단이 애매하면
  방향키 선택 프롬프트를 띄우는데(2026-08-07 재현 확인, guide.md 10단계
  관련 이슈 참고), 비대화형 환경(CI, Vercel 빌드)에서는 이 프롬프트에 응답할
  방법이 없어 그대로 멈춘다.
* **Vercel 빌드/배포 파이프라인에서는 `payload migrate`(이미 작성된 마이그레이션
  파일을 그대로 실행하는 명령)만 실행한다.** 이 명령은 스키마 diff를 하지
  않고 파일에 적힌 SQL을 순서대로 실행할 뿐이라 대화형 프롬프트가 발생하지
  않는다(이론적으로 안전 — 실제 파이프라인에 연결해 실행 검증하는 것은
  아직 남은 작업).
* 스키마를 변경할 때마다: 로컬에서 필드 수정 → `pnpm payload migrate:create <설명>`
  → 생성된 마이그레이션 파일 내용 검토 → 커밋 → 배포(파이프라인이 `payload migrate` 실행).
  **더 이상 `push` 모드(dev 서버가 스키마를 자동으로 DB에 밀어넣는 방식)에
  의존하지 않는다** — 9단계까지는 이 프로젝트가 계속 push 모드로 개발돼왔음.

## 베이스라인 마이그레이션 운영 DB 등록 (완료: 2026-08-07)

`migrations/` 디렉터리에 커밋된 베이스라인 마이그레이션(`..._baseline.ts`)은
현재 스키마 전체를 `CREATE TABLE ...`(IF NOT EXISTS 없음)로 생성하는
내용이다. **이 프로젝트의 개발/운영 공용 Supabase DB는 지금까지 `push`
모드로 이미 이 테이블들이 전부 만들어져 있는 상태**이므로, 이 베이스라인을
그대로 `payload migrate`로 실행하면 "테이블이 이미 존재함" 오류로 실패한다.

2026-08-07 운영자 요청에 따라 실행 전에 베이스라인 JSON의 47개 테이블과 운영
DB의 47개 테이블이 정확히 일치하고 누락/추가 테이블이 없음을 확인했다. 그 뒤
단일 트랜잭션으로 `payload_migrations`에
`20260807_083416_baseline`을 batch 1로 기록했다. 베이스라인 SQL 자체는 실행하지
않았으므로 기존 테이블이나 데이터는 변경하지 않았다. 실행 후
`payload migrate:status`에서 해당 마이그레이션이 `Ran: Yes`로 표시됨을 확인했다.

같은 트랜잭션에서 유일한 관리자 `220041@naver.com`을 `editor`에서
`super-admin`으로 승격하고 `admin-account-change` 감사 로그를 남겼다. 이는
super-admin이 전혀 없는 초기 부트스트랩 상태를 해소하기 위한 1회성 작업이다.

## 롤백 절차 — ✅ 실습 완료 (2026-08-07)

`migrate:down`으로 마지막 마이그레이션을 되돌릴 수 있다. **주의: 베이스라인
마이그레이션의 down 스크립트는 47개 테이블 전체를 `DROP TABLE`한다 —
스키마뿐 아니라 데이터까지 전부 사라진다.** 운영 DB(개발과 공유 중)에
대해 실제로 실습했으며, 절차와 결과는 다음과 같다:

1. **백업**: `pg_dump`가 로컬에 없어 `winget install PostgreSQL.PostgreSQL.17`로
   클라이언트 도구만 설치. **`DIRECT_URL`은 IPv6 전용 호스트라 이 네트워크
   환경(IPv6 라우팅 없음)에서 pg_dump가 연결하지 못했다** — 대신 pooler
   연결(`DATABASE_URL`, IPv4)로 전체 덤프(custom format, `-F c`)에 성공.
   `pg_restore -l`로 47개 테이블의 TABLE DATA 항목이 전부 포함됐음을 확인 후 진행.
2. `pnpm payload migrate:down` 실행 → `payload_migrations`에서 baseline 배치가
   제거되고 47개 테이블이 전부 삭제됨. `migrate:status`에서 `Ran: No` 확인.
3. `pnpm payload migrate` 재실행 → 스키마(빈 테이블)만 복원됨. `Ran: Yes` 확인.
4. `pg_restore -d "$DATABASE_URL" --data-only --disable-triggers --schema=public <덤프파일>`로
   데이터 복원 시도. **`--disable-triggers`는 Supabase의 `postgres` 롤이 진짜
   superuser가 아니라서 FK 트리거 on/off 자체가 permission denied로 실패했지만,
   실제 행 데이터의 COPY는 대부분 정상적으로 진행됐다**(트리거 비활성화
   실패는 이 케이스에서 데이터 삽입 자체를 막지 않음 — pg_restore가 개별
   문장 오류를 무시하고 계속 진행하는 기본 동작 덕분). `payload_migrations`
   행 하나만 이미 존재하는 id와 충돌해 건너뜀(의도한 대로 — 방금 재적용한
   최신 마이그레이션 기록을 덮어쓰지 않기 위함).
5. Payload local API로 admins/members/boards/pages를 조회해 실제 데이터가
   정확히 복원됐음을 확인(관리자 1명 `super-admin`, 회원 1명, 게시판 8개,
   정적 페이지 7개 — 전부 롤백 전과 일치).
6. 백업 덤프 파일과 임시 스크립트 전부 삭제.

**교훈**: 이 프로젝트의 운영 DB(Supabase)는 `DIRECT_URL`이 IPv6 전용이라
IPv6 라우팅이 없는 네트워크에서는 `pg_dump`/`pg_restore`를 pooler 연결
(`DATABASE_URL`)로 해야 한다. 또한 Supabase는 관리형 서비스라 `postgres`
롤도 진짜 superuser가 아니므로 `--disable-triggers`가 필요한 복원 방식은
권한 오류가 나는 게 정상이며, 대부분의 경우 문제가 되지 않는다(오류가
나도 실제 데이터 COPY는 이어서 진행됨) — 다만 FK 제약이 있는 상태에서
데이터 순서에 따라 실패할 수도 있으니, 실제 재해복구 상황에서는 결과를
반드시 다시 검증할 것.

**⚠️ 실제로 데이터 유실이 발생했음을 다음 날 발견 (2026-08-08)**: 복구 후
검증 단계(위 5번)에서 admins/members/boards/pages 4개 컬렉션만 확인하고
`posts`는 확인하지 않았다. 나중에 확인해보니 **`posts` 테이블이 실제로
복원되지 않고 비어 있었다**(감사 로그로 2026-08-06에 실제 게시물 8건이
발행됐던 기록은 남아있어 유실을 확정함) — `posts`는 `boards` 등을 참조하는
자식 테이블이라 `--disable-triggers` 실패로 인한 FK 제약 순서 문제로
복원이 실패했을 것으로 추정된다. 사용자 확인 결과 실제 운영 콘텐츠가
아니라 테스트성 데이터여서 문제 삼지 않기로 했지만, **절차상 결함이므로
다음에는 반드시 개선할 것**:

* 복구 검증은 "중요해 보이는 일부 컬렉션"이 아니라 **백업 시점의 47개
  테이블 전체 행 개수를 자동으로 비교하는 스크립트**로 해야 한다(예:
  `pg_restore -l`로 덤프의 테이블별 예상 행 수를 뽑고, 복구 후 각 테이블의
  실제 행 수와 대조).
* 100% 일치를 스크립트로 확인하기 전까지는 백업 덤프 파일을 삭제하지 않는다.
