import type { GlobalConfig } from 'payload'

import { adminOnly } from '../lib/access'

const SECTION_KEYS = ['templeIntro', 'prayer', 'location'] as const

/**
 * 메인 슬라이드 아래 3개 섹션의 표시 순서만 다룬다(표시 여부는 기존
 * showTempleIntro/showMonkIntro/showPrayerSection/showLocationSection
 * 체크박스가 그대로 담당 — 두 개념을 섞으면 "순서에서 뺐는데 체크박스는
 * 켜져 있다" 같은 혼동이 생긴다). 행 순서(array 필드 기본 Move Up/Down)로
 * 순서를 바꾸고, validate로 세 섹션이 정확히 한 번씩만 있도록 강제한다.
 */
const validateSectionOrder = (value: unknown) => {
  const sections = Array.isArray(value) ? value.map((row: { section?: string }) => row?.section) : []
  const unique = new Set(sections)
  if (unique.size !== SECTION_KEYS.length || !SECTION_KEYS.every((key) => unique.has(key))) {
    return '사찰·주지스님 소개, 기도·법회, 찾아오는 길 세 섹션이 정확히 한 번씩 있어야 합니다.'
  }
  return true
}

/**
 * guide.md 6절: 홈페이지에서 관리자가 수정할 수 있는 항목들.
 * 메뉴 구조·레이아웃은 코드로 고정하고, 이 Global은 콘텐츠(문구/이미지/링크)만 다룬다.
 */
export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: '홈페이지 구성',
  admin: {
    group: '홈페이지',
    preview: () => {
      const base = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
      // Pages.ts와 동일한 2중 인증 패턴 — app/(payload)/api/home-preview/route.ts가
      // secret+관리자 세션을 확인한 뒤 draftMode를 켜고 "/"로 리다이렉트한다.
      return `${base}/api/home-preview?secret=${process.env.PAGE_PREVIEW_SECRET ?? ''}`
    },
  },
  // Pages.ts와 동일한 초안/게시/복원 흐름. 기존에 versions 없이 운영되던
  // global이라, 마이그레이션에서 기존 데이터를 published 상태로 백필해야
  // 한다(아래 마이그레이션 참고) — 안 그러면 새로 생기는 _status 컬럼
  // 기본값이 'draft'가 되어 "최근 공개본"의 의미가 불명확해진다.
  versions: {
    drafts: {
      autosave: false,
      schedulePublish: true,
    },
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'showTempleIntro',
      label: '사찰 소개 섹션 표시',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showMonkIntro',
      label: '회주·주지 스님 소개 섹션 표시',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showPrayerSection',
      label: '기도·법회 카드 섹션 표시',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showLocationSection',
      label: '찾아오는 길 섹션 표시',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'sectionOrder',
      label: '섹션 순서',
      labels: { singular: '섹션', plural: '섹션' },
      type: 'array',
      minRows: 3,
      maxRows: 3,
      defaultValue: [{ section: 'templeIntro' }, { section: 'prayer' }, { section: 'location' }],
      validate: validateSectionOrder,
      admin: {
        description: '메인 슬라이드 아래 섹션이 표시되는 순서입니다. 각 행을 드래그해 순서를 바꾸세요(표시/숨김은 위 체크박스로 따로 설정합니다).',
      },
      fields: [
        {
          name: 'section',
          label: '섹션',
          type: 'select',
          required: true,
          options: [
            { label: '사찰·주지스님 소개', value: 'templeIntro' },
            { label: '기도·법회 카드', value: 'prayer' },
            { label: '찾아오는 길', value: 'location' },
          ],
        },
      ],
    },
    {
      name: 'mainSlides',
      label: '메인 슬라이드',
      labels: { singular: '슬라이드', plural: '슬라이드' },
      type: 'array',
      fields: [
        { name: 'image', label: '사진', type: 'upload', relationTo: 'media-public', required: true },
        { name: 'title', label: '제목', type: 'text', required: true },
        { name: 'subtitle', label: '부제목', type: 'text' },
        { name: 'description', label: '설명', type: 'textarea' },
        { name: 'linkUrl', label: '연결 주소', type: 'text', admin: { description: '누르면 이동할 주소. 예: /pages/location 또는 https://…' } },
        { name: 'enabled', label: '표시', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'templeNews',
      label: '사찰 소식',
      type: 'group',
      fields: [
        { name: 'displayCount', label: '노출 게시물 수', type: 'number', defaultValue: 7, min: 1, max: 30 },
        // 대표 게시물 / 상단 고정 게시물은 Posts 컬렉션이 생기는 5~8단계에서
        // relationTo 필드로 확장한다.
      ],
    },
    {
      name: 'templeIntro',
      label: '사찰 소개',
      type: 'group',
      fields: [
        { name: 'title', label: '제목', type: 'text' },
        { name: 'summary', label: '요약', type: 'textarea' },
        { name: 'image', label: '사진', type: 'upload', relationTo: 'media-public' },
        { name: 'linkUrl', label: '연결 주소', type: 'text', admin: { description: '누르면 이동할 주소. 예: /pages/location 또는 https://…' } },
      ],
    },
    {
      name: 'monkIntro',
      label: '회주·주지 스님 소개',
      type: 'group',
      fields: [
        { name: 'title', label: '제목', type: 'text' },
        { name: 'summary', label: '요약', type: 'textarea' },
        { name: 'image', label: '사진', type: 'upload', relationTo: 'media-public' },
        { name: 'linkUrl', label: '연결 주소', type: 'text', admin: { description: '누르면 이동할 주소. 예: /pages/location 또는 https://…' } },
      ],
    },
    {
      name: 'prayerCards',
      label: '기도·법회 카드',
      labels: { singular: '카드', plural: '카드' },
      type: 'array',
      maxRows: 3,
      fields: [
        { name: 'title', label: '제목', type: 'text', required: true },
        { name: 'description', label: '설명', type: 'textarea' },
        { name: 'image', label: '사진', type: 'upload', relationTo: 'media-public' },
        { name: 'linkUrl', label: '연결 주소', type: 'text', admin: { description: '누르면 이동할 주소. 예: /pages/location 또는 https://…' } },
        {
          name: 'icon',
          label: '아이콘',
          type: 'select',
          defaultValue: 'calendar',
          options: [
            { label: '달력', value: 'calendar' },
            { label: '하트', value: 'heart' },
            { label: '사람들', value: 'users' },
          ],
        },
      ],
    },
  ],
}
