import type { CollectionConfig } from 'payload'

import { auditMemberStatusChange } from './hooks/auditMemberStatusChange'
import { handleEmailChange } from './hooks/handleEmailChange'
import { memberAuthEndpoints } from './hooks/memberAuthEndpoints'
import { redactMemberFields } from './hooks/redactMemberFields'
import { validateMember } from './hooks/validateMember'

const isAdmin = ({ req: { user } }: { req: { user: { collection?: string } | null } }) =>
  Boolean(user && user.collection === 'admins')

const isSelfOrAdmin = ({ req: { user }, id }: { req: { user: { collection?: string; id?: unknown } | null }; id?: unknown }) => {
  if (user && user.collection === 'admins') return true
  if (user && user.collection === 'members' && id !== undefined && user.id === id) return true
  return Boolean(user && user.collection === 'members') && id === undefined
}

/**
 * guide.md 3.2/3.3절: 일반회원 계정. 관리자 컬렉션과 분리하고, 전화번호·
 * 주소·생년월일은 아예 수집하지 않는다.
 */
export const Members: CollectionConfig = {
  slug: 'members',
  labels: { singular: '회원', plural: '회원' },
  auth: {
    verify: true,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000, // 15분
    forgotPassword: {
      expiration: 30 * 60 * 1000, // 30분
      // Payload 기본 이메일 템플릿은 관리자 패널 스타일 링크를 만들므로,
      // 회원용 프런트엔드 재설정 페이지로 연결되도록 직접 구성한다
      // (guide.md 24절 "비밀번호 재설정 시험" — 로그인 화면에서 로그아웃
      // 상태로 요청하는 흐름이며, 마이페이지의 로그인 상태 비밀번호
      // 변경과는 별개 기능).
      generateEmailHTML: (args) => {
        const token = args?.token ?? ''
        const url = `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/reset-password?token=${token}`
        return `<p>아래 링크를 클릭해 비밀번호를 재설정해 주세요. 이 링크는 30분간 유효합니다.</p><p><a href="${url}">${url}</a></p>`
      },
      generateEmailSubject: async (args) => {
        const req = args?.req
        if (!req) return '사찰 홈페이지 비밀번호 재설정 안내'
        const siteSettings = await req.payload.findGlobal({ slug: 'site-settings', overrideAccess: true, req })
        const fromName = siteSettings.emailFromName || '사찰 홈페이지'
        return `${fromName} 비밀번호 재설정 안내`
      },
    },
  },
  trash: true,
  endpoints: memberAuthEndpoints,
  admin: {
    group: '회원',
    useAsTitle: 'nickname',
    defaultColumns: ['nickname', 'realName', 'status', 'createdAt'],
  },
  access: {
    // 공개 회원가입은 공식 도메인 인증 전까지 잠근다(guide.md 4.2).
    // 관리자는 테스트 계정을 언제든 만들 수 있다.
    create: ({ req: { user } }) => {
      if (user && user.collection === 'admins') return true
      return process.env.PUBLIC_REGISTRATION_ENABLED === 'true'
    },
    // 닉네임 등 공개 정보 열람은 누구나 가능하고, 민감 필드는
    // afterRead 훅(redactMemberFields)이 마스킹한다.
    read: () => true,
    update: isSelfOrAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [validateMember],
    afterChange: [handleEmailChange, auditMemberStatusChange],
    afterRead: [redactMemberFields],
  },
  fields: [
    {
      name: 'nickname',
      label: '닉네임',
      type: 'text',
      required: true,
      unique: true,
      minLength: 2,
      maxLength: 20,
    },
    { name: 'realName', label: '실명', type: 'text', required: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: '이메일 인증 대기', value: 'pending' },
        { label: '정상 이용', value: 'active' },
        { label: '이용 정지', value: 'suspended' },
        { label: '탈퇴', value: 'withdrawn' },
      ],
      access: {
        // 상태 변경은 관리자만 한다(정지/해제/강제탈퇴는 8단계 운영 기능).
        update: isAdmin,
      },
    },
    { name: 'suspensionReason', label: '정지 사유', type: 'text' },
    { name: 'suspensionUntil', label: '정지 기간', type: 'date' },
    { name: 'termsVersion', label: '이용약관 버전', type: 'text', required: true },
    { name: 'privacyVersion', label: '개인정보처리방침 버전', type: 'text', required: true },
    { name: 'boardPolicyVersion', label: '게시판 운영정책 버전', type: 'text', required: true },
    { name: 'agreedAt', label: '약관 동의 일시', type: 'date', required: true },
    {
      name: 'lastNicknameChangeAt',
      label: '닉네임 마지막 변경일',
      type: 'date',
      admin: { readOnly: true, description: '닉네임 30일 변경 제한 계산용' },
    },
  ],
}
