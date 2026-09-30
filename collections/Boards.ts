import type { CollectionConfig } from 'payload'

import { anyAdmin, superAdminOnly } from '../lib/access'

/**
 * guide.md 7.1: 게시판마다 프로그램을 복제하지 않고 공통 Boards 설정과
 * Posts 컬렉션을 사용한다. 게시판 키·이름·정책만 여기서 관리하며,
 * 화면에 노출되는 메뉴 구조 자체는 코드로 고정한다(guide.md 1.2/5.1).
 */
export const Boards: CollectionConfig = {
  slug: 'boards',
  admin: {
    group: '게시판',
    useAsTitle: 'displayName',
  },
  access: {
    read: () => true,
    create: superAdminOnly,
    update: anyAdmin,
    delete: superAdminOnly,
  },
  fields: [
    {
      name: 'boardKey',
      label: '고정 게시판 키',
      type: 'select',
      required: true,
      unique: true,
      options: [
        { label: '공지사항', value: 'notices' },
        { label: '법문', value: 'dharma' },
        { label: '언론 속 봉림사', value: 'press' },
        { label: '회주·주지스님 포토갤러리', value: 'monk-gallery' },
        { label: '봉림풍경 포토갤러리', value: 'scenery-gallery' },
        { label: '자유게시판', value: 'community' },
        { label: '봉림사 이야기', value: 'stories' },
        { label: '감로당', value: 'gamrodang' },
      ],
      admin: { description: '메뉴 URL과 매핑되는 고정 키. 생성 후 변경하지 않는다.' },
    },
    { name: 'displayName', label: '게시판 표시명', type: 'text', required: true },
    { name: 'adminOnly', label: '관리자만 작성 가능', type: 'checkbox', defaultValue: true },
    { name: 'allowMemberPost', label: '인증회원 작성 허용', type: 'checkbox', defaultValue: false },
    { name: 'defaultAllowComments', label: '댓글 기본 허용', type: 'checkbox', defaultValue: true },
    { name: 'allowPerPostCommentToggle', label: '게시물별 댓글 설정 허용', type: 'checkbox', defaultValue: false },
    { name: 'allowSecret', label: '비밀글 허용', type: 'checkbox', defaultValue: false },
    { name: 'allowTempleNewsSelection', label: '봉림사 소식 선정 가능', type: 'checkbox', defaultValue: true },
    { name: 'maxPinned', label: '상단 고정 최대 개수', type: 'number', defaultValue: 3, min: 0, max: 20 },
  ],
}
