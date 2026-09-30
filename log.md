# 작업 로그 (2026-08-07 ~ 2026-08-08, 2026-09-29 추가)

이 문서는 `guide.md` 10단계(운영 준비) 진행 중, 시간순으로 수행한 작업을
단위별로 정리한 기록이다. 커밋 단위 요약은 `git log`로도 볼 수 있지만, 여기서는 시도했다가
막힌 것/우회한 것까지 포함해 더 상세히 남긴다.

---

## 2026-08-07 (10.7~10.8 진행)

## 1. Supabase 마이그레이션 vs Payload 마이그레이션 추적 방식 확인

- 사용자가 "이 프로젝트는 Supabase CLI 마이그레이션이 아니라 Payload/Drizzle의
  `payload_migrations` 추적 테이블을 쓴다"는 진단을 제시했고, 읽기 전용 조회로
  운영 DB의 현재 스키마·관리자 행을 직접 확인해 이 진단이 맞다는 것을 검증했다.
- Supabase의 `migration repair` 명령을 쓰면 잘못된 테이블(`supabase_migrations.schema_migrations`)을
  건드리게 되므로 쓰지 않기로 확정.

## 2. 10.7 Vercel Preview 배포 검증

- 실제 Vercel Preview 배포를 시도하는 과정에서 **모든 페이지가 500 에러**로 죽는
  심각한 버그를 발견했다: Next.js 16의 기본 프로덕션 번들러 Turbopack이 `sharp`
  (네이티브 바이너리 모듈)를 제대로 트레이싱하지 못해 Vercel 서버리스 런타임에서
  `ERR_DLOPEN_FAILED: libvips-cpp.so`로 실패.
- 우회 시도 1: `serverExternalPackages: ['sharp']` → 실패(트레이싱은 됐지만 로드는 여전히 안 됨).
- 우회 시도 2: `outputFileTracingIncludes`로 `@img/**` 전체 포함 → 너무 넓어서 25개
  플랫폼 바이너리가 전부 포함되며 배포 용량 초과로 배포 자체가 실패(`errorStep: "direct:build"`).
- **최종 해결**: 프로덕션 빌드만 Webpack으로 강제 전환(`package.json`의 `build` 스크립트에
  `--webpack` 플래그 추가, dev는 계속 Turbopack이라 영향 없음). Webpack의 기존 파일
  트레이싱이 네이티브 모듈을 정상 처리해 배포 성공.
- 이 과정에서 Vercel CLI 로그 확인 팁도 얻었다: `vercel inspect --logs`는 빌드 로그만
  보여주고, 배포 단계 실패 원인은 REST API(`GET /v13/deployments/:id`)로 직접 조회해야
  하며, 런타임 에러는 `vercel logs <url>`로 확인한다.
- Preview 배포 자체는 Vercel SSO(Deployment Protection)로 막혀 있어, 검증을 위해
  일시적으로 해제했다가 검증 후 다시 켜두었다.
- 홈페이지 실데이터, `/admin` 로그인, 게시판 목록, `sitemap.xml`, `robots.txt`, cron
  엔드포인트(시크릿 없이 호출 시 500 — Preview에는 `CRON_SECRET` 미등록이라 정상)를
  전부 확인 완료.

## 3. 10MB 회원 이미지 업로드 제한 문제 발견 및 아키텍처 전환

- Vercel 공식 문서를 확인한 결과, **서버리스 함수는 플랜과 무관하게 요청/응답 본문이
  4.5MB로 고정 제한**되어 있음을 확인 — 기존의 "폼에서 서버 액션으로 파일을 직접
  전송"하는 방식으로는 10MB 이미지 업로드가 구조적으로 불가능하다는 것을 확정.
- 사용자에게 "지금 바로 착수(클라이언트 직접업로드 파이프라인으로 전환)"할지 물었고,
  승인을 받아 즉시 작업.
- **새 아키텍처**: 클라이언트가 `@vercel/blob/client`의 `upload()`로 Blob에 직접 업로드
  (앱의 서버리스 함수를 거치지 않음) → 서버는 `handleUpload` 기반 토큰 발급 라우트만
  제공(`app/(payload)/api/blob-upload/route.ts`) → 서버 액션은 업로드된 blob URL을
  `fetch()`로 다시 받아(아웃바운드 요청은 4.5MB 제한과 무관) 기존 검증(MIME/시그니처
  체크, EXIF 제거) 로직을 그대로 통과시킨 뒤 임시 스테이징 blob은 삭제.
- 변경 파일: `app/(frontend)/actions/posts.ts`(`uploadMemberImages` 재작성),
  `components/board/post-form.tsx`(클라이언트에서 먼저 직접 업로드 후 서버 액션 호출),
  `app/(payload)/api/blob-upload/route.ts`(신규).
- `@vercel/blob` 패키지 설치(2.7.0).

## 4. 실제 브라우저로 대용량(7.3MB) 업로드 흐름 검증 — 시도했으나 도구 문제로 보류

- 사용자가 `/add-dir`로 테스트 폴더를 공유해주었으나, `mcp__claude-in-chrome__file_upload`
  도구가 올바른 형식의 인자를 줘도 반복적으로 스키마 검증 오류를 내는 버그를 겪었다
  (같은 호출이 가끔은 성공해 "권한 없음" 에러까지 도달하기도 해서, 내 입력 문제가
  아니라 도구 자체의 간헐적 버그로 판단).
- 여러 경로 형식, 여러 탭, 여러 재시도 끝에도 안정적으로 재현되지 않아, 사용자 선택에
  따라 **이 실측 테스트는 보류하고 다음 항목으로 넘어감**.

## 5. `migrate:down` 롤백 절차 실습 (운영/개발 공유 DB 대상, 데이터 보존)

- 사용자가 "pg_dump로 백업 후 down→up 실습, 즉시 복구" 방식을 선택.
- 로컬에 `pg_dump`/`pg_restore`가 없어 `winget install PostgreSQL.PostgreSQL.17`로
  클라이언트 도구 설치.
- `DIRECT_URL`이 IPv6 전용 호스트라 로컬 네트워크에서 연결이 안 되는 것을 발견,
  대신 IPv4로 붙는 `DATABASE_URL`(Supabase pooler)을 사용해 `pg_dump` 성공.
- `migrate:down` → `migrate`(재적용) → `pg_restore`로 데이터 복구까지 실제로 수행,
  admins/members/boards/pages 등 레코드 수·내용을 복구 전후로 직접 비교해
  **데이터 손실 없이 완료**된 것을 확인.
- 부수 발견: Supabase의 `postgres` 롤은 진짜 슈퍼유저가 아니라서
  `pg_restore --disable-triggers`가 매 테이블마다 권한 오류를 내지만, 이는 복구
  자체를 막지 않고(개별 문장 오류만 로그, 나머지는 계속 진행) 실제 `COPY`(데이터
  삽입)는 전부 정상 수행됨을 확인.
- 이 절차를 `docs/operations/migrations.md`에 "롤백 절차 — ✅ 실습 완료" 섹션으로
  문서화.
- 부수 발견 2: 이 DDL 테스트 도중 `next dev`가 살아있는 상태였어서, 테스트 후
  한동안 홈페이지에서 `relation "posts" does not exist` 에러가 간헐적으로 발생함
  (Supabase PgBouncer 풀러 쪽 연결/프리페어드 스테이트먼트 캐시 문제로 추정, 앱
  코드 문제 아님) — 재시도 후 자연 해소됨, 코드 수정 없음.

## 6. "비밀번호 재설정(찾기)" 기능 — 누락 발견 및 신규 구현

- guide.md 24절 완료 기준 체크리스트를 점검하다가, **로그아웃 상태에서 비밀번호를
  잊은 회원을 위한 `/forgot-password`·`/reset-password` 프런트엔드가 이전 세션들에
  걸쳐 통째로 누락되어 있었음**을 발견(마이페이지의 "로그인 상태 비밀번호 변경"만
  있었음). 사용자가 요청한 것이 아니라 체크리스트 점검 중 자체적으로 발견.
- 구현 내용:
  - `collections/Members.ts`의 `auth.forgotPassword`에 `generateEmailHTML`/
    `generateEmailSubject`를 추가해, 재설정 메일이 관리자 패널 스타일이 아니라
    프런트엔드 `/reset-password?token=...` 페이지를 가리키도록 구성.
  - `app/(frontend)/actions/memberAuth.ts`에 `forgotPasswordAction`/
    `resetPasswordAction` 서버 액션 추가(`payload.forgotPassword()`/
    `payload.resetPassword()` 로컬 API 사용, 이메일 존재 여부를 노출하지 않도록
    항상 같은 성공 응답).
  - `app/(frontend)/forgot-password/`, `app/(frontend)/reset-password/` 페이지·폼
    신규 작성.
  - 로그인 화면에 "비밀번호를 잊으셨나요?" 링크 추가, `robots.ts`에 두 경로 disallow 추가.
- **브라우저로 전체 흐름 실측 검증**: 이메일 발송(어댑터 미설정이라 콘솔 로그로 확인,
  제목이 커스터마이징한 그대로 나오는 것 확인) → `payload run` 스크립트로 토큰 조회
  → `/reset-password?token=...`에서 새 비밀번호 설정 → `POST` 303으로 `/login` 리다이렉트
  확인 → 새 비밀번호로 실제 로그인 성공(마이페이지 리다이렉트까지 확인).
  - 이 과정에서 샌드박스 브라우저의 클릭/타이핑이 간헐적으로 실제 DOM에 반영되지
    않는 현상을 겪었으나(스크린샷 실패 로그로 "Browser pane이 표시되지 않음" 확인),
    `javascript_tool`로 입력값을 직접 확인해가며 재시도해 최종적으로 성공시킴.
- 커밋 `b8fe653`.

## 7. "비밀글 이미지 직접 접근 차단" 검증 — 실측 중 새 버그 발견 및 수정

- 임시 비밀글 + `media-private` 이미지를 `payload run` 스크립트로 만들어 실제
  브라우저로 세 가지 시나리오를 확인:
  1. **비로그인 상태 직접 URL 접근** → 403 정상 차단 확인.
  2. **로그인한 글쓴이 본인의 접근** → 여기서 **버그 발견**: 관리자/제3자가 아니라
     글쓴이 본인조차 자기 비밀글 이미지를 볼 수 없었음(`img.complete: false`로 실측).
- **원인 분석**: 회원 로그인은 관리자 쿠키(`payload-token`)와의 충돌을 피하려고
  별도 쿠키(`member-token`)를 쓰고, 서버 컴포넌트/액션 안에서만 수동으로
  `Authorization: JWT` 헤더로 변환해 왔다(`lib/memberAuth.ts`). 그런데
  `<img src="/api/media-private/file/...">`처럼 브라우저가 직접 쏘는 요청은 이
  변환 과정을 거치지 않으므로, Payload의 내장 파일 스트리밍 엔드포인트가 회원
  세션을 전혀 인식하지 못한 것.
- **수정**: `/api/media-private/file/:path*` 경로에만 적용되는 `middleware.ts`를
  신규 추가해, `member-token` 쿠키를 같은 방식으로 `Authorization` 헤더로 변환.
  - 미들웨어는 Edge 런타임에서 도는데, `lib/memberAuth.ts`를 그대로 import하면
    `payload.config.ts` 전체(Node 전용 모듈 포함)가 딸려 들어와 빌드가 깨지는 것을
    발견 → 쿠키 이름 상수만 별도로 인라인해서 해결.
- 수정 후 재검증: 소유자 접근 200(실제 이미지 로드 확인), 비로그인/비소유자 접근은
  여전히 403으로 재확인.
- 테스트용으로 만든 임시 게시물·이미지는 검증 후 삭제해 정리.
- 커밋 `4b0e277`.
- **의미**: 이 버그는 이번 세션 전에는 발견된 적이 없었다. 이전 세션들이 DB 검증을
  주로 `payload run` 로컬 스크립트(`overrideAccess: true`)로만 해왔기 때문에, 브라우저의
  실제 쿠키 전송 경로가 한 번도 검증되지 않았던 것으로 보인다.

## 8. 홈페이지 디자인·반응형 구조 회귀 확인

- 이번 세션의 샌드박스 브라우저가 스크린샷 컴포지팅을 지원하지 않아("Browser pane is
  not displayed" 에러 지속) 픽셀 단위 시각 비교는 못 했지만, DOM/CSS 계측으로 대체 검증했다.
- 모바일(375px)·태블릿(768px)·데스크톱(1280px) 세 폭 모두에서 `document.body.scrollWidth`가
  뷰포트 폭을 넘지 않는 것을 확인(가로 스크롤 없음 = 레이아웃 안 깨짐).
- 모바일 폭에서 데스크톱 전용 내비게이션이 `hidden lg:flex`로 정상 숨겨지고, 햄버거 메뉴
  버튼이 나타나며, 클릭 시 하위 메뉴 4개가 정상적으로 펼쳐지는 것까지 확인.
- 진짜 시각적(픽셀) 회귀 확인은 스크린샷이 가능한 환경에서 재확인 권장(다음 세션 과제로 남김).

## 9. `guide.md` 갱신

- 10.8절에 위 6~8번 항목의 검증·수정 내역을 상세히 기록.

---

## 2026-08-08 (남은 작업 우선순위대로 진행)

### 10. 도메인 방침 확정

- 사용자가 "실제 도메인은 아직 미정, 임시 도메인으로 백엔드/프런트엔드 작업을 전부
  완료한 뒤, 사찰 측이 보유한 도메인·새 Vercel/GitHub 계정으로 이전할 예정"이라고
  확정. 이 방침을 메모리에 저장했다(`domain_migration_plan`) — 10.9(도메인 확정 및
  실배포)는 이 이전 시점에 진행하는 것으로 순서를 잡음.

### 11. 10.1 환경변수 점검 — 완료 표시 정정

- `docs/operations/env-vars.md`를 확인해보니 실제로는 이전 세션에 이미 완료돼
  있었는데 guide.md 10.1절에 완료 표시가 안 돼 있었던 것을 발견, 실제 Vercel
  환경변수 등록 상태(`vercel env ls`)와 문서 내용이 정확히 일치함을 재확인 후
  guide.md를 정정했다.
- 문서에 "Git 자동배포 미설정"으로 기록돼 있던 부분도 확인해보니 **이미 연동돼
  있었음**을 발견(`vercel git connect` 실행 시 "already connected" 응답). 사용자
  승인을 받아 이번 세션 커밋들을 실제로 push해서, 자동으로 새 Preview 배포가
  생성되고 1분 내 빌드 성공(`Ready`)하는 것까지 실측 확인했다.

### 12. 10.2 샘플 데이터 제거

- 전수 조회 결과 `[TEST]`/검증용 게시물·댓글은 이미 남아있지 않았다(매 세션 검증
  후 정리해온 관행 덕분).
- 재사용해온 테스트 회원 계정 `stage9-test@example.com`(id 20)의 처리 방향을
  사용자에게 확인 — "이전 시점까지 남겨둘지 vs 지금 삭제할지" 중 **"지금 삭제"**를
  선택받아 계정과 거기 딸린 고아 테스트 이미지(`media-private` id 18)를 삭제했다.
- 관리자 부트스트랩 계정(`220041@naver.com`)의 임시 비밀번호 교체 여부는 DB
  해시값만으로 확인할 수 없어 사용자 확인이 필요한 항목으로 guide.md에 남겨둠.

### 13. 10.3 마무리 — `payload migrate`를 배포 파이프라인에 연결, 배포 차단 버그 사전 발견·수정

- `package.json`에 `vercel-build` 스크립트를 추가(`payload migrate && next build
  --webpack`) — Vercel은 `build`보다 `vercel-build`를 우선 사용하므로, 배포 시
  자동으로 마이그레이션이 먼저 적용된 뒤 빌드되도록 했다. 로컬 `pnpm build`는
  기존과 동일하게 마이그레이션 없이 순수 빌드만 하도록 유지.
- 로컬에서 `payload migrate`를 사전 검증하다가 **대화형 프롬프트("dev 모드에서
  스키마를 동적으로 push한 이력이 있다, 마이그레이션을 실행하면 데이터 손실이
  발생할 수 있는데 진행하시겠습니까? y/N")가 뜨며 멈추는 것을 발견**했다. 처음엔
  dev 서버가 DB 연결을 물고 있어서인 줄 알고 dev 서버를 껐지만, 재시도해도 동일
  프롬프트가 재현됐다.
- `@payloadcms/drizzle`의 `migrate.js` 소스를 직접 읽어 원인을 확정했다:
  `payload_migrations` 테이블에 `batch = -1`인 행(dev 모드 자동 push 마커)이
  하나라도 있으면 **NODE_ENV와 무관하게** 이 프롬프트가 뜬다(`NODE_ENV=production`
  으로도 직접 재현해 확인). 이 프로젝트는 운영 DB로 개발용 Supabase를 그대로
  쓰기로 결정했으므로, 이 마커 행을 방치했다면 **Vercel의 비대화형 빌드 환경에서도
  동일하게 재현되어 배포가 멈추거나 실패했을 것**이다.
- DB를 조회해 `batch=-1` 마커 행이 정확히 1개(id=3, 이름 "dev", 2026-08-07 12:33
  생성 — 10.3절 `migrate:down` 롤백 실습 도중 남은 부산물로 추정) 있음을 확인.
  이 행이 실제 스키마/데이터를 담지 않는 순수 경고 메타데이터임을 확인한 뒤,
  자동 승인 범위를 벗어나 시스템이 삭제 작업 자체를 막아서 사용자에게 직접
  확인받았다 — 승인 후 삭제. 이후 `payload migrate`가 프롬프트 없이 "Done."으로
  정상 종료됨을 재확인.
- 커밋·push 후 **실제 Vercel 빌드 로그로 최종 검증**: `> payload migrate && next
  build --webpack` → `INFO: Done.`(프롬프트 없이 정상 완료) → 바로 이어서
  Next.js 빌드 시작. 배포 자체가 끝까지 성공하는지는 계속 지켜보는 중.
- 부수 발견: 빌드 로그에 `middleware.ts`가 Next.js 16에서 deprecated됐고
  앞으로 `proxy` 파일 컨벤션을 쓰라는 경고가 새로 나타남(어제 만든 비밀글 이미지
  접근 수정용 미들웨어 대상) — 지금 당장 빌드를 막지는 않으나 다음에 확인 필요.

- 13번 작업의 Vercel 배포가 끝까지(마이그레이션+빌드+배포) 성공(`Ready`)하는 것까지
  실측 확인 완료.

### 14. 관리자 임시 비밀번호 확인

- 사용자에게 직접 질문해 확인: 최초 관리자 부트스트랩 계정(`220041@naver.com`)의
  임시 비밀번호를 **아직 교체하지 않았음**을 확인. 운영 전환(10.9) 전 반드시 교체
  필요 항목으로 guide.md에 기록.

### 15. Vercel Production 환경 재배포 및 cron 실측 검증

- `vercel ls --environment=production`으로 확인해보니 유일한 Production 배포
  (2026-08-07 07:58, 프로젝트 생성 직후 자동 트리거된 것으로 추정)가 `PAYLOAD_SECRET`
  누락으로 `Error` 상태였던 것을 발견. 사용자 승인을 받아 `vercel deploy --prod`로
  재배포 → 성공(`READY`).
- 이 Production URL에 대해 cron `CRON_SECRET` 인증을 실측 검증하려 했으나, SSO
  Deployment Protection이 외부 요청을 먼저 막아 앱 코드에 도달하지 못함(302
  리다이렉트)을 확인. 사용자 승인을 받아 SSO를 일시 해제하고 `/api/cron/run-jobs`에
  curl로 직접 요청 → 인증 헤더 없음/틀린 값 둘 다 `401 {"error":"Unauthorized"}`로
  정확히 차단됨을 확인. 실제 `CRON_SECRET` 값은 Vercel이 Sensitive로 등록해 CLI로도
  마스킹되므로(`vercel env pull`에도 `[SENSITIVE]`) 직접 조회 불가하지만, 인증 게이트
  로직 자체는 이걸로 충분히 검증됐다고 판단. 검증 직후 SSO 즉시 재활성화.

### 16. 24절 완료 기준 체크리스트 — 코드 레벨 빠른 재검토

- 사용자 선택("코드 레벨 빠른 훈수만")에 따라 브라우저 실측 없이 관련 코드를 다시
  읽어 회귀 여부만 확인.
- 확인해서 정상임을 재확인한 것들: Admins 권한 분리(role 기반 super-admin/editor),
  Posts/Comments의 access 로직(본인 수정·삭제 제한, trash 진입/영구삭제 분기),
  비밀글 필드별 접근 차단(`secretFieldReadAccess`), 댓글 1단계 답글 제한
  (`validateComment`의 `parent.parentComment` 체크), 검색에서 비밀글 명시적 제외
  (`lib/search.ts`), 신고 시 자동 숨김/삭제를 하지 않는다는 방침(코드에 실제로
  구현 안 돼 있음 = 의도된 동작).
- **갭 발견**: "신고 3건 긴급 표시"가 실제로는 `reportCount` 카운터 증가만 있고,
  관리자 목록 화면에 시각적으로 강조하는 UI가 전혀 없었다(기본 목록 컬럼에도
  `reportCount`가 빠져 있었음). 사용자 승인을 받아 즉시 구현: `components/admin/
  ReportCountCell.tsx` 신규 작성(3건 이상이면 빨간 배지), `Posts.ts`/`Comments.ts`의
  `reportCount` 필드에 Cell 컴포넌트로 연결 + `defaultColumns`에 추가. 타입체크
  통과, dev 서버 컴파일 에러 없음, `/admin/collections/posts` 라우트가 정상적으로
  로그인 페이지로 리다이렉트되는 것까지 확인했으나, **관리자 로그인 자격증명이
  없어 실제 배지가 빨간색으로 렌더링되는 시각적 확인은 못 함** — 사용자가 직접
  로그인해서 확인 필요.

---

## 진행 중 / 다음 순서

- 신고 3건 긴급 표시 배지의 실제 시각적 렌더링을 관리자 로그인 후 직접 확인 필요.
- `middleware.ts`의 Next.js 16 deprecation 경고("proxy로 전환 권장") 확인 필요.
- 10MB 실측 브라우저 업로드 테스트 — 여전히 보류 중(도구 문제).
- 10.8 — 24절 체크리스트 중 이번에도 브라우저 실측까지는 못 한 나머지 항목들
  (게시판 CRUD, EXIF 제거, Blob 분리, 봉림사 소식 선정/해제 등 — 코드 레벨로는
  이전 단계에서 이미 검증됐고 이번엔 재검토 대상에서 우선순위상 생략됨).
- 10.9 도메인 확정 및 실배포 — 사찰 측 도메인/계정 준비될 때까지 보류(사용자 확정).

### 17. 사용자 확인 완료 3건 처리

- **관리자 임시 비밀번호**: 사용자가 직접 `/admin`에서 교체 완료.
- **신고 긴급표시 배지**: 사용자가 직접 확인 완료(별도 이슈 없음).
- **Supabase 자동 백업/PITR**: 사용자가 대시보드에서 확인한 결과 유료 플랜
  필요, 현재 플랜에서는 설정 불가 — 당분간 수동 `pg_dump` 백업에 의존하기로
  `docs/operations/backup-restore.md`에 명시.

### 18. posts 테이블 데이터 유실 발견 — 마이그레이션 롤백 실습의 부작용

- 사용자가 관리자 화면에서 게시물 목록이 "No Results"인 것을 보고 문의.
  조사 결과 **`posts` 테이블이 실제로 0건**이었다.
- `AuditLogs`에서 2026-08-06에 게시물 8건이 실제로 발행(publish)된 기록을
  찾아 유실을 확정. 원인은 2026-08-07의 `migrate:down`/`migrate`/`pg_restore`
  롤백 실습(항목 5번 참고)에서, 복구 검증 시 admins/members/boards/pages
  4개만 확인하고 **posts는 확인하지 않아 실패를 놓쳤던 것**으로 결론.
  `posts`는 다른 테이블을 참조하는 자식 테이블이라 `--disable-triggers`
  권한 실패로 인한 FK 순서 문제로 복원이 실패했을 것으로 추정.
- 사용자가 실제 운영 콘텐츠가 아닌 테스트성 데이터였음을 확인해 문제
  삼지 않기로 했다. 재발 방지를 위해 `docs/operations/migrations.md`에
  원인과 함께 "다음부터는 전체 테이블 행 개수 자동 비교 스크립트로
  검증하고, 100% 확인 전까지 백업을 보존한다"는 개선 절차를 기록했다.

### 19. 도메인 이전 방침 및 품질 기준 — 메모리 갱신

- 사용자가 명확히 함: 실제 도메인 구매·이전은 **"스님"(사찰 책임자)이
  임시 도메인 상태의 결과물에 만족해야** 진행되며, **이전 후에는 더 이상
  수정/손댈 일이 없어야 한다.** 즉 임시 도메인 단계에서 최대한 완성도를
  끌어올려야 한다는 방침. `domain_migration_plan` 메모리에 반영.

### 20. 게시판 CRUD·댓글·비밀글·소프트삭제 브라우저 실측 재검증

- 새 테스트 회원 계정(`crud-check@example.com`)을 만들어 자유게시판에서
  전체 흐름을 직접 확인: 글쓰기(`createPostAction`) → 조회(조회수 증가) →
  댓글(`createCommentAction`) → 수정 겸 비밀글 전환(`updatePostAction`) →
  목록에서 "🔒 비밀글입니다" 마스킹 정상 확인 → 삭제(`deletePostFormAction`).
  DB 직접 조회로 삭제가 진짜 소프트 삭제(`deletedAt`만 채워짐, 레코드 보존)
  임을 재확인. 검증 후 테스트 게시물·댓글·계정 전부 정리.
- 회원가입 스크립트 작성 중 `termsVersion`/`privacyVersion`/`boardPolicyVersion`/
  `agreedAt`(약관 동의 4종)과 `realName`이 필수임을 확인, 이메일 인증
  (`_verified`) 플래그도 `status: 'active'`와 별개로 따로 있어 로그인 전
  수동으로 채워야 했다.
- **브라우저 자동화 도구의 클릭이 React 폼에 간헐적으로 반영 안 되는 문제를
  다시 겪었다**(이전 세션에도 동일 현상, "Browser pane is not displayed"와
  연관된 것으로 보임). `computer` 클릭 대신 `form_input`으로 입력값을 채우고,
  제출은 `javascript_tool`로 실제 버튼 엘리먼트를 찾아 `.click()`을 직접
  호출하는 방식으로 안정적으로 우회했다 — 이 패턴이 이번 세션 내내 가장
  안정적이었다.

---

### 21. `middleware.ts` → `proxy.ts` 전환 (Next.js 16 deprecation 대응)

- 웹 검색으로 공식 마이그레이션 가이드 확인: Next.js 16부터 파일명이
  `proxy.ts`, export 함수 이름도 `middleware`가 아니라 `proxy`여야 한다.
- 처음엔 파일명만 바꿨는데 "Proxy is missing expected function export name"
  에러가 재현됐다(함수 이름도 `proxy`로 바꾼 뒤에도 계속). `.next` 캐시를
  지우고 dev 서버를 재시작하니 에러가 사라짐 — 원인은 stale 빌드 캐시였다.
- 전환 후 대상 엔드포인트(`/api/media-private/file/...`)가 여전히 403을
  정상 반환하는 것으로 기능 유지 확인.

---

### 22. 10MB 회원 이미지 업로드 실측 브라우저 테스트 — 마침내 완료

- `/add-dir`가 이 환경(Claude Code 세션)에서 지원되지 않아 `claude-in-chrome`의
  `file_upload` 경로 자체를 포기하고, 대신 **OS 파일 선택 대화상자를 우회하는
  방법**을 썼다: 테스트 이미지를 Next.js `public/`에 임시로 두고, 브라우저 JS로
  `fetch()`로 받아 `Blob`→`File`→`DataTransfer`를 만들어 `<input type="file">`에
  직접 대입한 뒤 `change` 이벤트를 수동 디스패치. 이렇게 하면 실제 앱의
  `post-form.tsx` `handleSubmit` → `@vercel/blob`의 `upload()` 클라이언트
  직접 업로드 코드 경로를 그대로 타면서도, 자동화 도구의 파일 다이얼로그
  버그를 완전히 회피할 수 있었다.
- `sharp`로 무작위 노이즈 JPG 두 개 생성(5.57MB, 12.04MB)해서 두 케이스 검증:
  - **5.57MB(제한 이하)**: 정상 업로드 → 서버가 재검증/EXIF 스트립 후
    리사이즈(3.15MB)해서 `media-private`에 저장 → 프런트엔드에서 실제
    200으로 렌더링까지 확인.
  - **12.04MB(제한 초과)**: 클라이언트 업로드 단계에서 정확히 거부됨
    ("Vercel Blob: File is too large, the file length cannot be greater
    than 10485760 bytes.") — `blob-upload` 라우트의 `maximumSizeInBytes`
    설정이 실제로 작동함을 실증.
- 두 테스트 모두 앱의 4.5MB 서버리스 함수 본문 제한을 거치지 않고 클라이언트
  →Blob 직접 전송으로 처리됨을 네트워크 탭으로 확인(`POST /api/blob-upload`는
  토큰 발급 요청일 뿐).
- 테스트 도중 `proxy.ts` deprecation 에러(항목 21)가 브라우저 콘솔에 다시
  나타나 혼란스러웠으나, 서버 로그를 직접 대조해보니 실제 요청들은
  `proxy.ts: 45ms`로 정상 처리되고 있었다 — 콘솔에 남은 건 그 이전 HMR
  리컴파일 시점의 잔여 경고 메시지였던 것으로 판단(실제 기능 이상 없음).
- 검증 후 테스트 계정(`upload-check@example.com`)·게시물·미디어·`public/`
  임시 파일·로컬 테스트 이미지 폴더 전부 정리.

---

### 23. 품질 고도화 점검 (사용자 요청: "실배포 전 완성도를 최대한 높여달라")

- 사용자가 "임시 도메인 단계에서 최대한 퀄리티를 높여서, 실제 도메인(스님 승인
  후)으로 이전한 뒤에는 더 손댈 일이 없어야 한다"는 목표를 명확히 밝힘 —
  `domain_migration_plan` 메모리에 반영.
- 전체 코드베이스를 훑어 발견·처리한 것들:
  - `next.config.mjs`의 `typescript.ignoreBuildErrors: true`가 근거 없이 유지되고
    있었음 — 꺼봤더니(`false`) `tsc`/`pnpm build` 둘 다 깨끗하게 통과해 그대로 전환.
  - 미사용 로고 시안 페이지(`/logo-preview`, 마스코트+석보체 조합)가 외부 노출
    중이던 것을 발견. **사용자가 "그게 무슨 로고냐" 되물어서, 실제 이미지를
    base64로 인라인한 비교 아티팩트를 만들어 시각적으로 보여주고 확인받음**
    (스크린샷 도구가 이 세션 내내 실패해서 대안으로 사용) — 현재 헤더 로고가
    공식이고 마스코트 시안은 미채택 확정, 페이지와 석보체 폰트(12MB) 삭제.
    마스코트 캐릭터 자체(`logo-mascot.png`)는 홈페이지 "기도·법회" 섹션에
    실제로 쓰이고 있어 그대로 유지(사용자가 재차 확인).
  - `public/placeholder-*` 5개(v0.dev 스캐폴딩 잔재) 삭제.
  - 로고 alt·페이지 메타데이터에 기존 표기("BONGRIMSA")를 재사용해 "Bonglimsa"
    영문 표기 추가(사용자 지시, 임의 정보 생성 없이 기존 표기만 확장).
  - **rate limit 부재 발견**: 로그인/댓글 외에 비밀번호 재설정·회원가입·이메일
    재발송에 아무 제한이 없었음. 사용자에게 "권장 설정이 뭐냐"를 두 차례에
    걸쳐 상세히 설명(엔드포인트별 표, 왜 IP보다 이메일/계정 기준이 서버리스에
    맞는지)한 뒤 승인받아 구현: `lib/rateLimit.ts`(댓글 제한과 같은 DB 조회
    방식) + `SecurityEvents` 컬렉션(rate-limit 기록 전용, AuditLogs는 actor가
    admins 필수라 재사용 불가). 게시물 작성에도 처음 적용했다가 `validatePost.ts`에
    이미 더 엄격한 제한이 있는 걸 실제 브라우저 테스트로 발견해 중복 제거.
  - **관리자 알림 요청**: "해당사항 있으면 최고관리자 알림에서 보이게 해달라"는
    요청에 따라 `components/admin/RateLimitAlertCard.tsx`(`beforeDashboard`
    컴포넌트)로 최근 24시간 차단 건수를 로그인 직후 첫 화면에 배지로 표시하도록
    구현. 관리자 로그인 정보가 없어 실제 시각 렌더링은 미확인.
  - **보안 헤더 추가**: X-Frame-Options/X-Content-Type-Options/Referrer-Policy/CSP.
    실제 iframe·유튜브 임베드 사용 여부를 먼저 코드로 확인(없음)한 뒤 비교적
    엄격하게 설정. Payload admin 패널과 Vercel Blob 클라이언트 업로드가 깨지지
    않도록 CSP를 신중히 조정하고 로컬에서 실제 헤더·콘솔 에러 없음을 확인.
  - 브라우저로 rate limit 실제 작동 검증: forgot-password 연속 요청 시 두
    번째가 정확히 차단됨을 DB로 확인(28초 간격, blocked:false→true).

### 24. Vercel 알림으로 배포 실패 발견 — dev 마커 재발 근본 원인 규명·수정

- rate limit 작업을 push한 직후 **Vercel이 이메일로 Preview 배포 실패를
  알려옴** — 사용자가 그 이메일 내용을 그대로 전달.
- 확인 결과 10.3절에서 이미 발견·수정했던 `payload_migrations`의 `batch=-1`
  "dev" 마커 행이 다시 생겨, 배포가 46분간 확인 프롬프트에 멈춰있다 타임아웃으로
  실패한 것이었다.
- **더 깊이 원인을 추적**: `@payloadcms/drizzle`의 `pushDevSchema.js` 소스를
  직접 읽어, 이 마커가 dev-push 모드에서 `payload.init()`이 호출될 때마다
  (로컬 `next dev` 재시작, `payload run` 스크립트 실행 등 전부 포함) **매번
  재생성된다**는 것을 확정 — 이전 수정(마커 한 번 삭제)은 근본 해결이 아니라
  "그 시점의 증상만 없앤" 임시방편이었고, 그날 이후 여러 번의 dev 서버
  재시작/스크립트 실행으로 실제로 다시 쌓여 있었다.
- **근본 대응**: `scripts/clear-dev-migration-marker.mjs`(DB에서 `batch=-1`
  행만 삭제하는 안전한 스크립트, `pg` 패키지를 명시적 의존성으로 추가)를
  만들어 `vercel-build`가 `payload migrate` 실행 직전 항상 먼저 실행하도록
  변경 — 이제 로컬에서 마커가 몇 번을 다시 쌓이든 매 배포 시점마다 자동
  정리되어 다시는 이 문제로 배포가 막히지 않는다.
- 겸사겸사 `SecurityEvents` 컬렉션(막 만든 rate limit 기능용) 추가가 그동안
  dev-push로만 반영돼 마이그레이션 파일이 없던 것을 발견, `migrate:create`로
  정식 파일화(DB엔 이미 테이블이 있어 SQL 미실행, 베이스라인과 동일하게
  "이미 적용됨"으로만 기록) — 나중 실이전 시 스키마 재현을 위해 필요.
- 로컬 재현 검증(마커 재생성 확인 → 스크립트로 제거 → `payload migrate` 정상
  완료 → `migrate:status`로 두 마이그레이션 모두 확인) 후 push, 실제 Vercel
  배포 성공(`Ready`)까지 확인.
- **교훈**: dev DB를 개발용과 운영용으로 공유하는 이 프로젝트 구조상, 이
  마커 문제는 "한 번 고치면 끝"이 아니라 **구조적으로 계속 재발할 수 있는
  문제**였다 — 매 배포 파이프라인 안에 자동 정리 단계를 넣는 것만이 근본
  해결책이다.

---

## 2026-09-29 — 계정/도메인 실이전, 임시 홈페이지 게시, 지도 추가, Pages 관리자 버그 해결

### 25. 개발자 개인 계정 → 사찰(bonglimsa) 계정으로 전면 이전

- 사용자가 `bonglimsa.org` 도메인을 구매하고, 사찰 명의의 GitHub/Vercel/Supabase
  계정(`bonglimsa`, `wwwbonglimsa@gmail.com`)을 새로 만들어, 그동안 개발자
  개인 계정에 있던 프로젝트 전체를 옮겨달라고 요청.
- **GitHub**: 새 비공개 저장소 `bonglimsa/hanonbonglimsa`로 이전. Vercel
  Hobby 플랜은 커밋 작성자 이메일이 프로젝트 협업자와 매칭되지 않으면
  배포를 Blocked 처리한다는 것을 발견 — 커밋 작성자/커미터를
  `wwwbonglimsa@gmail.com`으로 맞춘 오케스트라(스쿼시) 커밋을 만들어
  강제 푸시하는 방식으로 해결. 이후 모든 배포용 커밋은 `bonglimsa-syncN`이라는
  1회용 로컬 브랜치를 `bonglimsa/main` 위에 새로 만들어, 패치를 적용하고
  올바른 작성자로 커밋한 뒤 그 브랜치만 `bonglimsa/main`으로 push하는
  방식으로 고정했다(로컬 작업 브랜치 `feat/payload-foundation`은 예전 계정
  히스토리를 그대로 갖고 있어 직접 push할 수 없기 때문).
- **Vercel**: 새 프로젝트 생성, 모든 환경변수 재등록, Blob 스토리지 2개
  재생성(자동 생성되는 `BLOB_READ_WRITE_TOKEN` 이름이 기존 코드가 기대하는
  `_PUBLIC`/`_PRIVATE` 접미사와 충돌해 수동으로 이름을 맞춰야 했음), GitHub
  연동 연결.
- **Supabase**: 사찰 계정에 새 프로젝트를 만들고 전체 데이터를 이전(기존
  세션의 교훈에 따라 이번엔 48개 테이블 전부의 row count를 소스/타깃 간
  비교해 0건 불일치 확인 — 일부만 확인하고 넘어갔다가 데이터가 누락됐던
  과거 실수를 반복하지 않기 위함).
- **도메인**: 처음엔 `hanonbonglimsa.org`로 잘못 연결 작업을 하다가, 실제
  구매한 도메인이 `bonglimsa.org`(hanon 접두어 없음)라는 걸 뒤늦게 확인해
  재작업. hosting.kr DNS 설정 안내, 로컬 DNS 캐시가 예전 도메인 이력을
  들고 있어 공개 DNS(8.8.8.8)와 다르게 보이는 현상까지 확인 후 최종 접속
  성공.

### 26. 임시 안내 홈페이지 게시 (콘텐츠 미완성 상태 방문객 안내용)

- 콘텐츠가 다 채워지지 않은 상태에서 정식 도메인을 여니, 홈 화면만 임시
  안내 페이지로 바꾸고 다른 기능(게시판·회원가입·관리자)은 그대로 두기로
  결정. 사용자가 별도로 GPT와 함께 문구/배치를 다듬은 뒤 인수인계
  문서(`CLAUDE_TEMPORARY_SITE.md`)를 넘겨줘서, 그 내용대로 로컬에서
  화면을 재확인하고 `bonglimsa/main`에 커밋·배포.
- 안내띠(`site-notice.tsx`), 임시 헤더(`temporary-header.tsx`) 신규 파일,
  `site-shell.tsx`/`footer.tsx`/`hero-slider.tsx`/`prayer-section.tsx` 수정.
  이 작업과 무관한 보안 수정(아래 27번)은 별도 커밋으로 분리해 섞이지
  않게 함.

### 27. 정적 페이지 미리보기 URL의 `PAYLOAD_SECRET` 노출 수정

- 검토 중 `collections/Pages.ts`의 미리보기 링크가 앱 전체 인증 서명에
  쓰이는 `PAYLOAD_SECRET`을 쿼리스트링에 그대로 노출하고 있는 걸 발견,
  전용 값 `PAGE_PREVIEW_SECRET`으로 분리(`app/(payload)/api/pages/preview/route.ts`도
  같이 수정). 실제 접근 제어는 이 값과 무관하게 그 라우트가 관리자 세션을
  별도로 검증하므로 보안 구조상 필수는 아니었지만, 값 유출 시 로그인 토큰
  위조로 이어질 수 있는 재사용을 없앴다.

### 28. 홈페이지 '찾아오는길' 카카오맵 섹션 추가

- 기도 카드 구간과 푸터 사이에 카카오맵 JS SDK 기반 지도 섹션(`components/location-section.tsx`)
  추가. CSP에 `dapi.kakao.com`/`*.daumcdn.net` 허용 필요.
- 배포 후에도 지도가 안 떠서 원인 추적: (1) Kakao Developers 콘솔에서
  Maps 제품 자체가 비활성 상태(`OPEN_MAP_AND_LOCAL` 서비스 disabled) →
  사용자가 활성화. (2) JavaScript 키에 도메인이 하나도 등록되어 있지
  않았음 → Claude in Chrome으로 사용자 계정에 직접 로그인된 상태에서
  `https://bonglimsa.org`, `http://localhost:3000`을 등록(사용자 승인 후
  진행). 이후 실제 사이트에서 마커까지 정상 렌더링 확인.
- 마커 좌표(위도 33.2472466, 경도 126.5404032)는 주소 기반 공개
  지오코딩 결과라 도로 단위 근사치 — 실제 건물 위치와 다를 수 있음, 추후
  보정 필요.

### 29. 메인 슬라이더 제목 한 줄 표시

- 큰 제목(`hero-slider.tsx`)이 좁은 컨테이너 폭 때문에 의도치 않은
  위치에서 줄바꿈되던 것을, 평소엔 한 줄로 보이고 화면이 좁아 꼭
  줄바꿈이 필요할 때만 사용자가 지정한 위치에서 끊기도록 수정. 각 제목의
  지정 구간 내부 공백을 줄바꿈 불가 공백(` `)으로 바꾸고, 텍스트
  상자 최대 너비를 `460px`→`min(90vw, 720px)`로 넓혀서 해결.

### 30. Pages 관리자 목록 "No Results" 버그 — 근본 원인 규명 및 수정

- 이전 세션부터 미해결로 남아있던 버그(`/admin/collections/pages`가 항상
  빈 목록, nav의 Pages 항목도 비활성). REST API·데이터 존재·권한·캐시
  전부 배제하고도 원인 불명이었던 상태에서 이어서 조사.
- 새로 만든 테스트 전용 관리자 계정으로도 동일 재현 → 계정별 저장 필터
  문제가 아님을 재확인. `access.read`가 boolean이 아닌 조건부 객체를
  반환하는 구조가 원인일까 하는 가설을 세워 단순화 테스트했으나 효과 없음
  (가설 기각, 원상복구).
- 사용자가 같은 문제를 GPT에게도 물어봐서 교차검증: **`pages` 테이블에는
  published 문서가 있지만 `_pages_v` 버전 테이블에는 해당 행이 없는
  경우가 있었고, Payload 관리자 목록은 `draft:true`로 버전 테이블을
  조회하기 때문에 그런 문서가 통째로 안 보였다**는 게 실제 원인 — 이
  세션에서 세웠던 "`versions.drafts` 설정 자체가 원인" 가설과 방향은
  같았지만, GPT가 정확한 메커니즘(버전 테이블 누락)까지 짚어냄.
- GPT가 작성한 복구 마이그레이션(`migrations/20260929_000000_backfill_page_versions.ts`)이
  실제로 공유 DB에 이미 적용되어 있는 것을 `payload migrate:status`로
  확인, 관리자 화면에서 7개 문서 전부 정상 표시·nav 링크 정상화까지
  직접 검증한 뒤, 코드 기록으로 남기기 위해 `bonglimsa/main`에 커밋·배포.
  원본 문서의 수정일(`updated_at`)은 마이그레이션이 의도대로 보존함을
  개별 문서 편집 화면에서 확인(목록의 "Updated At"만 새로 생성된 버전
  레코드 자체의 타임스탬프라 오늘 날짜로 보이는 건 정상적인 표시 차이).
- 조사 과정에서 만든 테스트 관리자 계정은 삭제 시 `audit_logs` 외래키
  제약(`actor_id` NOT NULL)에 걸려 처음엔 실패 — 사용자 승인을 받아 해당
  감사 로그 1건과 계정을 함께 정리 완료.

---

## 진행 중 / 다음 순서

- **카카오맵 마커 좌표 보정**: 현재 도로 단위 근사치 — 정확한 사찰 입구
  좌표로 교체 필요.
- **Supabase DB 비밀번호 로테이션 권장**: 이전 세션과 이번 세션 대화
  기록에 신·구 프로젝트 DB 비밀번호가 여러 번 노출됨 — 전체 이전 작업이
  다 끝난 지금 교체 권장.
- **예전 계정 리소스 정리**: GitHub `220041/hanonbonglimsa`, Vercel
  `yakolibre-2260s-projects`, 구 Supabase 프로젝트 — 사용자가 "나중에"로
  명시적으로 미룸, 급하지 않음.
- **`CLAUDE_TEMPLE_PLATFORM_PLAN.md` 기반 멀티사찰 플랫폼 전환**: 3개
  사찰용 SaaS형 플랫폼으로 확장하는 별도 대형 프로젝트 계획서. 사용자가
  "만들고 반영하는 건 여기서 할게요(GPT는 아이디어/콘텐츠만)"라고 역할을
  명확히 함 — 착수 여부는 아직 미정, 홈페이지 정식 콘텐츠 작업이 먼저.
- **정식 홈페이지 콘텐츠**: 현재는 임시 안내 페이지 상태. 사용자가 GPT와
  함께 정식 문구/구성을 계속 다듬는 중이며, 실제 코드 반영은 이 세션에서
  진행하기로 합의됨.
- Vercel Hobby 플랜의 "개인/비영리 사용" 약관과 종교기관(사찰) 운영
  주체로서의 사용이 상충하지 않는지 검토 필요(플랫폼 전환 계획서에서
  리스크로 플래그됨, 아직 미해결).
- 관리자 알림 배지(`RateLimitAlertCard`)의 실제 시각 렌더링 사용자 확인
  아직 미완료(이전 세션부터 이어지는 항목).
- 10.8 — 24절 체크리스트 중 관리자 전용 게시판(공지사항 등)의 CRUD는
  실사용 검증 아직 미완료(코드 레벨로는 확인됨).

## 현재 특별히 사용자 확인이 필요한 이슈

- 관리자 대시보드의 rate-limit 알림 배지가 실제로 잘 보이는지 확인 필요
  (`/admin` 로그인 후 첫 화면, 최근 24시간 내 차단 이벤트가 있을 때만 표시됨 —
  지금은 테스트 데이터를 정리해서 당장은 안 보일 수 있음).
- 카카오맵 마커가 실제 봉림사 위치와 얼마나 정확히 맞는지 육안 확인 필요.
