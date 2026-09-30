import type { GlobalConfig } from 'payload'

import { adminOnly } from '../lib/access'

/**
 * guide.md 6절: 홈페이지에서 관리자가 수정할 수 있는 항목들.
 * 메뉴 구조·레이아웃은 코드로 고정하고, 이 Global은 콘텐츠(문구/이미지/링크)만 다룬다.
 */
export const HomePage: GlobalConfig = {
  slug: 'home-page',
  admin: {
    group: '홈페이지',
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'mainSlides',
      label: '메인 슬라이드',
      type: 'array',
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media-public', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'subtitle', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'linkUrl', type: 'text' },
        { name: 'enabled', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'templeNews',
      label: '봉림사 소식',
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
        { name: 'title', type: 'text' },
        { name: 'summary', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'media-public' },
        { name: 'linkUrl', type: 'text' },
      ],
    },
    {
      name: 'monkIntro',
      label: '회주·주지 스님 소개',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'summary', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'media-public' },
        { name: 'linkUrl', type: 'text' },
      ],
    },
    {
      name: 'prayerCards',
      label: '기도·법회 카드',
      type: 'array',
      maxRows: 3,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'media-public' },
        { name: 'linkUrl', type: 'text' },
        {
          name: 'icon',
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
