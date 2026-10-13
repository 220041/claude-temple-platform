# claude-temple-platform 작업 내역

`D:\01.Dev\claude-temple-platform` — `CLAUDE_TEMPLE_PLATFORM_PLAN.md` 기반 멀티사찰 플랫폼 전환 작업 기록. Stage별 순서대로 정리.

## 0. 작업공간 준비 (2026-09-30)

- `D:\01.Dev\hanonbonglimsa`에서 플랫폼 개발에 필요한 코드/문서만 복사해 `D:\01.Dev\claude-temple-platform`을 독립 작업공간으로 분리(운영 소스는 미변경).
- 독립 git 저장소 초기화, GitHub `220041/claude-temple-platform`(private, 개인 계정)에 push.
- Supabase: 이미 존재하던 `claude-temple-platform` 조직/프로젝트(ap-northeast-2, ref `utwjhbgybiaoccjlifql`)를 그대로 사용하기로 결정 — hanonbonglimsa 운영 DB(ref `dpsqnfgifpfenzicmigv`)와 완전히 분리된 별도 dev DB. DB 비밀번호 재설정 후 `.env.local` 구성(특수문자 `!`는 `%21`로 퍼센트 인코딩).
- `pnpm install`, `payload migrate:status`로 기존 마이그레이션 3개 적용 확인.
- Blob 토큰·카카오맵 키는 hanonbonglimsa 것을 그대로 재사용(RESEND 관련 값은 원본도 비어있어 공란 유지).
- 이 dev DB는 원래 콘텐츠 데이터(pages/boards/posts/members)가 0건이었음 — Stage 2 작업을 위해 hanonbonglimsa 실제 사이트와 동일한 boardKey 8개·페이지 3개를 지속 픽스처로 시딩.

## Stage 1 — 사찰별 설정과 한국어 관리자 경험 (완료, 11개 커밋)

목표: 사찰명·로고·SEO·색상·이메일 발신명 등을 코드에서 Payload 데이터(`SiteSettings`/`HomePage`)로 옮기고, `installed=false`일 때 특정 사찰 자료 대신 범용 "설치 미완료" 화면을 보여주게 함.

1. `refactor` 관리자 접근제어 헬퍼(`lib/access.ts`)로 통합 — 동작 무변화
2. `feat` `SiteSettings`/`HomePage` 필드 확장 + 하논봉림사 정체성 백필(installed:true)
3. `feat` `layout.tsx`/`lib/seo.ts` 메타데이터를 SiteSettings 연동 — 모든 `<title>` 기존과 바이트 단위 동일 확인
4. `feat` `SiteLogo` 공용 컴포넌트 + header/footer/site-shell SiteSettings 연동(로고 태그라인·종단명 등)
5. `feat` 색상 5개 토큰(`accent`/`ink`/`deep`/`pine`/`paper`)을 CSS 변수로 전환
6. `feat` 홈 섹션(히어로/기도카드/사찰소개/찾아오는길)을 CMS 데이터 전용으로 전환, 하드코딩 폴백 제거
7. `feat` **installed=false 빈 상태(InstallationPending) — Stage 1 통과 기준**. 브라우저로 직접 왕복 테스트: installed=false → 봉림사 자료 전혀 안 보임 확인, true로 복원
8. `fix` 닉네임 차단어·이메일 제목을 SiteSettings 기반으로 일반화(하드코딩 "봉림사" 제거)
9. `chore` 관리자 대시보드에 "자주 하는 작업" 바로가기 카드
10. `fix` `cleanup.ts` 고아 미디어 정리 로직이 `SiteSettings.logo`도 참조로 인식하도록 수정(안 하면 로고가 삭제될 뻔함)

## Stage 2 — 메뉴와 페이지 연결 (완료, 7개 커밋)

목표: header.tsx/footer.tsx에 각각 하드코딩된 메뉴를 `MainMenu` 단일 데이터로 통합하고, 최고관리자가 메뉴 이름·순서·연결 대상(새 페이지/기존 페이지/게시판/외부 URL)을 직접 관리하게 함.

1. `feat` `lib/reservedPaths.ts` + `Pages.slugHistory` + 이전 주소 308 리다이렉트
2. `fix` `sitemap.ts`가 draft 페이지를 공개 sitemap에 포함시키던 기존 버그 수정(Stage 3 작업 중 발견)
3. `feat` `MainMenu` 글로벌 스키마(2단계 고정 배열 — 순환참조 구조적으로 불가능)
4. `feat` header/footer 하드코딩 메뉴를 `MainMenu`로 백필
5. `feat` **header/footer를 MainMenu 데이터로 전환 — Stage 2 통과 기준**. 브라우저로 헤더 4개 드롭다운·푸터 4개 컬럼 전체 링크 1:1 대조, `#` 플레이스홀더 3개 완전히 사라짐 확인
6. `feat` 링크피커 "새 페이지 만들기" + `create-linked-page` 엔드포인트 — 실제 UI로 끝까지 클릭 테스트(초안 페이지 생성 → 자동으로 "기존 페이지 연결"로 전환)
7. `feat` 메뉴 검증 훅 — 중복 대상 거부 + 외부URL 동일출처 거부
8. `feat` `MenuLinkWarnings` 카드 — 비공개 페이지에 연결된 메뉴 항목 경고

**발견한 것**: Payload 3.87 기본 array 필드가 이미 Move Up/Down을 제공(계획했던 커스텀 컴포넌트 불필요), `@payloadcms/ui`를 직접 의존성으로 추가해야 했음(전이 의존성만으로는 커스텀 필드 컴포넌트에서 import 불가).

**최종 통합 체크포인트**: 공지 게시·메인 사진 교체·페이지 수정·메뉴 순서 변경·게시판 생성 5개 작업을 실 데이터로 수행 후 완전 복원 확인.

## Stage 3 — 동적 게시판 (완료, 4개 커밋: `66c620c`/`3c2c561`/`52f2515`/`069b824`)

목표: `Boards.boardKey` 고정 select(8개)를 자유 slug로 바꿔 최고관리자가 새 게시판(공지형/일반형/사진갤러리형)을 직접 만들 수 있게 하고, 회원 글 승인 대기(pending) 흐름을 게시판 정책으로 추가.

**탐색으로 확인한 핵심 사실**: `components/board/*` 렌더링 컴포넌트들은 이미 boardKey에 전혀 의존하지 않고 board 문서의 정책 필드+`variant` prop만으로 동작 — 하드코딩은 정확히 3곳(Boards.boardKey 고정 select, 게시판당 4개씩 총 32개 얇은 라우트 래퍼 파일, `lib/boards.ts`/`search`/`sitemap`에 각각 독립 중복된 게시판 목록)뿐이라 예상보다 범위가 작음. 회원 글 승인 개념은 코드에 전혀 없어 새로 설계(`guide.md` 2.2절이 "별도 승인 워크플로"를 1차 제외 범위로 명시해둔 완전 신규 기능).

**스키마 (A0, 이전 라운드에 커밋)**: `boardKey`를 `select`→`text`로 전환, `boardType`(공지형/일반형/사진갤러리형)·`memberPostApproval`(즉시공개/승인후공개) 필드 추가.

**동적 라우트 + 경로/검색/sitemap**: `app/(frontend)/boards/[slug]/{page,[id]/page,write/page,[id]/edit/page}.tsx` 4개 신규(기존 8개 전용 래퍼와 동일 패턴, `components/board/*`는 무변경). `lib/boards.ts`의 `pathForBoardKey` fallback을 `'/'`→`` `/boards/${boardKey}` ``로 수정(새 게시판 글이 전부 홈으로 링크되던 버그), `isLegacyBoardKey`/`getAllBoards` 추가. 기존 8개 boardKey는 DB에 실존해 `/boards/[slug]`에서 이중 노출될 수 있어 명시적으로 404 처리. `search/page.tsx`의 `BOARD_OPTIONS` 하드코딩과 `sitemap.ts`의 `STATIC_PATHS` 게시판 목록을 `getAllBoards()` 동적 조회로 교체.

**회원 글 승인 대기(moderationStatus)**: `Posts.moderationStatus`(approved/pending/rejected, 기본 approved) 추가. `setPostAuthor.ts`가 작성 시(회원+승인제 게시판이면 pending) 및 수정 시(승인제 게시판 글을 작성자 본인이 고치면 반려 여부 무관하게 항상 pending으로 복귀, 반려 사유 초기화) 자동 지정. `Posts.access.read`는 기존 `commonReadConditions`(hiddenAt 등, 무변경)에 moderationStatus 조건만 분기 추가 — 본인 글은 예외 통과, 관리자는 **게시물 ID로 직접 접근할 때만** 완전 우회(hiddenAt과 동일한 기존 관례 확장, 목록 조회에서는 관리자도 못 봄). `Comments.ts`의 inline access.read where에도 동일 조건을 추가(안 하면 승인대기 글 자체는 안 보여도 댓글은 새는 구멍이 있었음 — Plan 검증 단계에서 발견). 관리자 검수는 `components/admin/ModerationQueueCard.tsx`(대시보드 카드, `/admin/collections/posts/{id}` 딥링크) 하나로 끝 — 별도 승인/반려 API 없이 Payload 문서 편집 화면에서 moderationStatus 필드를 바꿔 저장. 상세/마이페이지에 작성자 본인에게만 보이는 승인대기·반려 배지 추가.

**검증**: Payload local API로 즉시공개/승인대기 생성, 익명·타회원·본인·관리자(목록 vs ID직접) 열람 권한, 댓글 누수, 반려→재제출 pending 복귀까지 18개 시나리오를 임시 계정/게시판/게시물로 실행 후 삭제. 브라우저로 `/boards/[slug]` 렌더링, 관리자 로그인 후 대시보드 카드·딥링크·moderationStatus 필드 실동작 확인. 기존 8개 게시판 목록/sitemap/레거시 slug 404 회귀 없음 확인.

**커밋 완료 후 추가로 발견·수정(`069b824`)**: 검토 문서 §4가 미리 짚었던 지점(`syncPostImageVisibility.ts`가 moderationStatus를 모름)을 실제로 재현해보니 진짜였다 — 회원 글은 작성 즉시 `_status:'published'`가 강제돼 승인대기 중에도 첨부 이미지가 `media-private.isPublic:true`로 설정되고, 파일 스트리밍 엔드포인트가 Posts.access.read와 무관하게 익명에게 노출되고 있었음. `isPostVisible`에 moderationStatus 체크 추가로 수정. 같은 작업 중 A2에서 만든 "진짜 private 접근" 개발용 Blob 스토어가 설치된 플러그인(access:'public'만 지원)과 맞지 않아 업로드가 깨지는 것도 발견해 되돌림(위 A2 정정 참고).

상세 설계는 `C:\Users\yakol\.claude\plans\temporal-fluttering-cookie.md`(로컬 플랜 파일, 저장소 밖)에 있음.

**감사기록 연동(2026-10-02)**: `AuditLogs.action`에 `content-moderation`("회원 글 승인 상태 변경") 추가(마이그레이션 `20261001_232418_audit_logs_moderation_action`). `auditPostChanges`가 관리자가 `moderationStatus`를 바꿀 때만 기록하며 `reason`에 조치 사유, `metadata`에 `{from,to}`를 남김. 임시 관리자/게시판/게시물로 승인→반려→재승인 실행: 상태 변경 2건만 기록되고 사유만 바꾼 수정은 기록 안 됨을 확인 후 전부 삭제. (참고: `payload migrate`는 `payload run` 등으로 재생성된 dev 마커 때문에 프롬프트에서 멈추므로, 로컬에서는 `.env.local`을 로드한 뒤 `scripts/clear-dev-migration-marker.mjs`를 먼저 실행해야 함.)

## 우선순위 A — 안전·정합성 (완료, 5개 커밋)

목표: `PLATFORM_REVIEW_2026-09-30.md`(외부 검토 문서)가 지적한 R1~R5 다섯 개 안전 문제를 Stage 3 재개 전에 먼저 해결.

1. `feat` A0 — Stage 3 스키마 체크포인트 마무리(`boardType`/`memberPostApproval` 마이그레이션 적용 + 커밋)
2. `fix` A1(R5) — `collections/Boards.ts` `update: anyAdmin` → `superAdminOnly`로 변경, 게시판 정책 수정을 최고관리자 전용으로 제한
3. (코드 변경 없음, 커밋 없음) A2(R1) — 개발용 Vercel Blob 스토어를 하논봉림사 운영과 분리. `claude-temple-platform-dev-public`·`claude-temple-platform-dev-private` 전용 스토어를 생성해 `.env.local`의 `BLOB_READ_WRITE_TOKEN_PUBLIC`/`_PRIVATE`을 교체(둘 다 Vercel access는 **public**). **정정(2026-10-01)**: 처음에 "`-dev-private` 스토어가 실수로 public 접근으로 생성돼 있던 걸 private으로 바로잡았다"고 기록했었는데 이건 틀렸다 — 설치된 `@payloadcms/storage-vercel-blob` 플러그인은 `access:'public'`만 지원하고(하논봉림사 운영 `payload.config.ts`도 동일하게 `access` 미지정), `media-private`의 실제 비공개 처리는 Vercel 스토어 자체가 아니라 Payload의 `/api/media-private/file/...` 앱 레이어 접근제어가 담당하는 기존 설계다(`collections/MediaPrivate.ts` 상단 주석에 명시). 스토어를 진짜 private 접근으로 바꿨다가 업로드가 깨지는 걸 뒤늦게 발견해(아래 `069b824` 커밋 작업 중) 다시 public으로 되돌림 — **처음부터 public이 맞는 구성이었다.**
4. `fix` A3(R3) — 하논봉림사 전용 데이터 백필(`SiteSettings`/`MainMenu`)을 공용 마이그레이션에서 `scripts/seed-hanonbonglimsa-*.ts`로 분리, 원 마이그레이션은 no-op화. `clear-dev-migration-marker.mjs`에 테이블 존재 확인 추가
5. `fix` A4(R2) — `lib/cleanup.ts`의 `purgeOrphanMedia`가 `pages` 블록 직접 참조 + `pages`/`posts` 버전 히스토리 + 24시간 이내 업로드까지 보호하도록 수정
6. `fix` A5(R4) — `components/header.tsx`/`footer.tsx`가 하위 메뉴 없는 1단계 메뉴 항목(`item.href` 보유)을 클릭 가능한 링크로 렌더링하도록 수정, href 없는 자식은 완전히 걸러냄(죽은 링크 제거). 브라우저로 PC 드롭다운 직접 링크·화살표 분리 동작, 푸터 컬럼 제목 링크, 기존 그룹형 펼침 동작 회귀 없음을 확인

검토 문서의 §4(Stage 3 보완표)·§6(운영자 UX)·B~E 로드맵과 Stage 3 잔여 작업(동적 라우트, search/sitemap 동적화, moderationStatus 승인 흐름)은 이번 라운드에 포함하지 않음 — 다음 계획에서 별도로 다룸.

## B단계 — 새 안내 페이지를 만들어 메뉴에 공개 (완료, 3개 커밋: `8645497`/`031b502`/`c921a9f`)

목표: 검토 문서 §5 B단계("양식 선택 → 글·사진 입력 → PC/휴대폰 미리보기 → 메뉴 위치 선택 → 공개 → ... → 이전 버전 복원") 전체.

- `components/admin/pages/TemplatePicker.tsx`: 새 페이지(blocks 비어있음)에서만 뜨는 카드형 버튼("사찰 소개"/"오시는 길"/"사진 모음"/"빈 페이지로 시작"). `@payloadcms/ui`의 `addFieldRow`(공식 블록 추가 API — `dispatchFields` 직접 조작은 하위 필드 컴포넌트가 제대로 안 그려짐)로 블록 조합을 한 번에 채운다. 표시 여부는 필드 `admin.condition`이 아니라 컴포넌트 로컬 state로 판단(안 그러면 "빈 페이지" 선택 시 blocks가 계속 비어있어 피커가 안 사라짐).
- `components/admin/pages/AddToMenuButton.tsx` + `app/(payload)/api/pages/add-to-menu/route.ts`: 기존 "메뉴 편집 화면 → 새 페이지 만들기"(`CreateLinkedPageButton.tsx`)의 반대 방향. 메뉴 구조 변경은 R5 선례대로 최고관리자 전용, 저장 안 한 변경사항 있으면 비활성화, 중복 연결은 409.
- **`lib/payload.ts`의 `getMainMenu()` 버그 수정**: `overrideAccess` 기본값(true)이 `pageRef` 관계 populate에도 적용돼 미공개(draft) 페이지가 공개 메뉴에 실제 링크로 노출되는 기존 버그를 발견해 `overrideAccess:false`로 수정. 페이지→메뉴 연결이 쉬워지면서 이 구멍이 바로 트리거되는 상황이라 함께 고침.
- `components/admin/pages/StatusBadge.tsx`: "임시 저장됨/아직 공개되지 않음/홈페이지에 반영됨"을 한글 배지로 표시(`useFormModified`+`useDocumentInfo().hasPublishedDoc`), 공개 시 실제 주소 링크 포함.
- **Live Preview**: `@payloadcms/live-preview-react`/`@payloadcms/live-preview`(payload 코어와 동일 3.87.0 고정 — 안 맞추면 런타임 에러) 설치, `payload.config.ts`의 `admin.livePreview.url`이 기존 `/api/pages/preview` 라우트(미리보기 secret+draftMode 활성화)를 재사용해 iframe이 초안을 보여줌. 모바일/태블릿 breakpoint 추가. `components/RefreshRouteOnSave.tsx`를 `pages/[slug]/page.tsx`에 draft 모드일 때만 렌더링 — 저장할 때마다 postMessage로 iframe이 자동 새로고침.
- 브라우저로 전체 흐름 검증: 템플릿 선택(블록 3개 자동 추가)→저장→draft 상태 메뉴 연결(방문자 화면엔 비활성 라벨만)→공개 전환 후 정상 링크, 중복 연결 409·editor 403, 상태 배지 3단계 전환, Live Preview 분할화면·모바일 전환·저장 시 자동 새로고침까지 실측 확인 후 임시 데이터 삭제.

상세 설계는 `C:\Users\yakol\.claude\plans\temporal-fluttering-cookie.md`(로컬 플랜 파일, 저장소 밖)에 있음(B단계 설계는 Plan 수정 전 버전 — 라이브 미리보기는 계획 이후 추가 조사로 구현).

## C단계 — 메인 사진·홈페이지 구성 수정 (완료, 4개 커밋: `697b5c1`/`a8dc170`/`181bf3e`/`9a95935`)

목표: 검토 문서 §5 C단계("사진 교체와 초점/잘림 확인, 섹션 표시·순서 변경, 준비 중/정식 공개 전환, 홈·메뉴·푸터 초안/게시/복원") 전체. 메뉴/푸터 초안 기능은 SiteShell이 모든 페이지에 영향을 줘 범위가 훨씬 커서 사용자 결정으로 HomePage만 먼저 진행, 다음 라운드로 미룸.

- **준비 중/정식 공개 전환(`697b5c1`)**: `app/(frontend)/page.tsx`가 `installed` 여부와 무관하게 `temporaryHome`을 하드코딩하고 있던 버그 발견·수정 — 사찰 정보를 다 채워도 홈 화면만 계속 메뉴 없는 임시 헤더였음(다른 모든 페이지는 이미 정상). `SiteSettings.homepageReady`(기본 false, 기존 동작 보존)로 관리자가 직접 전환 시점을 결정. `SiteSettings.siteNoticeText` 추가, `SiteNotice`가 하드코딩 문구 대신 이 값을 표시(비어있으면 배너 자체가 안 뜸).
- **섹션 순서 변경(`a8dc170`)**: `HomePage.sectionOrder`(array, 정확히 3행 — templeIntro/prayer/location 각 1회, validate로 강제) 추가. 표시 여부(기존 show* 체크박스)와 순서(신규 필드)를 분리해 혼동 방지. array 필드 기본 Move Up/Down으로 순서 변경.
- **사진 초점/잘림(`181bf3e`)**: Payload가 미디어 업로드 컬렉션에 focalPoint 편집기를 기본 제공(`focalX`/`focalY`가 이미 존재)하는데도 프런트엔드가 전혀 안 쓰고 있던 걸 발견 — 메인 슬라이드가 항상 가운데(50/50) 기준으로만 잘렸음. `HeroSlider`가 `objectPosition`으로 초점을 반영하도록 수정.
- **HomePage 초안/게시/복원 + Live Preview(`9a95935`)**: `versions.drafts` + `admin.preview`/`admin.livePreview` 추가. 기존 미버전 global에 처음 버전을 추가할 때 새 `_status` 컬럼 기본값이 'draft'라 이미 공개 중이던 콘텐츠가 관리자 화면엔 모순되게 "Draft"로 보이는 문제(Pages 선례와 동일)를 같은 마이그레이션에서 발행 처리로 바로잡음. `app/(payload)/api/home-preview/route.ts` 신규(Pages 미리보기와 동일한 2중 인증, 대상만 "/" 고정). 브라우저로 마이그레이션 직후 회귀 없음(curl로 쿠키 없이 재확인), Live Preview 분할화면 자동 갱신, Draft 저장이 공개 화면에 영향 없음, Versions 복원까지 전부 확인.

**MainMenu/FooterSettings 초안·게시·복원 + Live Preview(2026-10-02)**: C단계에서 미뤘던 항목 완료.
- 두 글로벌에 `versions.drafts` + `admin.preview` 추가, `payload.config.ts`의 `livePreview.globals`에 등록. 미리보기 URL은 `lib/previewUrl.ts`의 `shellPreviewUrl()` → `api/home-preview?to=shell`이 `/login`으로 리다이렉트(홈이 "준비 중"이면 임시 헤더·푸터라 메뉴가 안 보이므로 항상 정식 헤더·푸터를 쓰는 페이지로 보냄).
- `SiteShell`이 `draftMode()`일 때만 `getMainMenu(true)`/`getFooterSettings(true)`로 초안을 읽음(공개 방문자는 항상 게시본). `RefreshRouteOnSave` 렌더링을 홈/`pages/[slug]`에서 `SiteShell`로 이동해 중복 제거.
- 마이그레이션 `20261001_235402_main_menu_footer_versions`: 버전 테이블 추가 + 기존 내용을 published로 백필(HomePage 선례). 메뉴 `label` NOT NULL 해제(초안 저장은 필수값 검증을 건너뜀).
- **`add-to-menu` 라우트 주의점**: 메뉴에 게시 안 한 초안이 있을 때 게시본 위에 덮어쓰면 편집 중인 초안이 사라지므로, 최신 상태가 draft이면 409로 거부하고 `_status:'published'`로 즉시 게시(기존 B단계 동작 유지). `MenuLinkWarnings`는 초안 기준으로 경고.
- 검증: API로 초안 저장→게시본 불변·초안 조회(`overrideAccess:false` 포함)·게시 반영·복원, 브라우저로 상태 배지(Published/Changed)·Save Draft·Versions·Revert to published·새 탭 미리보기 및 분할 Live Preview(저장 시 푸터 자동 갱신)·쿠키 없는 방문자에게 초안 비노출·`add-to-menu` 409→되돌리기 후 200 확인. 테스트 데이터는 모두 삭제(임시 관리자 삭제는 감사기록/세션/환경설정 FK 때문에 SQL로 먼저 정리해야 했음).
- 참고: 새 탭 미리보기를 열어 둔 채 다른 탭에서 자동화 스크린샷을 찍으면 `visibilityState:hidden`이라 캡처가 타임아웃됨(페이지 문제 아님).

**다음 라운드로 미룬 것**: (없음 — C단계 범위 완료)

## E단계(일부) — 주간 데이터 백업 + 4주 보관 + 이메일 알림 (완료, 1개 커밋: `a9bba14`)

목표: 검토 문서 §5 E단계("주간 DB/파일 백업 4주 보관과 양측 이메일 알림") 중 백업 기능 자체(기존엔 전혀 없었음). 실제 신규 사찰 설치 QA(별도 DB/Blob 리소스 생성 필요)는 사용자 결정으로 다음 라운드로 미룸.

- `lib/backup.ts`: `payload.config`에서 컬렉션/글로벌 목록을 동적으로 가져와 JSON으로 백업(업로드 이미지 원본은 재복사 안 함 — 이미 Blob에 내구성 있게 저장돼 있고 복구 우선순위는 구조화 콘텐츠가 더 높음). `Members.email`/`realName`은 PII라 제거. `@vercel/blob`의 `put()`으로 `BLOB_READ_WRITE_TOKEN_PRIVATE` 스토어 `backups/` 경로에 직접 업로드(Payload Media 컬렉션 경유 안 함, 추측 불가능한 랜덤 접미사 + 공개 링크 노출 없음으로 보호), 업로드 직후 28일 지난 이전 백업 정리.
- `app/(payload)/api/cron/weekly-backup/route.ts`(신규): 기존 daily cron과 동일한 `CRON_SECRET` 인증, 별도 라우트로 분리(Vercel 정책상 cron 개수 제한 없음 확인). super-admin 전원 + `BACKUP_ALERT_EMAIL`(신규 env, 공통 유지보수자)에게 성공/실패 메일 발송.
- 부수 발견·수정: `.gitignore`의 중복 `.env*` 항목이 비밀값 없는 `.env.example`까지 무시해 지금까지 git에 한 번도 안 올라가 있었음 — 중복 항목 제거(`.env.local` 보호는 유지).
- 실제 백업 실행→Blob 파일 다운로드해 전체 키/PII 제거/비밀번호 필드 부재 확인, 401 확인, 보관 기간 경계값 단위 검증(27일 보관/29일 삭제) 후 테스트 데이터 삭제.

## E단계(일부) — 로컬 빈 DB 설치 검증 (2026-10-02, 코드 변경 없음)

외부 리소스(새 Supabase/Blob/Vercel)를 만들지 않고, 프로젝트 밖 스크래치 디렉터리에 `embedded-postgres`로 일회용 로컬 Postgres(포트 54329)를 띄워 완전히 빈 DB에 `DATABASE_URL`만 덮어써서 검증. 끝난 뒤 서버·DB·임시 파일 모두 삭제.

**통과**: `clear-dev-migration-marker`(테이블 없으면 건너뜀) → `payload migrate`로 전체 마이그레이션(신규 2개 포함, `updateGlobal` 백필 포함)이 빈 DB에서 오류 없이 적용. 최초 관리자(`/api/admins/first-register`) 생성. `installed=false`는 중립 안내 화면, 봉림사/하논 문자열 0건. 사찰 정보 입력 후 `<title>`이 사이트명을 반영하고, `homepageReady` 전환 시 정식 헤더 표시. sitemap은 `/`, `/temple-news`, `/search`만 노출.

**발견한 사찰 전용 하드코딩(미수정, 사용자 결정 필요)**:
1. `components/header.tsx` 유틸리티 바의 `/pages/prayer-info`, `/pages/location` 링크 — 새 사찰에선 404(죽은 링크). 메뉴가 비어 있어도 항상 표시됨.
2. `components/footer.tsx`(2곳)의 "마음이 힘들때 "관세음보살"을 불러보세요." 고정 문구 — 모든 설치에 노출됨.

**수정 완료(위 두 하드코딩, 같은 날)**: 사용자가 "데이터화" 방식을 선택. `MainMenu.utilityLinks`(평면 배열, 최대 4개, 페이지/게시판/외부URL)와 `FooterSettings.tagline`을 추가하고 header/footer가 이 값을 쓰게 함(비공개 페이지 링크는 `getMainMenu`의 `overrideAccess:false`로 href가 없어져 자동 숨김, tagline이 비면 문구 미표시). 마이그레이션 `20261002_001726_footer_tagline_utility_links`(추가만). 하논봉림사 값은 `scripts/seed-hanonbonglimsa-utility-links.ts`로 보존 — **하논봉림사 운영 DB에는 배포 후 이 스크립트를 한 번 실행해야 기존 화면(기도·법회/오시는 길 링크, 관세음보살 문구)이 유지됨**(안 하면 사라짐). 검증: 공개 페이지 링크 표시·비공개 페이지 링크 숨김·문구 표시·설정 비우면 둘 다 사라짐·시드 2회 실행 멱등. 참고: `payload run`은 `main().then(...)` 형태면 비동기 작업 전에 종료하므로 top-level `await`를 써야 함.

**검증 못 한 것**: 주간 백업 라우트(Blob 토큰 필요), 별도 Vercel 배포, 업데이트·복구 시나리오.
**주의**: 쿠키 인증은 CSRF(Origin) 검사 때문에 curl에서 거부되므로 `Authorization: JWT <token>`을 써야 함. 같은 디렉터리에서 `next dev`를 두 개 띄울 수 없고, `TaskStop`이 자식 node 프로세스를 못 죽일 수 있어 `taskkill`로 직접 종료해야 함.

## E단계(일부) — 백업 복구·마이그레이션 보존 검증 (2026-10-02)

**환경 정리(중요)**: 2026-10-01 15:16부터 `.env.local`은 `.env.qa-cheongsolsa.local`과 같은 값으로 **QA Supabase 프로젝트**(`claude-temple-platform-qa-cheongsolsa`, ref `hmtygapbxznjppmgowmo`)를 가리킨다. 위 로그의 "dev DB"(ref `utwjhbgybiaoccjlifql`)는 `.env.hanon-backup.local`에 보관돼 있다. 오늘의 마이그레이션·테스트는 QA 프로젝트에 적용했고 테스트 데이터는 모두 삭제했다.

**Vercel**: 기존 프로젝트 `claude-temple-platform`(배포 이력 없음)에 QA 프로젝트 값으로 Production 환경변수 10개를 등록(`NEXT_PUBLIC_SERVER_URL`은 `https://claude-temple-platform.vercel.app` 가정값 — 첫 배포 후 실제 주소와 대조 필요). **Production 배포(`vercel deploy --prod`)는 자동 모드 분류기가 거부해 실행하지 않았다 — 사용자가 직접 실행하거나 권한을 허용해야 함.**

**발견·수정한 문제**
1. **빈 DB 설치 실패**: `20261001_235402_main_menu_footer_versions`의 백필이 `payload.updateGlobal`(API)을 썼는데, API는 "현재 코드의 전체 스키마"를 조회하므로 이후 마이그레이션(`utility_links`)이 만들 테이블이 없어 빈 DB에서 실패했다 → 원시 SQL(`INSERT ... WHERE NOT EXISTS` + `UPDATE _status`)로 교체. **교훈: 마이그레이션 안에서 Payload API를 쓰면 이후 스키마 변경 때 빈 DB 설치가 깨진다.** `20261001_050634_home_page_versions`(HomePage)도 같은 방식이라 지금은 통과하지만 HomePage 스키마가 바뀌면 같은 문제가 생길 수 있다.
2. **타입체크 회귀(푸시된 커밋 `fa65e19`)**: 시드 스크립트를 top-level `await`로 바꾼 뒤 타입체크를 다시 안 돌렸고, `tsconfig` `target: ES6`에서는 TS1378 → `next build`(`ignoreBuildErrors:false`)가 실패할 수 있었다 → `target`을 `ES2017`로 상향. (증분 캐시 때문에 `tsc`가 계속 실패해 보였으니 `--incremental false`로 확인.)
3. 백업이 휴지통(soft delete) 문서를 빼먹던 것 → `find`에 `trash:true` 추가.

**복구 도구**: `lib/backup.ts`의 `buildBackupSnapshot()` 분리, `scripts/restore-from-backup.ts`(`BACKUP_FILE=... pnpm payload run ...`, 빈 DB 전용, id 보존을 위해 `payload.db.create`로 저수준 삽입, 끝에 serial 시퀀스 조정). 검증: 미디어·게시판·페이지(블록·사진·갤러리)·게시물(첨부/대표이미지)·댓글(대댓글)·메뉴(하위·바로가기)·푸터·사이트설정·홈페이지를 원본→빈 DB로 복구해 비교, 의도한 차이(건너뛴 작성자 필드가 null)만 남음. 복구 후 새 문서 id가 이어서 생성되고 휴지통 문서도 백업에 포함됨. **복구하지 않는 것**: admins(비밀번호 해시가 백업에 없어 복구 후 새로 만들어야 함), members(이메일·실명이 백업에서 제거됨), reports/audit-logs/security-events, 버전 이력, 업로드 파일 원본(Blob에 그대로 있고 media 문서의 url만 복구).

**마이그레이션 데이터 보존**: 최근 3개 마이그레이션 파일을 뺀 이전 스키마(`NODE_ENV=production`으로 push 비활성)에 메뉴·푸터 데이터를 직접 넣고 나머지를 적용 → 데이터 그대로, `_status`는 published. (참고: Payload는 `index.ts`가 아니라 `migrations/` 디렉터리 파일을 읽고, 개발 모드는 스키마를 자동 push하므로 시뮬레이션하려면 파일을 빼고 `NODE_ENV=production`으로 실행해야 함.)

## Production 배포 + 주간 백업 실검증 (2026-10-12)

**커밋·푸시**: 미커밋이던 4건을 2개 커밋으로 푸시. `7597f98`(tsconfig target ES2017) / `b1d06f1`(빈 DB 설치 마이그레이션 수정 + 백업 스냅샷 분리·휴지통 포함 + 복구 스크립트). `origin/main` = `b1d06f1`.

**Vercel Production 배포**: `https://claude-temple-platform.vercel.app` (`dpl_BAYHtk2qhdwB8hXMK8z1rz22fdVi`, READY). 1차 배포(`dpl_8YRniaKs7opopnYAPXPJjW1DXQtC`)는 `payload migrate`에서 `tenant/user postgres.hmtygapbxznjppmgowmo not found`로 실패 — **원인은 QA Supabase 프로젝트가 무료 플랜 비활성으로 일시 중지(Paused)돼 있었기 때문**. 대시보드에서 Restore 후 재배포 성공. 확인: 마이그레이션 통과, `NEXT_PUBLIC_SERVER_URL`이 실제 별칭과 일치, `/` 200(제목 "사찰 홈페이지", 봉림사/하논/관세음보살 문자열 0건), `/sitemap.xml` 200, Deployment Protection 없음, 무인증 `/api/cron/weekly-backup` 401.

**주간 백업 실검증**: `.env.local`의 `CRON_SECRET`으로 호출 → 200, Blob `backups/backup-2026-10-12-….json` 생성(12,944B, 비밀번호·해시 필드 없음, 마이그레이션 19건). 메일은 건너뛰기 결정대로 미검증. **이 테스트 백업은 같은 날 삭제함**(프로덕션 Blob `backups/` 0개).
- 주의: Blob 플러그인이 `access:'public'`만 지원해 백업 URL은 익명으로 내려받아짐(보호는 랜덤 접미사뿐). 관리자 이메일·콘텐츠가 들어 있으므로 사찰 데이터가 쌓이면 이 방식이 충분한지 재검토할 것.
- 복구 재현은 안 함(로컬 임시 Postgres가 사라졌고 백업이 비어 있어 얻을 정보가 적음; 복구 도구는 10-02에 풍부한 데이터로 검증됨).

**권한 메모**: 자동 모드 분류기는 `vercel deploy --prod`, `vercel env pull`(Production 읽기), `.claude/settings.local.json` 자기 수정을 거부함. 사용자가 `.claude/settings.local.json`에 `Bash(vercel deploy --prod*)` allow 규칙을 직접 추가했고, 이후에도 한 번 거부돼 사용자가 명시적으로 다시 요청한 뒤 실행됨.

## 운영자 화면 다듬기 (2026-10-12, 커밋 `55a4c36`~`99e74d9`)

로컬 빈 DB + 개발 서버(3001)에서 첫 관리자 등록부터 브라우저로 따라가며 점검·수정(프로덕션 미반영).
- **첫 관리자 막다른 길 수정**: `/admin/create-first-user`의 역할 기본값이 editor라 그대로 만들면 사이트 설정 저장·관리자 추가가 모두 불가했음 → 관리자가 0명일 때 생성되는 계정은 항상 super-admin(`Admins.beforeChange`).
- **관리자 한국어화**: `payload.config.ts`에 `i18n: { supportedLanguages: { ko }, fallbackLanguage: 'ko' }`(+ `@payloadcms/translations` 직접 의존성), 컬렉션·글로벌 `labels`/`label`, 필드 라벨 약 50개, 개발자용 설명(`hooks/…`, `guide.md`, `allowSecret`) 정리, "봉림사 소식"·"예: 하논봉림사" 같은 관리자 문구 중립화. 배열/블록은 `labels.singular`를 줘야 "Row 추가" 같은 영어가 안 나옴.
- **설치 직후 공개 화면**: 로고가 없으면 사찰 이름을 글자로(`SiteLogo.siteName`), 정식 전환 전 빈 홈에 "홈페이지를 준비하고 있습니다", 값 없는 푸터 항목 숨김.
- **공개 화면 하드코딩 제거**: 사찰 소개·기도법회·찾아오는 길·슬라이더·`/temple-news` 문구를 중립/설정값으로. **기도·법회 섹션의 마스코트 이미지(`logo-mascot.png`)는 제거됨 — 하논봉림사 이전 시 유지 방법(HomePage 설정 항목화 등) 결정 필요.** 남은 것: `/stories/bonglimsa` 등 기존 주소(호환용 유지), 미사용 `components/boards-section.tsx`(봉림사 배너), `public/images/`의 하논봉림사 이미지 파일.
- **폼 정리(저장 구조 변경 없음, 마이그레이션 불필요)**: 페이지 주소(slug) 자동 제안(`page-xxxxxx`), 게시글 폼은 자주 쓰는 필드 위 + 접이식 3~4묶음, 사이트 설정은 5개 탭(기본 정보·디자인·지도·검색·메일·공개 설정). 사진 블록 필수 오류 안내 추가.
- **백업 암호화(B+C, `b380109`)**: AES-256-GCM(`lib/backup-crypto.ts`), 키는 `BACKUP_ENCRYPTION_KEY`(없으면 백업 실패), 응답·메일에는 URL 대신 경로만. **프로덕션 반영 전 키 생성·별도 보관·Vercel 등록 필요.**
- **못 본 것**: 모바일 폭(브라우저 창 크기 조절이 뷰포트에 반영되지 않음), 사진 업로드(공유 Blob 때문에 제외), 공지 올리기 전체 흐름, 메뉴·푸터·팝업 화면의 영어 잔재 전수 점검.

**Production 재배포 + 백업 암호화 실검증 (2026-10-12, `99e74d9`)**: 사용자가 `BACKUP_ENCRYPTION_KEY`를 생성해 별도 보관·Vercel Production 등록(키 교체는 하지 않기로 결정), 로컬 `.env.local`에는 같은 키를 추가함. 재배포 후 `/`·`/admin/login` 200(로그인 화면 제목 `로그인 | 관리자`로 한국어화 확인), 백업 라우트 200·응답에 URL 없음, Blob 파일은 AES-256-GCM 봉투(평문 흔적 없음)·로컬 키로 복호화 성공·틀린 키 거부 확인, 테스트 백업 삭제(`backups/` 0개).

## 도구 검증(이전 전 단계) — 편집자 권한·버전·회원·백업 복구·보안 (2026-10-12, 커밋 `1a07076`~`9b4c02c`)

로컬 빈 DB(+복구 대상용 두 번째 DB)에 API 시험 스크립트(node fetch, 한글 안전)와 브라우저 클릭을 섞어 점검. 시험 통과 수: 편집자 권한 17/17, 초안·게시·복원 44/44(+미리보기 7/7), 회원 흐름 45/45, 보안 38 중 37(나머지 1은 검색어가 화면에 되풀이 표시돼 걸린 오탐), 암호화 백업 복구 비교 전 항목 일치.

**찾아서 고친 문제**
- **초안 노출(보안)**: 홈페이지·메뉴·푸터 글로벌은 읽기를 모두에게 열어 두는데 Payload가 `?draft=true`를 막지 않아 익명이 게시 전 초안을 읽을 수 있었음 → `publicReadNoDraft`(관리자만 draft 요청 허용), 쓰지 않는 GraphQL 비활성(`graphQL.disable`). 화면 미리보기(서버 로컬 API)는 영향 없음 확인.
- **회원 권한 상승(보안)**: 회원이 REST로 직접 `pinned`·`viewCount`·사찰 소식 노출 등을 보내면 저장됐음 → 해당 필드에 `adminOnlyField`(필드 단위 쓰기 권한). 조회수·신고 수 갱신은 시스템이 `overrideAccess`로 하므로 영향 없음.
- **읽을 수 없는 글에 댓글**: 남의 비밀글, 숨김·보관·만료·승인 대기·반려 글에도 댓글이 달렸음 → `validateComment`에서 읽기 규칙과 같은 조건으로 거부.
- **백업 복구가 번호(id)를 보존하지 않음**: `payload.db.create`가 id를 무시해 번호에 빈틈이 있는 데이터(예: 글 1, 10~15)는 댓글→글 관계가 끊기거나 복구가 외래키 오류로 실패. 어제 검증은 번호가 1부터 빈틈없는 데이터라 가려져 있었음 → 삽입 직전 시퀀스를 원래 번호로 맞추고 불일치 시 중단. 수정 후 media·boards·pages·posts·comments·글로벌 5개가 원본과 필드 단위로 일치, 새 문서 번호도 충돌 없이 이어짐. 틀린 키·손상 파일은 복호화 단계에서 거부되고 DB에 아무것도 쓰지 않음.
- **편집자 화면 혼란**: 편집자에게 사이트 설정·메뉴·게시판·관리자 계정이 입력칸만 열린 채(저장 버튼 없음) 보이고 빠른 작업에 "게시판 만들기"가 있었음 → `admin.hidden`(`hiddenFromEditors`)로 숨기고 빠른 작업을 역할별로. 서버 권한(access)이 최종 방어선이며 편집자 17개 거부 항목 모두 확인.
- **용어/문구**: 버전 목록의 "발표/발행/미발행"을 "게시"로 통일, 복원 확인 문구 정리.

**확인된 안전 항목**(수정 불필요): 편집자는 페이지·홈·푸터·팝업·공지·업로드 가능, 사이트 설정·메뉴·게시판·관리자 계정·감사기록 불가, 권한 상승 불가 / 익명은 admins·audit-logs·security-events·reports·payload-* 접근 불가, 설치 후 first-register 불가, 크론 인증 / 가입 규칙(사칭·사찰 이름 닉네임, 10자 비밀번호, 약관, 중복 이메일), 이메일 인증 전 로그인 거부, 개인정보(이메일·실명) 목록·depth 조회 비노출, 비밀글·승인 대기·반려 글이 목록·상세·검색·depth 조회로 새지 않음, 1분 1글 속도 제한, 승인제(작성자 자가 승인 불가), 신고·정지·닉네임 30일 제한 / HTML·SVG·가짜 이미지 업로드 거부, 5회 실패 잠금(관리자·회원), HTML 이스케이프(XSS), 보안 헤더(X-Frame-Options·nosniff·CSP).
**참고(미조치)**: CSP에 `unsafe-inline`/`unsafe-eval` 허용(Next/Payload/카카오맵 때문), HSTS는 Vercel 도메인에서 제공되는지 배포 후 확인.

**아직 못 한 것**
- **회원 사진 첨부(글쓰기)**: 브라우저가 Vercel Blob에 직접 올리는 클라이언트 토큰 방식이라 로컬(토큰 없음)에서는 "Failed to retrieve the client token"으로 시험 불가 → 5번(실제 별도 자원 설치)에서 확인.
- **가입 안내 문구**: 메일 어댑터가 없으면 "인증 메일을 보냈습니다"라고 안내하지만 실제로는 보내지 않음. 메일 설정 전에는 `PUBLIC_REGISTRATION_ENABLED`를 켜지 말 것(기본 잠금).
- 이용약관·개인정보처리방침 문서를 보여주는 링크가 가입 화면에 없음(동의 체크박스만 있음) — 공개 전 확인 필요.
- **5번 신규 사찰 정식 설치**(별도 Supabase/Blob/Vercel)와 **6번 비개발자 사용성 시험**(사용자와 함께).

## 방향 정리 + 데모 사찰(청솔사) 시험 환경 (2026-10-12, 커밋 `e918380`)

**현재 목표(사용자 결정)**: 솔루션 완성도를 높이는 것. 배포·하논봉림사 이전은 마지막 단계이며 지금 다루지 않는다. 신규 사찰 정식 설치(별도 Supabase/Blob/Vercel)도 후순위. 지금은 더미 콘텐츠로 비개발자 사용성 시험(사용자와 함께)을 준비한다.

- **QA DB 비밀번호 사고**: Production 재배포가 `password authentication failed for user "postgres"`로 실패(기존 배포도 DB 경로 500). 사용자가 Supabase 비밀번호를 갱신해 Vercel Production·`.env.local`의 `DATABASE_URL`을 모두 고친 뒤 재배포로 복구(원인은 미확인 — Supabase 대시보드 Logs에서 변경 이력 확인 권장). 교훈: 배포 직후 DB 의존 경로(`/admin/login`, `/api/globals/...`)까지 스모크 확인할 것(홈 `/`은 캐시로 200일 수 있음).
- **데모 사찰 채우기**: `scripts/seed-demo-temple.ts`(`DEMO_SEED_CONFIRM=청솔사 NODE_ENV=production pnpm payload run scripts/seed-demo-temple.ts`). 설치 안 된 빈 DB에서만 실행(설치된 DB는 거부). 가상의 "청솔사": 사진 22장(sharp로 생성, media-public/Blob), 페이지 5(사찰 소개·주지 인사말·오시는 길·법회 안내·템플스테이), 게시판 5(`news`·`teaching`·`photos`·`free`·`story`, 기존 고정 키 `notices` 등은 예약 경로라 새 사찰은 `/boards/<키>` 사용), 게시물 21(공지 8·법문 3·갤러리 4·회원 글 6 중 승인 대기 2), 댓글 2·신고 1, 메뉴(4그룹)·바로가기·푸터·팝업·홈페이지·사이트 설정, 시험 계정 4(최고관리자·편집자·회원 2, 비밀번호는 루트의 `demo-accounts.local.txt`, git 제외). 로컬 빈 DB 리허설 후 QA(`claude-temple-platform.vercel.app`)에 적용, 공개 페이지 12곳 200·승인 대기 글 비노출·비밀글 마스킹·이미지 200 확인.
- **시험 계획**: `USABILITY_TEST_PLAN.md`(편집자 과업 10개·최고관리자 3개·방문자/회원 2개, 기록표). 시험 후 데이터를 되돌리는 초기화 스크립트는 아직 없음(QA DB를 비우고 다시 채우려면 별도 작업 필요).

## 사용성 시험 2번(개발자가 시험자 역할) 결과 (2026-10-12, 커밋 `0f5ab17`, QA 배포 `9d1a47b`)

로컬 빈 DB에 데모 사찰(청솔사)을 같은 시드로 채워 편집자 계정으로 `USABILITY_TEST_PLAN.md`의 과업을 브라우저로 수행(QA 사이트 로그인에는 비밀번호 입력 금지 규칙이 있어 로컬 사본에서 시험; 계정 파일은 `DEMO_ACCOUNTS_FILE`로 분리해 QA 계정 파일을 덮어쓰지 않음).

**결과**: 과업 1(첫 화면)·2(공지)·3(사진)·4(새 페이지)·6(메인 사진)·7(팝업)·8(되돌리기)·9(승인)·10(신고) 성공, **5(메뉴 연결)는 편집자에게 막다른 길**이었음. 최고관리자 메뉴 편집 화면도 확인.

**바로 고친 것(`0f5ab17`)**
- "공지 쓰기"가 게시판 미선택(`값 선택`)으로 열림 → 공지형 게시판을 기본 선택, `값 선택`→`선택하세요`, 게시 버튼 `변경 사항 게시`→`게시하기`.
- 승인 대기 회원 글이 "상태: 게시됨"이라고만 나오고 승인/반려가 접힌 "작성자·승인 정보"에 숨음 → 승인 상태·사유를 회원 글일 때만 본문 아래에 노출(설명 포함).
- 편집자가 "메뉴에 추가"를 누르면 작은 빨간 글씨만 나옴 → 편집자에게는 "최고관리자에게 /pages/<주소>를 메뉴에 넣어 달라고 요청" 안내로 대체.
- 블록 추가 화면 5개 블록이 똑같은 회색 그림 → 블록별 썸네일(`public/admin-blocks/*.svg`, `imageURL`).
- 홈페이지 구성에서 "섹션 순서"가 메인 슬라이드보다 위에 있음 → 맨 아래로.
- 날짜가 미국식(`10/11/2026`) → `yyyy-MM-dd`(팝업·게시 종료일), 대체 텍스트 설명 추가, 빈 "이전 주소 기록" 숨김, 메뉴 편집의 "화면 전용 선택지" 개발 용어 정리.
- 영어 라벨 `Reason`(신고)·이름·역할·상태·처리 종류·이전 주소·안내표 `Label` 한국어화. 게시글에 공개 화면 보기 링크(`admin.preview`), `lib/boardPaths.ts`로 게시판 경로 분리(순환 import 방지).

**남은 개선 후보(미조치)**
- 메뉴 편집 화면이 항목마다 한 화면씩 길어 전체 구조를 한눈에 보기 어려움(트리/표 형태 개선은 큰 작업). 편집자도 메뉴에 페이지를 넣을 수 있게 할지는 **권한 정책 결정 필요**.
- 버전 목록이 시각·번호·상태만 보여 "무엇이 바뀐 버전인지" 알기 어려움(비교 화면은 변경 항목이 잘 보임).
- 사진 라이브러리가 작은 썸네일의 표 형태(파일명 `demo-22.jpg`) → 격자 보기 선호 가능. 슬라이드 사진 교체는 글자 없는 연필/X 아이콘.
- 저장 성공 알림이 화면 오른쪽 아래에 잠깐만 나타나 긴 페이지에서 놓치기 쉬움.
- 새 페이지 주소가 `page-xxxxxx`로 자동 제안되나 의미 없는 이름. 첫 화면 대시보드는 좋음(승인 대기 카드·자주 하는 작업).
- 가입 화면에 약관 보기 링크 없음, 메일 미설정 시에도 "인증 메일을 보냈습니다" 안내(가입은 기본 잠금).

## 다음 세션 인계 (2026-10-12 마감 기준)

**현재 목표(사용자 결정)**: 솔루션 완성도. 배포·하논봉림사 이전은 **가장 마지막 단계**이며 지금 다루지 않는다(이전 안내를 먼저 꺼내지 말 것).

**git/배포**: 로컬 `main` = `origin/main`(`9d1a47b`), QA Production(`claude-temple-platform.vercel.app`)도 같은 커밋. 미추적 문서(`PLATFORM_PROGRESS_LOG.md`, `PLATFORM_REVIEW_2026-09-30.md`, `supabase/`)는 의도적으로 커밋 제외.

**QA 사이트 상태**: 데모 사찰(청솔사) 콘텐츠가 채워져 있음(`scripts/seed-demo-temple.ts`, 설치된 DB에는 거부). 시험 계정은 `demo-accounts.local.txt`(저장소 루트, git 제외)(git 제외). QA 사이트 로그인 화면에는 제가 비밀번호를 입력할 수 없으므로(규칙) 시험은 로컬 사본(같은 시드 + `DEMO_ACCOUNTS_FILE`)에서 하고, 사용자가 직접 QA에서 시험.

**다음에 할 일**
1. **사용성 시험 1번**: 사용자가 QA에서 편집자 계정으로 `USABILITY_TEST_PLAN.md` 과업 1~10 수행, 막힌 곳 함께 기록 → 개선 목록 → 수정.
2. **정책 결정 대기**: 편집자가 메뉴에 "항목 추가"만 할 수 있게 할지(현재 최고관리자 전용, 편집자에게는 요청 안내 표시).
3. 남은 개선 후보(위 "사용성 시험 2번 결과" 섹션): 메뉴 편집 화면 길이, 버전 목록 변경 요약, 사진 라이브러리 격자 보기, 저장 알림 위치, 새 페이지 주소 의미, 가입 약관 링크·메일 미설정 시 안내.
4. 메일 알림 실검증(RESEND 키)은 사용자가 당분간 건너뛰기로 함. 신규 사찰 정식 설치(5번)도 후순위.
5. Supabase 무료 플랜 유지: 자동 중지 여부는 한 주 지켜볼 것(Vercel Cron Jobs 로그에서 `run-jobs` 200 확인). 2026-10-12 QA DB 비밀번호가 바뀌어 장애가 있었음(사용자가 갱신, 원인 미확인).
6. 하논봉림사 이전 때(맨 마지막): 시드 스크립트 2개(`seed-hanonbonglimsa-utility-links.ts`, `seed-hanonbonglimsa-home-mascot.ts`) 각 1회.

**사용자 결정 이력**: MainMenu/FooterSettings 초안 기능 먼저 → 신규 사찰 설치 QA는 로컬 빈 DB부터 → 하드코딩 2건은 "관리자 설정으로 데이터화" → 배포는 기존 Vercel 프로젝트 + QA 프로젝트 값 + Production 방식, 메일 발송 건너뛰기, 복구 범위는 Versions 복원·백업 JSON 복구·마이그레이션 데이터 보존 전부.

**작업 환경 주의점(시행착오로 확인됨)**
- `.env.local` = QA Supabase 프로젝트(`hmtygapbxznjppmgowmo`), 원래 dev DB는 `.env.hanon-backup.local`. 어느 DB에 쓰는지 항상 먼저 확인할 것.
- 로컬 `payload migrate`: `payload run` 등으로 dev 마커가 재생성돼 프롬프트에서 멈춤 → `.env.local` 로드 후 `node scripts/clear-dev-migration-marker.mjs` 먼저. 이전 스키마 재현 시엔 `NODE_ENV=production`(스키마 자동 push 방지) + `migrations/` 파일을 직접 빼야 함(`index.ts`가 아님).
- `payload run`은 동기 구간이 끝나면 바로 종료 → 스크립트는 top-level `await` 사용. tsc는 오래된 증분 캐시로 가짜 실패가 날 수 있어 `--incremental false`로 확인.
- 같은 디렉터리에서 `next dev`는 하나만 가능, `TaskStop`이 자식 node를 못 죽일 수 있어 `netstat`+`taskkill`로 포트(3001 등)를 직접 정리.
- curl로 관리자 API를 호출할 땐 쿠키 대신 `Authorization: JWT <token>`(CSRF Origin 검사). Git Bash로 한글 JSON을 보내면 인코딩이 깨지니 파일/스크립트로 처리.
- 로컬 일회용 Postgres: 스크래치 디렉터리 `scratchpad/pg`의 `embedded-postgres`(포트 54329, `node start.mjs`) — 세션이 끝나면 사라질 수 있음. Docker/psql은 이 PC에 없음.
- 브라우저 자동화: 미리보기 탭을 열어 두면 다른 탭이 `visibilityState:hidden`이 돼 스크린샷이 타임아웃 → 미리보기 탭을 닫을 것.

## 참고

- 모든 스키마 마이그레이션은 이 저장소 자체의 Supabase dev DB(hanonbonglimsa 운영 DB 아님)에 직접 적용 — 백필 없이 DB 기본값만으로 기존 데이터 보존.
- 매 커밋마다 `pnpm exec tsc --noEmit` + `pnpm dev` 실제 라우트 방문 + (필요시) 임시 super-admin/member 계정으로 API 레벨 시나리오 실행 후 계정·테스트 데이터 삭제하는 방식으로 검증.
- GitHub push는 매 커밋 직후 사용자 확인을 받고 진행(`origin/main`이 거의 항상 로컬과 동기화돼 있음).
