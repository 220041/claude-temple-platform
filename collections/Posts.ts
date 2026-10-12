import type { Access, CollectionConfig, FieldAccess, Where } from 'payload'

import { adminOnlyField } from '../lib/access'
import { pathForBoardKey } from '../lib/boardPaths'
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
  labels: { singular: '게시글', plural: '게시글' },
  trash: true,
  admin: {
    group: '게시판',
    useAsTitle: 'title',
    defaultColumns: ['title', 'board', 'status', 'pinned', 'reportCount', 'updatedAt'],
    // 저장한 글이 공개 화면에서 어떻게 보이는지 바로 열어 볼 수 있는 링크(게시 전이면 공개 화면에는 아직 없다).
    preview: async (doc, { req }) => {
      const base = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
      const boardRef = (doc as { board?: unknown }).board
      const boardId = boardRef && typeof boardRef === 'object' ? (boardRef as { id?: number }).id : (boardRef as number | undefined)
      if (!boardId || !doc?.id) return null
      const board = await req.payload.findByID({ collection: 'boards', id: boardId, depth: 0, overrideAccess: true, req })
      return `${base}${pathForBoardKey(board.boardKey)}/${doc.id}`
    },
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
    {
      name: 'board',
      label: '게시판',
      type: 'relationship',
      relationTo: 'boards',
      required: true,
      index: true,
      // 새 글을 쓸 때 가장 흔한 경우인 공지형 게시판을 미리 골라 둔다(대시보드 "공지 쓰기"가 곧바로 쓸 수 있게).
      defaultValue: async ({ req }: { req: { payload: { find: (a: unknown) => Promise<{ docs: { id: number }[] }> } } }) => {
        try {
          const r = await req.payload.find({ collection: 'boards', where: { boardType: { equals: 'notice' } }, sort: 'createdAt', limit: 1, depth: 0, overrideAccess: true })
          return r.docs[0]?.id
        } catch {
          return undefined
        }
      },
    },
    { name: 'title', label: '제목', type: 'text', required: true, access: { read: secretFieldReadAccess } },
    { name: 'content', label: '내용', type: 'textarea', required: true, access: { read: secretFieldReadAccess } },
    // 회원이 쓴 글일 때만, 본문 바로 아래에 승인 상태를 보여 준다(접힌 영역에 숨어 있으면 승인 작업을 찾기 어렵다).
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
        condition: (data) => data?.authorType === 'member',
        description: '회원이 쓴 글입니다. "승인됨"으로 바꾸고 저장하면 공개 게시판에 나타나고, "반려됨"이면 공개되지 않습니다. 반려할 때는 아래에 사유를 남겨 주세요.',
      },
    },
    {
      name: 'moderationReason',
      label: '반려·조치 사유',
      type: 'text',
      access: { create: adminOnlyField, update: adminOnlyField },
      admin: { condition: (data) => data?.authorType === 'member' },
    },
    // 관리자 작성 게시물의 이미지는 Public Blob(media-public)에, 회원
    // 작성 게시물의 이미지는 Private Blob(media-private)에 올라간다
    // (guide.md 10.1). 업로드 시점에 어느 컬렉션에 저장했는지에 따라
    // 자동으로 맞는 관계가 선택되므로 두 컬렉션을 모두 허용한다.
    { name: 'featuredImage', label: '대표 이미지', type: 'upload', relationTo: ['media-public', 'media-private'], access: { read: secretFieldReadAccess } },
    {
      name: 'images',
      label: '이미지',
      labels: { singular: '이미지', plural: '이미지' },
      type: 'array',
      maxRows: 10,
      access: { read: secretFieldReadAccess },
      fields: [{ name: 'image', label: '이미지', type: 'upload', relationTo: ['media-public', 'media-private'], required: true }],
    },
    {
      type: 'collapsible',
      label: '공개·댓글 설정',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'visibility',
          label: '공개 범위',
          type: 'select',
          defaultValue: 'public',
          options: [
            { label: '공개', value: 'public' },
            { label: '비밀글', value: 'secret' },
          ],
          admin: { description: '비밀글은 게시판 설정에서 비밀글을 허용한 경우에만 쓸 수 있습니다.' },
        },
        {
          name: 'commentPolicy',
          label: '댓글 정책',
          type: 'select',
          defaultValue: 'boardDefault',
          options: [
            { label: '게시판 기본값 따름', value: 'boardDefault' },
            { label: '댓글 허용', value: 'allowed' },
            { label: '댓글 차단', value: 'blocked' },
          ],
        },
        { name: 'pinned', label: '상단 고정', type: 'checkbox', defaultValue: false, access: { create: adminOnlyField, update: adminOnlyField } },
        { name: 'archived', label: '보관(게시 종료)', type: 'checkbox', defaultValue: false, access: { create: adminOnlyField, update: adminOnlyField } },
        { name: 'expiresAt', label: '게시 종료일', type: 'date', admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' } }, access: { create: adminOnlyField, update: adminOnlyField } },
      ],
    },
    {
      type: 'collapsible',
      label: '사찰 소식 노출',
      admin: { initCollapsed: true },
      fields: [
        { name: 'showInTempleNews', label: '사찰 소식에 노출', type: 'checkbox', defaultValue: false, access: { create: adminOnlyField, update: adminOnlyField } },
        { name: 'templeNewsFeatured', label: '사찰 소식 대표', type: 'checkbox', defaultValue: false, access: { create: adminOnlyField, update: adminOnlyField } },
        { name: 'templeNewsPinned', label: '사찰 소식 상단 고정', type: 'checkbox', defaultValue: false, access: { create: adminOnlyField, update: adminOnlyField } },
      ],
    },
    {
      type: 'collapsible',
      label: '작성자·승인 정보 (관리자용)',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'authorType',
          label: '작성자 구분',
          type: 'select',
          defaultValue: 'admin',
          options: [
            { label: '관리자', value: 'admin' },
            { label: '회원', value: 'member' },
          ],
          admin: { description: '글을 쓰는 사람에 따라 자동으로 정해집니다.' },
        },
        { name: 'adminAuthor', label: '작성 관리자', type: 'relationship', relationTo: 'admins' },
        { name: 'memberAuthor', label: '작성 회원', type: 'relationship', relationTo: 'members' },
        { name: 'viewCount', label: '조회수', type: 'number', defaultValue: 0, admin: { readOnly: true }, access: { create: adminOnlyField, update: adminOnlyField } },
        { name: 'hiddenAt', label: '관리자 숨김 시각', type: 'date', admin: { readOnly: true, date: { displayFormat: 'yyyy-MM-dd HH:mm' } }, access: { create: adminOnlyField, update: adminOnlyField } },
        {
          name: 'reportCount',
          label: '누적 신고 수',
          access: { create: adminOnlyField, update: adminOnlyField },
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true, components: { Cell: '@/components/admin/ReportCountCell#ReportCountCell' } },
        },
      ],
    },
    {
      type: 'collapsible',
      label: '법문·언론 보도 정보',
      admin: { initCollapsed: true },
      fields: [
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
          admin: { description: '언론 보도 게시판에서만 입력한다.' },
          fields: [
            { name: 'outlet', label: '언론사', type: 'text' },
            { name: 'reportedAt', label: '보도일', type: 'date' },
            { name: 'sourceUrl', label: '원문 URL', type: 'text' },
          ],
        },
      ],
    },
  ],
}
