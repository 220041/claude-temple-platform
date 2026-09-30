# 작업 히스토리 및 이어하기 안내

이 문서는 `guide.md` 기반 Payload CMS 백엔드 구축 작업의 진행 상황을 기록한다.
작업은 `feat/payload-foundation` 브랜치에서 진행 중이며, 각 단계는 별도 커밋으로 나뉘어 있다.
문제/이슈는 `guide.md` 맨 아래 "27. 진행 중 발견된 이슈 및 위험" 섹션에 단계별로 기록되어 있으니
다음 작업자는 그 섹션을 먼저 읽을 것.

## 완료된 단계 (0~8단계 — 전부 커밋·push 완료, 테스트 검증됨)

- **0단계**: 저장소 `220041/hanonbonglimsa`(Private) 생성, `feat/payload-foundation` 브랜치, 빌드 확인
- **1단계**: Payload 기초 — Admins 컬렉션, `/admin`, 최초 관리자 부트스트랩
- **2단계**: MediaPublic/MediaPrivate, Vercel Blob 분리, EXIF 제거·시그니처 검증
- **3단계**: HomePage/FooterSettings/PopupSettings/SiteSettings Global, 홈페이지 CMS 연동, 팝업
- **4단계**: Pages 컬렉션(제한 블록 에디터), 정적 페이지 4개(역사/오시는길/기도법회/행장), 미리보기
- **5단계**: Boards/Posts 공통 구조, 관리자 전용 게시판 4개(공지/법문/언론/스님갤러리)
- **6단계**: Members 컬렉션, 이메일 인증/재발송, 로그인 잠금, 비밀번호 재설정, 닉네임 정책
- **7단계**: 회원 게시판 4개(자유게시판/풍경갤러리/이야기/감로당), 본인 수정·삭제, 비밀글, Private Blob 접근제어
- **8단계**: 댓글(1단계 답글), 신고, AuditLogs(감사기록), 속도 제한, 정지 회원 차단
  - **중요 발견**: 훅에서 다른 컬렉션을 조작할 때 `req`를 넘기지 않으면 트랜잭션 데드락 발생 가능 — 전부 수정함. 새 훅 작성 시 반드시 `req` 전달할 것 (guide.md 8단계 이슈 참고).

## 9단계 진행 중 (마이페이지·검색·SEO) — 여기서부터 이어서 작업

### 최신 세션에서 완료한 것 (커밋 `a32ddae`, push 완료 — 브라우저 실사용 테스트 및 버그 수정)

1. **브라우저 실사용 테스트 대부분 완료**: 로그인(커스텀 쿠키/JWT), 글쓰기, 조회(조회수 증가 포함), 수정, 댓글+답글(1단계 제한 확인), 신고, 게시물/댓글 삭제, 비밀글(작성자만 목록에 마스킹 표시 "🔒 비밀글입니다", 로그아웃 시 목록에서 완전히 사라짐, 직접 URL 접근 시 404), 로그아웃(헤더 상태 복귀) — 전부 브라우저에서 직접 눌러보고 확인함.
   - **아직 미테스트**: 이미지 첨부 업로드 흐름(파일 입력은 확인했지만 실제 업로드는 안 해봄), `/register` 공개 가입 폼(`PUBLIC_REGISTRATION_ENABLED=true`로 바꿔서 테스트 필요, 현재 `false`로 되돌려진 상태).
2. **버그 발견 및 수정 2건** (guide.md "9단계 관련" 섹션에 상세 기록):
   - **소프트 삭제 실패**: `Posts`/`Comments`의 `access.delete`가 무조건 `superAdminOnly`였는데, Payload는 `trash:true` 컬렉션에서 `deletedAt`을 채우는 update(=소프트삭제 진입)도 `access.delete`로 추가 검사한다는 걸 몰라서 회원 본인 삭제가 전부 막혀 있었음. `access.delete`를 `data.deletedAt` 유무로 분기해 본인 소프트삭제는 허용하고 진짜 영구삭제만 최고관리자로 제한하도록 수정(`collections/Posts.ts`, `collections/Comments.ts`). 함께 `deletePostAction`/`deleteCommentAction`에서 잘못 붙어 있던 `trash: true` 옵션도 제거함(최초 삭제 시엔 붙이면 안 됨 — "이미 trash인 문서 대상"이라는 뜻이라 대상이 안 잡힘).
   - **NEXT_REDIRECT 텍스트 노출**: `createPostAction`의 `redirect()`가 `try/catch` 안에 있어서 우리 `catch`가 Next.js의 리다이렉트 신호를 가로채 화면에 "NEXT_REDIRECT" 문자열이 그대로 떴음. `redirect()`를 `try/catch` 밖으로 옮겨 수정(성공 시 필요한 id만 `try` 안에서 받아옴).
3. `pnpm build` 정상 완료 확인, 테스트 데이터/임시 디버그 스크립트 전부 정리 완료.
4. **마이페이지 구현 완료** (커밋 `19fe731`, push 완료, guide.md 14절):
   - `app/(frontend)/mypage/page.tsx`(개요), `/profile`(닉네임·이메일 변경), `/password`(비밀번호 변경), `/posts`·`/comments`(내 글·내 댓글 목록, 페이지네이션 포함), `/withdraw`(탈퇴, 사전 안내문 포함).
   - `app/(frontend)/actions/mypage.ts`: `updateNicknameAction`, `updateEmailAction`(재인증은 기존 `handleEmailChange` 훅이 자동 처리), `changePasswordAction`, `withdrawAction`. 이메일 변경/비밀번호 변경/탈퇴는 모두 실행 전에 `payload.login()`으로 현재 비밀번호를 재확인한다.
   - **탈퇴 처리**: `Members.status`가 관리자 전용 필드라 회원 본인 탈퇴는 `memberAuthEndpoints.ts`와 동일하게 `overrideAccess: true`로 우회해서 `status: 'withdrawn'`으로 바꾼다. 실명/이메일 익명화는 `validateMember` 훅이 이미 자동 처리(게시물/댓글은 남기고 작성자 표시만 "탈퇴한 회원"으로 바뀜).
   - `lib/boards.ts`에 `pathForBoardKey`(boardKey→URL 공용 매핑, 기존 `posts.ts` 안에 중복돼 있던 매핑을 통합), `getMyPosts`, `getMyComments` 추가.
   - 브라우저 검증: 로그인→마이페이지 개요 표시, 닉네임 변경 성공, 비밀번호 변경 성공(오답 비밀번호 거부도 확인), 테스트 글 작성 후 "내가 쓴 글" 목록에 정상 노출+링크 정상, 그 글에 댓글 작성 후 "내가 쓴 댓글" 목록에 게시판명과 함께 정상 노출, 탈퇴 페이지에서 오답 비밀번호 거부 확인, 로그아웃 후 `/mypage` 접근 시 `/login`으로 리다이렉트 확인. **탈퇴 성공 경로(실제 status=withdrawn 전환)는 재사용 테스트 계정(`stage9-test@example.com`) 보존을 위해 실행하지 않음** — 별도 1회용 테스트 계정으로 검증 필요.
5. **통합검색 구현 완료** (커밋 `b40fd50`, push 완료, guide.md 13.4절):
   - `lib/search.ts`의 `searchPosts()`: 제목/본문/`memberAuthor.nickname` 대상 `like` 검색 + 게시판·작성기간 필터. `Posts.access.read`가 이미 비밀글/초안/보관/숨김/삭제/만료를 걸러주므로 그 위에 검색 조건만 AND로 얹는다. 별도 검색엔진 없이 PostgreSQL만 사용(guide 명시).
   - `app/(frontend)/search/page.tsx`: GET 방식 폼(자바스크립트 없이 쿼리스트링으로 검색 상태 유지), 게시판 필터 셀렉트, 기간 필터, 페이지네이션.
   - 헤더 상단 유틸리티 바에 "통합검색" 링크 추가.
   - 브라우저 검증: 테스트 게시물로 본문 검색·닉네임 검색 둘 다 정확히 매칭 확인, 다른 게시판으로 필터링 시 결과에서 제외되는 것 확인.
6. **SEO 기초 구현 완료** (커밋 `99a62cc`, push 완료, guide.md 15절):
   - `app/(frontend)/sitemap.ts`: 정적 경로 + Pages + 공개 게시물(비밀글/초안/숨김/삭제/만료는 `Posts.access.read`가 자동 제외) 전부 포함.
   - `app/robots.ts`: `/admin`, `/api`, `/login`, `/register`, `/mypage` 크롤링 차단. **중요 발견**: Next.js는 `robots.txt`/`manifest.json`/`favicon.ico` 파일 경로 매칭 정규식이 앱 디렉터리 루트에 앵커링돼 있어서, route group(`(frontend)` 등) 안에 두면 조용히(에러 없이 404만) 라우트로 등록되지 않는다. `sitemap.ts`는 앵커 없는 정규식이라 route group 안에서도 동작해서 이 차이를 늦게 발견했다 — `robots.ts`는 반드시 실제 `app/robots.ts`(route group 밖)에 둬야 한다(guide.md 9단계 관련 기록).
   - `lib/seo.ts`: 게시판 목록/게시물 상세 공용 `generateMetadata` 헬퍼. 비밀글은 제목·내용 노출 없이 `noindex`.
   - 8개 게시판의 목록(8)+상세(8) 페이지 전부와 `/pages/[slug]`에 `generateMetadata` 적용, 로그인/마이페이지에 `noindex` 메타, 루트 레이아웃에 `metadataBase` 추가.
   - 브라우저에서 `/robots.txt`, `/sitemap.xml` 실제 렌더링 확인, 게시판 목록 페이지 타이틀(`공지사항 | 한라산 봉림사`) 확인, 로그인 페이지 `noindex` 메타 태그 확인.
   - **부수 발견**: `next dev`가 켜진 채로 `pnpm build`(특히 `rm -rf .next` 병행)를 돌리면 Turbopack dev 캐시가 깨져 이후 모든 요청이 500 에러를 낸다. 빌드 전엔 항상 dev 서버를 먼저 내릴 것(`taskkill //F //IM node.exe`) — guide.md에 기록.
7. **홈페이지 "봉림사 소식" 실데이터 연동 완료** (커밋 `5947cdd`, push 완료, guide.md 8/15절):
   - `lib/boards.ts`의 `getTempleNewsPosts()`: `showInTempleNews`로 선정된 게시물만 모으고, 뷰어가 작성자 본인이어도 비밀글은 항상 제외(guide 명시 사항 — 접근 제어와 별개로 이 목록 전용 규칙).
   - `components/boards-section.tsx`가 하드코딩 더미 배열 대신 `newsItems` prop을 받도록 변경, 클릭 시 원본 게시물(사본 아님)로 이동. 우측 배너 2개도 실제 게시판(`/stories/bonglimsa`, `/stories/gamrodang`) URL로 연결.
   - `app/(frontend)/temple-news/page.tsx` 신규 추가(전체보기 페이지, guide.md 15절 URL 목록).
   - `pnpm payload run <script>.ts`(self-executing 스크립트, `getPayload({config})` 직접 호출 — `payload run`은 `export function script`가 아니라 파일을 그냥 `import()`만 하므로 최상위 코드로 작성해야 함, guide.md에 기록할 만한 팁)로 임시 게시물을 만들어 홈페이지·`/temple-news` 양쪽에서 원본 링크가 정확한지(`/notices/38`) 확인 후 정리.

### 이전 세션에서 완료한 것 (커밋 `9909dfa`, push 완료)

1. **회원 인증 아키텍처 결정 (중요)**
   - Payload가 Admins/Members 두 auth 컬렉션에 기본적으로 같은 쿠키 이름(`payload-token`)을 쓰는 문제를 발견했다.
   - 해결: Members는 Payload 기본 쿠키를 쓰지 않고, 로그인 성공 시 받은 JWT를 우리가 직접 별도 쿠키(`member-token`)에 저장 → 이후 요청에서 `Authorization: JWT <token>` 헤더로 변환해 `payload.auth()` 호출.
   - 관련 파일: `lib/memberAuth.ts` (`getCurrentMember`, `MEMBER_TOKEN_COOKIE`), `app/(frontend)/actions/memberAuth.ts` (`loginAction`, `logoutAction`, `registerAction`)
   - **중요 버그 방지**: Payload 로컬 API는 `overrideAccess` 기본값이 `true`(접근 제어 건너뜀)다. 프런트엔드에서 만드는 모든 서버 액션은 반드시 `overrideAccess: false` + 올바른 `user`를 명시해야 5~8단계에서 만든 권한 제어가 실제로 적용된다. 지금까지 작성한 액션들은 전부 이렇게 했지만, **앞으로 새 액션을 추가할 때 절대 빠뜨리지 말 것.**

2. **게시판 목록/상세/글쓰기 화면 8개 전부 생성** (guide.md 13절 URL 규격 그대로 사용)
   - `/notices`, `/dharma`, `/gallery/monks`, `/gallery/scenery`, `/community`, `/stories/bonglimsa`, `/stories/gamrodang`, `/press` — 각각 목록 + `[id]` 상세
   - 회원 게시판 4개(`community`, `gallery/scenery`, `stories/bonglimsa`, `stories/gamrodang`)는 `/write`, `/[id]/edit` 페이지도 있음
   - 공용 컴포넌트: `components/board/board-list-page.tsx`, `board-detail-page.tsx`, `board-write-page.tsx`, `board-list-table.tsx`(일반형), `board-gallery-grid.tsx`(갤러리형), `post-detail.tsx`, `post-form.tsx`, `comment-section.tsx`, `report-button.tsx`, `view-counter.tsx`
   - 데이터 조회: `lib/boards.ts` (`getBoardByKey`, `getPostsForBoard`, `getPostDetail`, `getCommentsForPost`, `isNew`, `resolveAuthorName`)
   - 서버 액션: `app/(frontend)/actions/posts.ts`(작성/수정/삭제, 회원 이미지는 media-private에 업로드), `actions/comments.ts`, `actions/reports.ts`

3. **댓글 허용 여부 UI 반영**: 게시판이 댓글을 막아둔 경우(`defaultAllowComments: false`, 예: 공지사항) 댓글 폼 자체를 숨기도록 수정함(`board-detail-page.tsx`에서 `commentsAllowed` 계산 → `PostDetail`에 전달).

4. **조회수**: `Posts.viewCount` 필드 추가, `app/(payload)/api/posts/[id]/view/route.ts`(POST)로 증가, 쿠키(`viewed-posts`, 24시간)로 중복 방지. `components/board/view-counter.tsx`가 상세 페이지 마운트 시 호출.

5. **로그인/가입 화면**: `/login`, `/register`(+`/register/done`), `/verify-result`(이메일 인증 완료/실패 리다이렉트 페이지). `PUBLIC_REGISTRATION_ENABLED=false`일 때 가입 폼 대신 안내 문구 표시.
   - `collections/hooks/memberAuthEndpoints.ts`의 `verify-and-activate` 엔드포인트가 JSON 응답 대신 `/verify-result?status=...`로 리다이렉트하도록 수정함.

6. **공용 레이아웃**: `components/site-shell.tsx` — Header/Footer + 현재 회원 세션 + FooterSettings 조회를 한 곳에 모음. 새 페이지 만들 때 이걸로 감싸면 됨.

7. **헤더/푸터 메뉴 링크**를 실제 게시판 URL로 연결 완료(guide.md 1.2/5.1절: 메뉴는 코드 관리이므로 CMS 대상 아님).

8. **동작 확인한 것**: `/notices` 목록에 실제 게시물 표시, 상세 페이지에서 제목/작성자/날짜/조회수/본문 정상 렌더링, 댓글 폼(로그인 필요 안내) 정상 표시 — 로컬 API로 시드한 테스트 데이터로 확인. **회원 로그인/가입/글쓰기/댓글 작성/신고/조회수 증가는 아직 브라우저로 직접 테스트하지 않았다.**

### 다음 작업자가 이어서 할 일 (우선순위 순)

1. **브라우저 테스트 잔여 항목** (대부분 완료됨, 아래 두 가지만 남음)
   - 이미지 첨부 업로드 흐름 실제로 파일 올려서 확인(`/community/write` 등에서 사진 첨부 후 상세 페이지에 정상 표시되는지, media-private 접근 제어까지).
   - `/register`를 `PUBLIC_REGISTRATION_ENABLED=true`로 잠깐 바꿔서 실제 가입 폼 테스트 후 다시 `false`로 되돌릴 것.
   - 테스트용 인증된 회원 계정: `stage9-test@example.com` / `testpassword123` (닉네임 `stage9tester`, status=active, verified) — 계속 재사용 가능.

2. ~~마이페이지~~ → 완료(위 "최신 세션에서 완료한 것" 4번 참고). **탈퇴 성공 경로만 실제 계정으로 아직 미검증** — 1회용 테스트 계정으로 `/mypage/withdraw`에서 정상 비밀번호 입력 후 status가 `withdrawn`으로 바뀌고 로그아웃/로그인 차단되는지, 게시물 작성자 표시가 "탈퇴한 회원"으로 바뀌는지 확인할 것.

3. ~~통합검색~~ → 완료(위 "최신 세션에서 완료한 것" 5번 참고).

4. ~~SEO~~ → 기초 구현 완료(위 "최신 세션에서 완료한 것" 6번 참고). **남은 것**: OG 이미지(현재 게시물 대표이미지를 OG 이미지로 안 걸어둠), `/mypage` 하위 페이지들(`/profile`, `/posts` 등) 개별 noindex는 아직 없음(robots.txt의 `/mypage` disallow로 prefix는 막혀 있지만 페이지별 meta robots는 개요 페이지에만 있음), 실제 프로덕션 도메인 확정 후 `NEXT_PUBLIC_SERVER_URL` 값 재확인 필요(현재 로컬 개발 환경 기준으로만 테스트).

5. ~~홈페이지 "봉림사 소식" 실데이터 연동~~ → 완료(위 "최신 세션에서 완료한 것" 7번 참고). **남은 것**: `templeNewsFeatured`(대표 소식) 필드는 아직 UI에서 특별 취급 안 함 — 지금은 `templeNewsPinned`만 정렬에 반영. 필요하면 대표 소식을 다른 스타일로 강조하는 디자인 작업 추가 검토.

6. **비밀글 목록 마스킹 관련 스코프 결정 사항**
   - guide.md 9.3절은 "목록에는 비밀글입니다로 표시"(=다른 사람에게도 목록엔 뜨되 제목만 가림)를 요구하지만, 이번 구현은 접근 제어 단계에서 비밀글을 아예 결과에서 제외하는 방식(작성자 본인만 자기 비밀글을 목록에서 봄)으로 더 단순하게 처리했다. 안전성은 더 높지만 guide 문구와 100% 일치하지는 않는다 — 필요하면 재검토.

7. ~~회원 삭제(soft-delete) 관련 재확인 필요~~ → 완료. 최신 세션에서 버그 발견·수정·브라우저 검증까지 끝남(위 "최신 세션에서 완료한 것" 참고). trash 컬렉션에서 `access.delete`와 `data.deletedAt`의 상호작용을 새로 트래시 처리하는 컬렉션마다 반드시 재확인할 것(guide.md 9단계 관련 섹션).

## 다음 작업 체크리스트 (2026-08-07 정리, 순서대로 진행)

### A. 브라우저 검증만 하면 되는 것 — 전부 완료 (2026-08-07)
- [x] 이미지 첨부 업로드 실제 파일 올려서 확인 → **진짜 버그 발견 및 수정**(커밋 `ab56fea`): `post-detail.tsx`/`board-gallery-grid.tsx`의 `resolveImageUrl()`이 `featuredImage`/`images`의 `{ relationTo, value }` 폴리모픽 wrapper에서 바로 `url`을 찾아 항상 빈 문자열을 반환 → 이미지가 에러 없이 조용히 안 보이던 문제. `value` 안쪽까지 들어가도록 수정 후 자유게시판 상세(featuredImage)·포토갤러리 썸네일 양쪽에서 실제 업로드 이미지로 렌더링 확인. `payload run` 스크립트로 media-private 업로드→post 연결까지 재현.
- [x] `/register` 공개 가입 폼 실제 테스트 → 정상 동작 확인. `PUBLIC_REGISTRATION_ENABLED=true`로 전환 후 실제 가입 제출 → `/register/done` 안내 페이지로 이동, 회원 레코드가 `status: pending, _verified: false`로 생성됨, 인증 메일 발송 로그(`Verify your email`, 이메일 어댑터 미설정으로 콘솔 출력) 확인. 테스트 후 `.env.local`을 다시 `false`로 되돌리고 테스트 계정 삭제 완료.
- [x] 마이페이지 탈퇴 성공 경로 검증 → 1회용 테스트 계정(`withdraw-test@example.com`)으로 `/mypage/withdraw` 실행: 비밀번호 확인 통과 → `status: withdrawn`, `email`이 `withdrawn-22@deleted.local`로, `realName`이 "탈퇴한 회원"으로 익명화됨(`validateMember` 훅) 확인. 탈퇴 직후 헤더가 로그아웃 상태로 자동 전환되고, 이후 원래 이메일/비밀번호로 재로그인 시도 시 거부됨을 확인. 테스트 계정은 완전 삭제로 정리.

### B. SEO 남은 부분 (커밋 `9b59356`, push 완료)
- [x] OG 이미지: `lib/seo.ts`의 `generatePostMetadata`가 `featuredImage`(폴리모픽 업로드 필드, `.value.url`까지 들어가야 함)를 `og:image`로 노출하도록 추가. media-private 이미지는 게시물 공개 상태와 동기화된 접근 제어(`syncPostImageVisibility`)를 그대로 타므로 공개 게시물의 이미지만 실제로 열람 가능 — 비밀글은 애초에 OG 자체를 생성하지 않음. `payload run`으로 실제 이미지 첨부 게시물을 만들어 `og:image` 메타 태그 값을 브라우저에서 직접 확인.
- [x] `/mypage` 하위 페이지(`/profile`, `/password`, `/posts`, `/comments`, `/withdraw`) 5곳에 개별 `noindex` 메타 추가 완료. 로그인 상태로 각 페이지 title과 `<meta name="robots">` 값 확인.
- [ ] 실제 프로덕션 도메인 확정 후 `NEXT_PUBLIC_SERVER_URL` 값 재확인 — **아직 미해결**. 실제 배포 도메인이 정해지지 않아 이번 세션에서 처리 불가능한 항목. 도메인 확정되면 `.env`(prod)에서 이 값만 갱신하면 됨(코드 변경 불필요, `sitemap.ts`/`robots.ts`/`layout.tsx`의 `metadataBase`가 전부 이 환경변수를 참조하도록 이미 만들어져 있음).

### C. guide.md 10단계(프로덕션 준비) — 계획만 작성, 실행은 다음 세션
- [x] 실행 계획을 guide.md 22절 "10단계: 운영 준비" 바로 아래 "10단계 상세 실행 계획" 서브섹션으로 작성해 둠(10.0 사전 확인 → 10.1 환경변수 → 10.2 샘플데이터 제거 → 10.3 migration 전환(rename 시나리오 재검증 포함) → 10.4 예약발행 cron 연결 → 10.5 백업·복구 문서화 → 10.6 고아파일/30일 정리 배치 → 10.7 Vercel Preview 검증(10MB 업로드 제한 재검증 포함) → 10.8 최종 회귀시험 → 10.9 도메인 확정·실배포). 각 하위 단계는 guide.md 22절 원칙대로 하나씩 보고하며 진행하고, 되돌리기 어려운 조작(운영 DB/실배포/도메인 연결)은 사용자 확인 후 진행.
- [ ] **다음 세션 시작 시 10.0(사전 준비)부터 실행** — 시작 전에 반드시 사용자에게 확인: 실제 배포 도메인 확정 여부, Vercel 프로젝트/운영 Supabase 존재 여부, `PUBLIC_REGISTRATION_ENABLED` 운영 전환 시점, Resend 발신 도메인 인증 상태(이메일 실발송은 이번 세션까지 한 번도 검증 안 함, 계속 콘솔 출력으로만 확인).

### D. 스코프 결정/재검토 사항 (2026-08-07 운영자 확인 완료)
- [x] 비밀글 목록 마스킹 방식 → **운영자 결정: guide.md 9.3절 명시대로 변경**(커밋 `cf19ef9`). `Posts.access.read`를 완화해 비밀글도 목록엔 마스킹 표시("🔒 비밀글입니다")로 노출하되, `title`/`content`/`featuredImage`/`images` 필드 자체는 작성자·관리자만 실제 값을 읽을 수 있도록 필드별 access로 제한. 상세 페이지는 비소유자에게 "작성자와 관리자만 열람할 수 있습니다" 안내로 대체. 부수적으로 검색(`lib/search.ts`)과 sitemap(`app/(frontend)/sitemap.ts`)에서 비밀글을 명시적으로 다시 제외하도록 수정(전엔 Posts.access.read가 자동으로 걸러줬는데 이제 그렇지 않으므로). 브라우저로 작성자/비회원 양쪽 시나리오 + 검색/sitemap 제외까지 전부 확인.
- [x] `templeNewsFeatured`(대표 소식) UI 구분 → **운영자 결정: 지금은 보류**(정렬에만 `templeNewsPinned` 반영하는 현재 상태 유지). 디자인 작업 필요 시 별도 세션에서.

### E. 재확인 필요 (예전부터 미확인 상태) — 로컬 검증 완료, guide.md에 상세 기록
- [x] 예약 게시(스케줄 발행) 재검증 → **핵심 로직은 정상**(수동으로 `payload.jobs.queue()` + `payload.jobs.run()` 실행 시 draft→published 정확히 전환 확인). **하지만 운영에는 아직 못 씀**: `payload.config.ts`에 jobs 자동 실행(cron) 설정이 전혀 없어서, 배포해도 예약 시각이 지나도 아무도 큐를 실행하지 않아 영원히 draft로 남는다. 10단계에서 Vercel Cron 등으로 jobs 실행 트리거를 반드시 붙여야 함(guide.md 9단계 관련 기록).
- [x] drizzle-kit 대화형 프롬프트 문제 1차 재검증 → `payload migrate:create`로 최초 베이스라인 마이그레이션(스키마 전체 생성)을 만들어봤는데 프롬프트 없이 즉시 완료됨. 다만 이건 "무에서 전체 생성"이라 애초에 모호함이 생길 수 없는 케이스라, 원래 문제였던 "필드 rename처럼 애매한 변경" 시나리오는 재현하지 못했다 — **진짜 검증은 10단계에서 실제 스키마 변경과 함께 해야 함**(테스트 파일은 확인 후 즉시 삭제해 리포에 남기지 않음).

## 2026-08-07 세션 종료 시점 요약 (1차)

오늘 세션(이전 히스토리 이어받아 진행)에서 A~E 체크리스트를 전부 처리하고 C(10단계)는 계획만 작성했다.
브랜치는 `feat/payload-foundation`, 모든 변경은 커밋·push 완료, 작업 트리는 깨끗한 상태다.

**다음 세션 시작 방법**: 이 문서 맨 위 "다음 작업 체크리스트" C 항목과 guide.md 22절의
"10단계 상세 실행 계획"을 먼저 읽고, 10.0(사전 준비) 확인 질문부터 사용자에게 물어보고 시작할 것.

## 2026-08-07 세션 계속 — 10단계(운영 준비) 착수

사용자가 "이어서 해주세요"로 계속 요청해서 같은 날 10단계에 착수했다. 10.0 사전 확인
질문(도메인/인프라/공개가입 전환/Resend 상태)을 먼저 묻고 답변을 받은 뒤 진행:
- 도메인: 아직 미확정, Vercel 기본 도메인으로 진행
- Vercel/Supabase: 이미 존재(운영 DB는 개발용과 당분간 공유)
- PUBLIC_REGISTRATION_ENABLED: 도메인/이메일 검증 완료 후 true 전환
- Resend: 아직 미설정

### 완료한 것 (전부 커밋·push 완료)

1. **Vercel 프로젝트 정리** — 기존 `hanonbonglimsa_v3`(환경변수 미등록, Payload 이전 구버전 배포)는 이번 작업과 무관해 그대로 방치. v0.dev로 만들어진 `bongrimsa`(원본 정적 프로젝트)는 운영자 확인 후 삭제. 신규 `hanonbonglimsa` 프로젝트 생성, 로컬 저장소 연결(`vercel link`), GitHub 저장소와 Git 연동 설정(현재 Production Branch는 기본값 `main`이라 `feat/payload-foundation`에 push해도 Preview로만 배포됨). `vercel.json`에 `framework: nextjs` 명시(자동감지 실패 수정).
2. **환경변수 체크리스트 문서화** — `docs/operations/env-vars.md`. 실제 비밀값은 운영자가 Vercel 대시보드에서 직접 등록하기로 함(민감정보라 채팅으로 주고받지 않기로 결정). **아직 등록 여부 미확인 — 다음 세션에서 먼저 확인할 것.**
3. **샘플 데이터 정리** — DB 전수조사 결과 대부분 이미 깨끗했음(재사용 테스트 회원 1명, 관리자 1명(role=editor, super-admin 없음 — 운영자에게 알리기만 하고 변경은 안 함), 실제 콘텐츠 페이지 7개만 존재). 이전 세션에 남아있던 트래시 상태 테스트 게시물 3건을 영구삭제하려다 **실제 버그 발견**: `cascadeDeletePostRelations`가 이미 trash인 댓글을 지울 때 `trash:true`를 빼먹어서 댓글이 달린 게시물의 영구삭제가 항상 실패하고 있었음 — 수정 완료(커밋 `90f20e7`).
4. **Migration 전환** — `Posts.pinned`를 임시로 `isPinned`로 rename하고 `migrate:create`를 돌려서 **원래 우려했던 drizzle-kit 대화형 프롬프트(rename vs create column)를 실제로 재현·확정**함(9단계에서는 베이스라인만 테스트해서 못 잡았던 부분). 테스트 후 필드/타입 원복. **운영 방침 확정**: `migrate:create`는 항상 로컬에서만 실행, Vercel 배포 파이프라인에서는 비대화형인 `payload migrate`만 실행(`docs/operations/migrations.md`). 베이스라인 마이그레이션 생성·커밋 완료(커밋 `04c5b13`) — **단, 이 DB는 지금까지 push 모드로 테이블이 이미 있어서 베이스라인을 실제로 `payload migrate`로 적용하려면 "이미 적용됨" 표시 절차가 별도 필요함(운영 DB에 대한 되돌리기 어려운 조작이라 사용자 확인 후 진행 — 아직 안 함).**
5. **예약발행 cron + 고아파일/30일 정리** — `app/(payload)/api/cron/run-jobs/route.ts` 신규(CRON_SECRET 인증, jobs.run() + 30일 지난 trash 영구정리 + 고아 미디어 정리를 한 번에 처리). `lib/cleanup.ts`에 `purgeExpiredTrash()`/`purgeOrphanMedia()` 작성 후 4가지 시나리오(사용중 이미지 보존/고아 이미지 삭제/31일 지난 trash 삭제/최근 trash 보존)로 로컬 검증 완료. `vercel.json`에 `crons` 설정 — **중요**: Vercel 계정이 Hobby 플랜이라 cron은 하루 1회만 가능(더 잦은 설정은 배포 자체가 실패함, ±59분 오차 있음), `"0 1 * * *"`로 설정. **이 과정에서 실제 버그 하나 더 발견**: `syncPostImageVisibility`의 `extractPrivateMediaIds`가 `featuredImage.value`를 항상 raw id로 가정했는데, depth 미지정 호출에서는 populate된 객체로 올 수 있어 DB 정수 캐스팅 오류가 났음 — 회원이 이미지 첨부 게시물을 만들 때 이 훅이 조용히 실패해서 비밀글 아닌 게시물의 이미지가 다른 사람에게 안 보였을 가능성이 있음. 수정 완료(커밋 `7350f8d`).
6. **백업·복구 문서화** — `docs/operations/backup-restore.md`(pg_dump/pg_restore 실행 가능한 명령, 선택적 내보내기, Blob 목록 대조). Supabase 자동백업/PITR 활성화 여부는 대시보드 확인이 필요해 방법만 적어두고 사용자 확인 대기(커밋 `db55ce0`).
7. **로컬 회귀 점검** — 홈페이지/관리자 로그인/게시판 목록 정상 렌더링, 콘솔 에러 없음, rename 테스트 후 스키마·데이터 정상 확인.

### 완료 갱신 (같은 날 계속) — 환경변수 등록, 마이그레이션 적용, 10.7 Preview 배포 성공

1. ~~환경변수 등록 확인~~ → **완료.** 운영자가 Vercel 대시보드에 `DATABASE_URL`/`DIRECT_URL`/`PAYLOAD_SECRET`(신규 생성)/`NEXT_PUBLIC_SERVER_URL`/`PUBLIC_REGISTRATION_ENABLED`/Blob 토큰/`CRON_SECRET`(신규 생성, Production 전용) 등록 완료. Resend만 발신 도메인 인증 후로 보류. `docs/operations/env-vars.md` 갱신됨.
2. ~~베이스라인 마이그레이션 운영 DB 적용~~ → **완료.** 운영자가 Payload/Drizzle의 `payload_migrations` 추적 테이블(Supabase CLI 자체 마이그레이션 시스템과는 다른 테이블 — 혼동해서 `supabase migration repair`를 쓰면 안 됨)에 47개 테이블 일치를 먼저 확인한 뒤 batch 1로 기록. 테이블 생성 SQL 자체는 실행 안 함(이미 push 모드로 존재). `payload migrate:status`로 `Ran: Yes` 재확인함. 같은 작업에서 유일한 관리자를 `editor`→`super-admin`으로 승격(초기 부트스트랩 공백 해소). `docs/operations/migrations.md` 갱신됨.
3. `migrate:down` 롤백 절차 로컬 실습 — 아직 안 함.
4. ~~10.7 Vercel Preview 검증~~ → **배포 성공까지 완료.** 진행 중 배포를 완전히 막는 심각한 버그 발견·수정: Next.js 16 프로덕션 빌드 기본값인 Turbopack이 `sharp` 네이티브 모듈을 제대로 트레이싱 못해 전 페이지 500 에러 발생 → 여러 우회 시도(`serverExternalPackages`, `outputFileTracingIncludes`, 후자는 범위를 잘못 잡아 배포 용량 초과로 또 실패) 끝에 **프로덕션 빌드를 Webpack으로 강제 전환**(`package.json` build 스크립트에 `--webpack`)해서 해결. 이후 실제 Preview 배포 성공, 홈페이지·관리자 로그인·게시판 목록·sitemap.xml·robots.txt·cron 엔드포인트(401 대신 500 — CRON_SECRET을 Preview엔 의도적으로 미등록이라 정상) 전부 브라우저로 확인. 테스트 위해 `vercel project protection disable --sso`로 임시 해제했다가 확인 후 다시 `enable`로 원복함. **10MB 이미지 업로드 테스트는 여전히 미완료**(로컬 스크립트로는 실제 HTTP 요청 크기 제한 검증이 안 되고, 진짜 브라우저 파일첨부가 필요한데 이번 세션 샌드박스 브라우저가 파일 업로드를 지원 안 함 — Claude in Chrome 등 실제 브라우저 자동화로 다음에 재시도). 상세 기록: guide.md 10단계 관련 이슈, 10.7절.
5. **10.8 최종 회귀시험** — guide.md 24절 체크리스트 전체를 실제 Preview 배포에서 재실행 — 아직 다 못함(핵심 페이지들만 확인).
6. **10.9 도메인 확정 및 실배포** — 사용자 승인 필요, 아직 안 함.
7. ~~관리자 계정 super-admin 승격~~ → 완료(위 2번 참고).

### 다음 세션 시작 지점

- 10MB 이미지 업로드 서버리스 본문 제한 테스트(실제 브라우저 파일첨부 필요)
- `migrate:down` 로컬 실습
- guide.md 24절 회귀시험 체크리스트 나머지 항목
- 이후 10.9(도메인 확정·실배포)로 진행

## 이어서 작업할 때 체크리스트

- 로컬 dev 서버 시작 전에 `taskkill //F //IM node.exe`로 좀비 프로세스 정리 권장(이 세션에서 여러 번 데드락/충돌 원인이었음).
- Payload 스키마 자동 push가 대화형 프롬프트로 멈출 수 있음(guide.md 7단계 이슈 참고) — 애매한 필드 변경(추가+타입변경 동시)은 나눠서 push할 것.
- 매 기능 단위 작업 후 `npx tsc --noEmit` → `pnpm payload generate:types` → 스키마 push → `pnpm build` → 브라우저 검증 순서를 지킬 것.
- 테스트 데이터는 항상 `[TEST]`나 `[검증용]` 같은 접두사를 붙이고 끝나면 정리할 것(이 세션에서 이미 여러 번 이 패턴 사용).
