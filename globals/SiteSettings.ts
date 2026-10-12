import type { GlobalConfig } from 'payload'

import { writeAuditLog } from '../collections/hooks/writeAuditLog'
import { superAdminOnly } from '../lib/access'

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/

const validateHexColor = (value: unknown) => {
  if (!value) return true // 비어있으면 기본값(globals.css 정적 팔레트)을 그대로 쓴다.
  if (typeof value === 'string' && HEX_COLOR_PATTERN.test(value)) return true
  return '#rrggbb 형식의 색상 코드를 입력하세요 (예: #9b6b3f)'
}

/**
 * 사찰별 정체성·구조 설정. 이 값이 비어 있으면(installed=false) 공개 화면은
 * 특정 사찰 자료 대신 "설치 미완료" 안내만 보여준다 — 두 번째 사찰을
 * 설치했을 때 하논봉림사 자료가 노출되지 않게 하는 유일한 판정 기준.
 * 사이트 정체성/구조 변경은 최고관리자만 가능하다(플랫폼 전환 작업지시서 §2).
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: '사이트 설정',
  admin: {
    group: '설정',
  },
  access: {
    read: () => true,
    update: superAdminOnly,
  },
  hooks: {
    // guide.md 11.4절: 사이트 설정 변경을 감사기록에 남긴다.
    afterChange: [
      async ({ doc, req }) => {
        if (req.user && req.user.collection === 'admins') {
          await writeAuditLog(req.payload, {
            actorId: req.user.id,
            action: 'site-settings-change',
            targetCollection: 'site-settings',
            req,
          })
        }
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
      {
        label: '기본 정보',
        fields: [
          { name: 'siteName', label: '사찰 정식 명칭', type: 'text', admin: { description: '예: ○○사' } },
          { name: 'siteShortName', label: '짧은 이름', type: 'text', admin: { description: '헤더/푸터 브랜드 표기용. 예: ○○' } },
          { name: 'siteNameEn', label: '영문 명칭', type: 'text', admin: { description: '예: Temple' } },
          { name: 'affiliation', label: '소속 종단', type: 'text', admin: { description: '예: 대한불교조계종' } },
          { name: 'logo', label: '로고 이미지', type: 'upload', relationTo: 'media-public' },
          { name: 'logoAlt', label: '로고 대체 텍스트', type: 'text' },
          { name: 'logoTagline', label: '로고 위 짧은 문구', type: 'text', admin: { description: '예: 산 속에 깃든 사찰' } },
        ],
      },
      {
        label: '디자인',
        fields: [
          { name: 'themeColor', label: '브라우저 주소창 색상', type: 'text', validate: validateHexColor },
          {
            name: 'colors',
            label: '허용된 색상',
            type: 'group',
            admin: { description: '공용 디자인 틀 안에서 바꿀 수 있는 색상만 제공합니다.' },
            fields: [
              { name: 'accent', label: '강조색', type: 'text', defaultValue: '#9b6b3f', validate: validateHexColor },
              { name: 'ink', label: '기본 글자색', type: 'text', defaultValue: '#20251f', validate: validateHexColor },
              { name: 'deep', label: '짙은 배경색', type: 'text', defaultValue: '#263328', validate: validateHexColor },
              { name: 'pine', label: '보조 배경색', type: 'text', defaultValue: '#405343', validate: validateHexColor },
              { name: 'paper', label: '밝은 배경색', type: 'text', defaultValue: '#f5f1e8', validate: validateHexColor },
            ],
          },
        ],
      },
      {
        label: '지도',
        fields: [
          {
            name: 'location',
            label: '지도 위치',
            type: 'group',
            fields: [
              { name: 'lat', label: '위도', type: 'number' },
              { name: 'lng', label: '경도', type: 'number' },
              { name: 'mapLabel', label: '지도 검색용 사찰명', type: 'text' },
              { name: 'zoomLevel', label: '기본 확대 단계', type: 'number', defaultValue: 4 },
            ],
          },
        ],
      },
      {
        label: '검색·메일',
        fields: [
          { name: 'siteDescription', label: '사이트 설명 (SEO)', type: 'textarea' },
          { name: 'siteKeywords', label: 'SEO 키워드', type: 'text', admin: { description: '쉼표로 구분' } },
          { name: 'emailFromName', label: '발신 메일 표시 이름', type: 'text', admin: { description: '예: [○○사]' } },
        ],
      },
      {
        label: '공개 설정',
        fields: [
          {
            name: 'installed',
            label: '설치 완료',
            type: 'checkbox',
            defaultValue: false,
            admin: {
              description:
                '체크하기 전까지 공개 화면(홈/헤더/푸터)은 이 사찰의 정보 대신 "설치 미완료" 안내만 보여줍니다. 다른 탭(기본 정보·디자인·지도 등)의 정보를 모두 입력한 뒤 체크하세요.',
            },
          },
          {
            name: 'homepageReady',
            label: '정식 홈페이지로 전환',
            type: 'checkbox',
            defaultValue: false,
            admin: {
              description:
                '체크 전까지는 설치 완료 후에도 홈페이지가 메뉴 없는 간단한 임시 화면(로고만)으로 보입니다. 메인 사진·소개·기도카드 등을 다 준비한 뒤 체크해 정식 메뉴가 있는 홈페이지로 전환하세요. 설치 완료와는 별도로 설정합니다.',
            },
          },
          {
            name: 'siteNoticeText',
            label: '사이트 상단 안내 문구',
            type: 'text',
            admin: { description: '모든 페이지 상단에 띠 배너로 표시됩니다(예: "공사 중", "오늘 하루 휴무"). 비워두면 배너가 표시되지 않습니다.' },
          },
        ],
      },
      ],
    },
  ],
}
