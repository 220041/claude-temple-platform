import type { CollectionBeforeValidateHook } from 'payload'

const MIN_PASSWORD_LENGTH = 10
const NICKNAME_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000

// guide.md 3.3: 관리자·운영자 등 오인 가능 닉네임을 제한한다. 사찰 고유
// 명칭(정식/짧은/영문 이름)은 코드에 고정하지 않고 SiteSettings에서 매번
// 읽어와 합친다 — 사찰마다 다른 값이라 하드코딩하면 다른 사찰에서는
// 자기 이름을 막지 못하거나, 반대로 관계없는 이름을 막게 된다.
// 일반 비속어 사전은 실제 서비스 운영 시 별도 필터링 서비스/사전 연동을
// 권장하며(guide.md 23절: 임의 데이터 생성 금지), 여기서는 사칭 방지에
// 필요한 최소 목록만 코드로 고정한다.
const BASE_RESERVED_NICKNAME_SUBSTRINGS = ['관리자', '운영자', 'admin', 'administrator', 'moderator', 'system']

/**
 * guide.md 3.3절: 비밀번호 10자 이상, 닉네임 2~20자·30일 1회 변경·
 * 사칭 닉네임 금지, 가입 시 3개 약관 동의를 서버에서 강제한다.
 */
export const validateMember: CollectionBeforeValidateHook = async ({ data, operation, originalDoc, req }) => {
  if (!data) return data

  if (typeof data.password === 'string' && data.password.length > 0 && data.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`)
  }

  if (typeof data.nickname === 'string') {
    const siteSettings = await req.payload.findGlobal({ slug: 'site-settings', overrideAccess: true, req })
    const siteNameSubstrings = [siteSettings.siteName, siteSettings.siteShortName, siteSettings.siteNameEn].filter(
      (v): v is string => Boolean(v),
    )
    const reservedSubstrings = [...BASE_RESERVED_NICKNAME_SUBSTRINGS, ...siteNameSubstrings]

    const lower = data.nickname.toLowerCase()
    if (reservedSubstrings.some((word) => lower.includes(word.toLowerCase()))) {
      throw new Error('사용할 수 없는 닉네임입니다.')
    }

    if (operation === 'update' && originalDoc && originalDoc.nickname !== data.nickname) {
      const lastChange = originalDoc.lastNicknameChangeAt ? new Date(originalDoc.lastNicknameChangeAt).getTime() : 0
      if (Date.now() - lastChange < NICKNAME_COOLDOWN_MS) {
        throw new Error('닉네임은 30일에 1회만 변경할 수 있습니다.')
      }
      data.lastNicknameChangeAt = new Date().toISOString()
    }
  }

  if (operation === 'create') {
    if (!data.termsVersion || !data.privacyVersion || !data.boardPolicyVersion || !data.agreedAt) {
      throw new Error('이용약관, 개인정보처리방침, 게시판 운영정책에 모두 동의해야 합니다.')
    }
  }

  // 탈퇴 처리: 개인정보를 익명화하고 게시물/댓글은 그대로 둔다(guide.md 3.3).
  if (data.status === 'withdrawn' && originalDoc?.status !== 'withdrawn') {
    data.realName = '탈퇴한 회원'
    data.email = `withdrawn-${originalDoc?.id ?? Date.now()}@deleted.local`
  }

  return data
}
