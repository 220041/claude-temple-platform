import type { Access, CollectionConfig, FieldAccess, Where } from 'payload'

import { auditPostChanges, auditPostPermanentDelete, cascadeDeletePostRelations } from './hooks/auditPostChanges'
import { setPostAuthor } from './hooks/setPostAuthor'
import { syncPostImageVisibility } from './hooks/syncPostImageVisibility'
import { validatePost } from './hooks/validatePost'

const getRelationId = (value: unknown): string | number | undefined => {
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: string | number }).id
  if (typeof value === 'string' || typeof value === 'number') return value
  return undefined
}

// guide.md 9.3: 비밀글은 목록엔 마스킹돼 노출되지만, 본문/이미지 같은
// 실제 내용 필드는 작성자 본인·관리자만 읽을 수 있다.
const secretFieldReadAccess: FieldAccess = ({ req: { user }, doc }) => {
  if (!doc || doc.visibility !== 'secret') return true
  if (user && user.collection === 'admins') return true
  if (user && user.collection === 'members' && doc.authorType === 'member' && getRelationId(doc.memberAuthor) === user.id) return true
  return false
}

const commonReadConditions = (): Where[] => {
  const now = new Date().toISOString()
  return [
    { _status: { equals: 'published' } },
    { archived: { not_equals: true } },
    { hiddenAt: { exists: false } },
    { or: [{ expiresAt: { exists: false } }, { expiresAt: { greater_than: now } }] },
  ]
}

/**
 * guide.md 7.1절 공통 Posts 필드. 게시판별 프로그램을 복제하지 않고
 * board 관계로 정책을 분기한다.
 */
export const Posts: CollectionConfig = {
  slug: 'posts',
  trash: true,
  admin: {
    group: '게시판',
    useAsTitle: 'title',
    defaultColumns: ['title', 'board', 'status', 'pinned', 'reportCount', 'updatedAt'],
  },
  access: {
    // guide.md 9.3: 비밀글도 목록에는 "비밀글입니다"로 마스킹돼 노출돼야
    // 하므로, 문서 자체(제목 포함)는 누구나 조회 가능하게 열어두고
    // title/content/featuredImage/images 필드 접근을 아래 필드별
    // access.read로 따로 제한한다(본문·이미지는 작성자·관리자만).
    // Stage 3: 회원 글 승인 대기(moderationStatus) 추가 — commonReadConditions
    // (기존 조건, 변경 없음)에 moderationStatus 조건만 분기해서 더한다.
    // 관리자가 특정 게시물 ID로 직접 접근(목록 조회가 아님)할 때만 완전히
    // 우회한다 — hiddenAt이 이미 그렇듯 관리자도 목록에서는 승인대기/반려
    // 글을 못 보고, 대시보드 검수 카드의 딥링크로만 들어가 확인·처리한다.
    read: (async ({ req: { user }, id }) => {
      const conditions = commonReadConditions()

      if (user && user.collection === 'admins' && id !== undefined) {
        return { and: conditions }
      }

      const notPendingOrRejected: Where = { moderationStatus: { not_in: ['pending', 'rejected'] } }
      if (user && user.collection === 'members') {
        conditions.push({ or: [notPendingOrRejected, { memberAuthor: { equals: user.id } }] })
      } else {
        conditions.push(notPendingOrRejected)
      }
      return { and: conditions }
    }) satisfies Access,
    create: (async ({ req, data }) => {
      const { user, payload } = req
      if (user && user.collection === 'admins') return true
      if (!user || user.collection !== 'members' || !data?.board) return false

      const boardId = getRelationId(data.board)
      if (boardId === undefined) return false

      const board = await payload.findByID({ collection: 'boards', id: boardId, overrideAccess: true, req })
      return Boolean(board?.allowMemberPost)
    }) satisfies Access,
    // 본인 게시물 수정(guide.md 7.2)은 update 접근에서 처리한다.
    update: (async ({ req, id }) => {
      const { user, payload } = req
      if (user && user.collection === 'admins') return true
      if (!user || user.collection !== 'members' || id === undefined) return false

      const doc = await payload.findByID({ collection: 'posts', id, overrideAccess: true, req })
      return Boolean(doc && doc.authorType === 'member' && getRelationId(doc.memberAuthor) === user.id)
    }) satisfies Access,
    // Payload는 trash 컬렉션에서 deletedAt을 채우는 update(=소프트 삭제
    // 진입)도 access.delete로 검사한다(updateByID가 data.deletedAt이 있으면
    // 자동으로 delete 접근을 추가로 확인함). 그래서 여기서 data.deletedAt
    // 존재 여부로 "trash 진입 시도"와 "진짜 영구삭제"를 구분한다: 본인
    // 게시물의 trash 진입은 허용하고, data가 없는 순수 delete 오퍼레이션
    // (영구삭제)은 최고관리자만 허용한다(guide.md 10.3).
    delete: (async ({ req, id, data }) => {
      const { user, payload } = req
      if (user && user.collection === 'admins' && user.role === 'super-admin') return true

      const isTrashEntry = data && typeof data === 'object' && 'deletedAt' in data && data.deletedAt != null
      if (isTrashEntry && user && user.collection === 'members' && id !== undefined) {
        const doc = await payload.findByID({ collection: 'posts', id, overrideAccess: true, req })
        return Boolean(doc && doc.authorType === 'member' && getRelationId(doc.memberAuthor) === user.id)
      }

      return false
    }) satisfies Access,
  },
  versions: {
    drafts: {
      autosave: false,
      schedulePublish: true,
    },
    maxPerDoc: 30,
  },
  hooks: {
    beforeValidate: [validatePost],
    beforeChange: [setPostAuthor],
    afterChange: [syncPostImageVisibility, auditPostChanges],
    beforeDelete: [cascadeDeletePostRelations],
    afterDelete: [auditPostPermanentDelete],
  },
  fields: [
    { name: 'board', type: 'relationship', relationTo: 'boards', required: true, index: true },
    { name: 'title', type: 'text', required: true, access: { read: secretFieldReadAccess } },
    { name: 'content', type: 'textarea', required: true, access: { read: secretFieldReadAccess } },
    {
      name: 'authorType',
      type: 'select',
      defaultValue: 'admin',
      options: [
        { label: '관리자', value: 'admin' },
        { label: '회원', value: 'member' },
      ],
      admin: { description: '작성 시 요청자 신원에 따라 서버에서 자동 지정된다(hooks/setPostAuthor.ts).' },
    },
    { name: 'adminAuthor', type: 'relationship', relationTo: 'admins' },
    { name: 'memberAuthor', type: 'relationship', relationTo: 'members' },
    {
      name: 'moderationStatus',
      label: '승인 상태',
      type: 'select',
      defaultValue: 'approved',
      options: [
        { label: '승인됨', value: 'approved' },
        { label: '승인 대기', value: 'pending' },
        { label: '반려됨', value: 'rejected' },
      ],
      admin: {
        description:
          '회원 작성 게시물 중 게시판의 "회원 글 공개 방식"이 승인제인 경우에만 의미가 있다(hooks/setPostAuthor.ts가 자동 지정). 반려 시 아래 "관리자 조치 사유"에 사유를 남긴다.',
      },
    },
    {
      name: 'visibility',
      type: 'select',
      defaultValue: 'public',
      options: [
        { label: '공개', value: 'public' },
        { label: '비밀글', value: 'secret' },
      ],
      admin: { description: '비밀글은 게시판의 allowSecret이 켜진 경우에만 허용된다(guide.md 9.3, 자유게시판).' },
    },
    {
      name: 'commentPolicy',
      type: 'select',
      defaultValue: 'boardDefault',
      options: [
        { label: '게시판 기본값 따름', value: 'boardDefault' },
        { label: '댓글 허용', value: 'allowed' },
        { label: '댓글 차단', value: 'blocked' },
      ],
    },
    // 관리자 작성 게시물의 이미지는 Public Blob(media-public)에, 회원
    // 작성 게시물의 이미지는 Private Blob(media-private)에 올라간다
    // (guide.md 10.1). 업로드 시점에 어느 컬렉션에 저장했는지에 따라
    // 자동으로 맞는 관계가 선택되므로 두 컬렉션을 모두 허용한다.
    { name: 'featuredImage', type: 'upload', relationTo: ['media-public', 'media-private'], access: { read: secretFieldReadAccess } },
    {
      name: 'images',
      type: 'array',
      maxRows: 10,
      access: { read: secretFieldReadAccess },
      fields: [{ name: 'image', type: 'upload', relationTo: ['media-public', 'media-private'], required: true }],
    },
    { name: 'pinned', type: 'checkbox', defaultValue: false },
    { name: 'viewCount', label: '조회수', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'showInTempleNews', label: '봉림사 소식에 노출', type: 'checkbox', defaultValue: false },
    { name: 'templeNewsFeatured', label: '봉림사 소식 대표', type: 'checkbox', defaultValue: false },
    { name: 'templeNewsPinned', label: '봉림사 소식 상단 고정', type: 'checkbox', defaultValue: false },
    { name: 'archived', type: 'checkbox', defaultValue: false },
    { name: 'expiresAt', label: '게시 종료일', type: 'date' },
    { name: 'hiddenAt', label: '관리자 숨김 시각', type: 'date', admin: { readOnly: true } },
    { name: 'moderationReason', label: '관리자 조치 사유', type: 'text' },
    {
      name: 'reportCount',
      label: '누적 신고 수',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, components: { Cell: '@/components/admin/ReportCountCell#ReportCountCell' } },
    },
    {
      name: 'dharmaMeta',
      label: '법문 메타데이터',
      type: 'group',
      admin: { description: '법문 게시판에서만 입력한다.' },
      fields: [
        { name: 'dharmaDate', label: '법문일자', type: 'date' },
        { name: 'speaker', label: '법문자/스님', type: 'text' },
        { name: 'summary', label: '요약', type: 'textarea' },
        { name: 'youtubeUrl', label: '유튜브 URL', type: 'text' },
      ],
    },
    {
      name: 'pressMeta',
      label: '언론 보도 메타데이터',
      type: 'group',
      admin: { description: '언론 속 봉림사 게시판에서만 입력한다.' },
      fields: [
        { name: 'outlet', label: '언론사', type: 'text' },
        { name: 'reportedAt', label: '보도일', type: 'date' },
        { name: 'sourceUrl', label: '원문 URL', type: 'text' },
      ],
    },
  ],
}
