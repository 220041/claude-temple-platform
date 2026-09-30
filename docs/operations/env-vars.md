# 운영 환경변수 체크리스트 (Vercel 프로젝트: `hanonbonglimsa`)

이 문서는 guide.md 10.1절(환경변수 점검) 작업 결과다. 실제 값은 절대 이 문서나
git에 커밋하지 않는다 — Vercel 대시보드(프로젝트 → Settings → Environment
Variables)에서 사용자가 직접 등록한다.

> 2026-08-07 기준: 운영 도메인 미확정 → 당분간 Vercel 기본 도메인
> (`https://hanonbonglimsa.vercel.app` 형태, 실제 배포 후 확정되는 주소 확인 필요)
> 으로 진행. 운영 DB는 개발용 Supabase 프로젝트를 그대로 공유해서 사용하기로
> 결정(운영자 확인, 추후 분리 여지 있음).

> 2026-08-07 등록 완료: Vercel 프로젝트 `hanonbonglimsa`의 Production/Preview에
> 아래 표의 준비된 변수를 등록했다. `PAYLOAD_SECRET`과 `CRON_SECRET`은 운영용
> 랜덤값을 새로 생성했으며, 비밀값은 문서나 Git에 남기지 않았다. Resend 관련
> 두 변수는 발신 도메인 인증 전이므로 계속 미등록 상태다.

## 등록해야 할 변수

| 변수명 | Production 값 | Preview 값 | 비고 |
|---|---|---|---|
| `DATABASE_URL` | 등록 완료 (개발용과 동일) | 등록 완료 (Production과 동일) | Supabase pooler 연결 문자열 |
| `DIRECT_URL` | 등록 완료 (개발용과 동일) | 등록 완료 (Production과 동일) | 마이그레이션/스키마 작업용 direct 연결 |
| `PAYLOAD_SECRET` | 등록 완료 (운영용 신규 랜덤값) | 등록 완료 (Production과 동일) | 64자리 hex 문자열, Sensitive로 등록 |
| `NEXT_PUBLIC_SERVER_URL` | `https://hanonbonglimsa.vercel.app` 등록 완료 | 생략 | sitemap/robots/OG의 절대경로 계산에 사용됨(9단계에 이미 코드 반영됨) |
| `PUBLIC_REGISTRATION_ENABLED` | `false` 등록 완료 | `false` 등록 완료 | 운영자 결정: 도메인·이메일 검증 완료 후 `true`로 전환 (guide.md 4.2절) |
| `RESEND_API_KEY` | **아직 미설정** — Resend 발신 도메인 인증 완료 후 등록 | 동일 | 미설정 시 이메일은 서버 로그로만 출력됨(현재 개발 환경과 동일한 동작) |
| `EMAIL_FROM` | Resend 발신 도메인 인증 완료 후 확정 | 동일 | |
| `BLOB_READ_WRITE_TOKEN_PUBLIC` | 등록 완료 (개발용과 동일) | 등록 완료 (Production과 동일) | Vercel Blob 스토어는 이미 생성돼 있음(store_lHuGXigt4Q80yANE) |
| `BLOB_READ_WRITE_TOKEN_PRIVATE` | 등록 완료 (개발용과 동일) | 등록 완료 (Production과 동일) | store_mwwZ5ImuANIghhmJ |
| `CRON_SECRET` | 등록 완료 (운영용 신규 랜덤값) | 불필요 | 48자리 hex 문자열, Production에만 Sensitive로 등록 |

## 등록하지 않아도 되는 변수 (개발 전용)

* `TEST_EMAIL_RECIPIENT` — 로컬 개발 시 테스트 수신 확인용, 운영엔 불필요
* `VERCEL_OIDC_TOKEN` — `vercel link`/`vercel dev` 실행 시 CLI가 로컬에 자동 생성하는 값, Vercel이 배포 시 자체적으로 주입하므로 수동 등록 불필요

## CRON_SECRET 예시값 (참고용 — 실제로는 별도 생성해서 사용 권장)

```
openssl rand -hex 24
```

## 참고: 이미 확인된 인프라 상태 (2026-08-07)

* Vercel 프로젝트: `hanonbonglimsa` (신규 생성, `yakolibre-2260s-projects` 팀)
  * 기존 `hanonbonglimsa_v3`(9일 전 생성, 환경변수 미등록, Payload 이전 더미 데이터로 배포된 이력 있음 — 이번 작업과 무관하므로 사용하지 않음, 삭제하지 않고 방치)
  * 기존 `bongrimsa`(v0.dev로 생성된 원본 정적 프론트엔드 프로젝트) — 삭제 완료
* Vercel Blob 스토어 2개 이미 존재하고 활성 상태: `hanonbonglimsa-public`, `hanonbonglimsa-private`
* GitHub 저장소 `220041/hanonbonglimsa`와 Vercel 프로젝트 간 Git 연동(자동배포) — **✅ 확인 완료 (2026-08-08)**. `vercel git connect`로 확인해보니 이미 연동돼 있었다(이전 세션에 이미 설정된 것으로 보임, `vercel project inspect` 요약 화면에는 Git 정보가 안 보여서 미연동으로 착각했었다). `feat/payload-foundation` 브랜치에 실제 push해서 자동으로 새 Preview 배포가 생성·빌드 성공(1분 내 `Ready`)하는 것까지 실측 확인했다.
