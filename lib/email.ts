import { resendAdapter } from '@payloadcms/email-resend'

/**
 * guide.md 4.1/4.2절: Resend는 회원가입 인증/재발송/비밀번호 재설정/
 * 이메일 변경 인증에만 사용한다. 공식 도메인 인증과 PUBLIC_REGISTRATION_ENABLED
 * 전환 전까지는 실제 수신자와 무관하게 TEST_EMAIL_RECIPIENT로만 발송한다.
 */
export function buildEmailAdapter() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return undefined

  const publicRegistrationEnabled = process.env.PUBLIC_REGISTRATION_ENABLED === 'true'

  return resendAdapter({
    apiKey,
    defaultFromAddress: process.env.EMAIL_FROM || 'noreply@example.com',
    // Payload config 평가 시점(모듈 로드 시)에 실행되므로 DB(SiteSettings)를
    // 읽을 수 없다 — 여기는 범용 기본값만 두고, 실제 발신 이름이 필요한
    // 제목 줄은 요청 시점에 SiteSettings.emailFromName을 읽는 각 훅에서 만든다.
    defaultFromName: '사찰 홈페이지',
    overrideRecipientAddress: publicRegistrationEnabled ? undefined : process.env.TEST_EMAIL_RECIPIENT,
  })
}
