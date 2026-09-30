import type { CollectionConfig } from 'payload'

import { anyAdmin, superAdminOnly } from '../lib/access'
import { isReservedPath } from '../lib/reservedPaths'

const SLUG_PATTERN = /^[a-z][a-z0-9-]{1,49}$/

/**
 * guide.md 7.1: 게시판마다 프로그램을 복제하지 않고 공통 Boards 설정과
 * Posts 컬렉션을 사용한다. 게시판 키·이름·정책만 여기서 관리한다.
 *
 * Stage 3(동적 게시판): boardKey는 기존 8개 고정 select에서 자유 slug로
 * 바뀌었다. 기존 8개 값(notices/dharma/...)은 lib/boards.ts의 BOARD_PATHS에
 * 남아있는 전용 경로를 그대로 쓰고, 새로 만드는 게시판은 pathForBoardKey()가
 * `/boards/{boardKey}`로 자동 연결한다(app/(frontend)/boards/[slug]).
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
      label: '게시판 주소(키)',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: '영문 소문자·숫자·하이픈만 사용. 게시판 주소(/boards/이 값)로 쓰이며 생성 후 바꿀 수 없습니다. 예: youth-gathering',
      },
      validate: (
        value: string | null | undefined,
        { operation, previousValue }: { operation?: string; previousValue?: string },
      ) => {
        if (typeof value !== 'string' || !value) return '게시판 주소를 입력하세요.'
        if (operation === 'update') {
          if (previousValue && previousValue !== value) {
            return '게시판 주소는 생성한 뒤에는 바꿀 수 없습니다.'
          }
          return true
        }
        if (!SLUG_PATTERN.test(value)) {
          return '영문 소문자로 시작하는 소문자·숫자·하이픈만 2~50자로 입력하세요 (예: youth-gathering).'
        }
        if (isReservedPath(value)) {
          return `"${value}"는 시스템이 사용하는 예약된 경로라 게시판 주소로 쓸 수 없습니다.`
        }
        return true
      },
    },
    { name: 'displayName', label: '게시판 표시명', type: 'text', required: true },
    {
      name: 'boardType',
      label: '게시판 유형',
      type: 'select',
      defaultValue: 'general',
      options: [
        { label: '공지형 목록', value: 'notice' },
        { label: '일반 목록', value: 'general' },
        { label: '사진 갤러리', value: 'gallery' },
      ],
      admin: {
        description: '새로 만드는 게시판의 화면 형태를 정합니다(기존 8개 게시판은 자체 화면을 그대로 써서 이 값의 영향을 받지 않습니다).',
      },
    },
    {
      name: 'memberPostApproval',
      label: '회원 글 공개 방식',
      type: 'select',
      defaultValue: 'immediate',
      options: [
        { label: '작성 즉시 공개', value: 'immediate' },
        { label: '관리자 승인 후 공개', value: 'requiresApproval' },
      ],
      admin: { description: '인증회원 작성을 허용한 게시판에서만 의미가 있습니다.' },
    },
    { name: 'adminOnly', label: '관리자만 작성 가능', type: 'checkbox', defaultValue: true },
    { name: 'allowMemberPost', label: '인증회원 작성 허용', type: 'checkbox', defaultValue: false },
    { name: 'defaultAllowComments', label: '댓글 기본 허용', type: 'checkbox', defaultValue: true },
    { name: 'allowPerPostCommentToggle', label: '게시물별 댓글 설정 허용', type: 'checkbox', defaultValue: false },
    { name: 'allowSecret', label: '비밀글 허용', type: 'checkbox', defaultValue: false },
    { name: 'allowTempleNewsSelection', label: '봉림사 소식 선정 가능', type: 'checkbox', defaultValue: true },
    { name: 'maxPinned', label: '상단 고정 최대 개수', type: 'number', defaultValue: 3, min: 0, max: 20 },
  ],
}
