import type { CollectionConfig, Where } from 'payload'

import { validateAndStripImage } from './hooks/validateAndStripImage'

const isAdmin = (user: { collection?: string } | null) => Boolean(user && user.collection === 'admins')

/**
 * guide.md 10.1/10.3: 파일 스트리밍 엔드포인트(app.../api/media-private/file/...)는
 * access.read에 문서 id가 아니라 filename만 넘기고, 반환값이 boolean이
 * 아니라 조건(Where)이면 그 조건과 filename을 결합해 문서를 찾는다. 즉
 * "이 이미지가 어떤 게시물에 쓰였는지"처럼 다른 컬렉션과의 조인이 필요한
 * 조건은 Where로 표현할 수 없다. 그래서 Posts 저장 시점에 게시물의
 * 공개 상태를 이 컬렉션에 그대로 복제해 둔다(hooks/syncPostImageVisibility.ts).
 */
const canReadMedia: NonNullable<CollectionConfig['access']>['read'] = ({ req: { user }, id }) => {
  if (isAdmin(user)) return true

  if (user && user.collection === 'members') {
    const where: Where = { or: [{ isPublic: { equals: true } }, { ownerMember: { equals: user.id } }] }
    return where
  }

  if (id !== undefined) {
    return { isPublic: { equals: true } }
  }

  const where: Where = { isPublic: { equals: true } }
  return where
}

/**
 * guide.md 10.1: 일반회원이 업로드한 모든 이미지(자유게시판, 봉림풍경
 * 포토갤러리, 봉림사 이야기, 감로당) 전용 저장소.
 *
 * Vercel Blob은 스토어 단위의 진짜 비공개 접근 제어를 지원하지 않고 모든
 * blob이 추측 불가능한 공개 URL을 가지므로(공식 문서 기준), 이 컬렉션의
 * 실제 접근 통제는 애플리케이션 계층에서 수행한다. payload.config.ts의
 * 스토리지 플러그인 설정에서 이 컬렉션은 disablePayloadAccessControl을
 * 켜지 않았으므로, 문서의 url 필드는 원본 blob CDN 주소가 아니라 Payload
 * 내장 /api/media-private/file/... 엔드포인트를 가리킨다. 그 엔드포인트가
 * 매 요청마다 access.read를 검사한 뒤에만 blob에서 파일을 가져와
 * 스트리밍하므로, 원본 CDN URL은 클라이언트에 노출되지 않는다.
 */
export const MediaPrivate: CollectionConfig = {
  slug: 'media-private',
  labels: { singular: '비공개 파일', plural: '비공개 파일' },
  admin: {
    group: '미디어',
  },
  access: {
    read: canReadMedia,
    create: ({ req: { user } }) => Boolean(user && (user.collection === 'admins' || user.collection === 'members')),
    update: ({ req: { user }, id }) => {
      if (isAdmin(user)) return true
      if (!user || user.collection !== 'members' || id === undefined) return false
      return { uploadedBy: { equals: user.id } }
    },
    delete: ({ req: { user }, id }) => {
      if (isAdmin(user)) return true
      if (!user || user.collection !== 'members' || id === undefined) return false
      return { uploadedBy: { equals: user.id } }
    },
  },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 400,
        fit: 'cover',
      },
    ],
    resizeOptions: {
      width: 2560,
      height: 2560,
      fit: 'inside',
      withoutEnlargement: true,
    },
  },
  hooks: {
    beforeOperation: [validateAndStripImage],
    beforeChange: [
      ({ data, operation, req: { user } }) => {
        if (operation === 'create' && user && user.collection === 'members') {
          data.uploadedBy = user.id
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'alt', label: '대체 텍스트', type: 'text', admin: { description: '사진 내용을 한 줄로 설명하는 글입니다. 비워 두어도 됩니다.' } },
    { name: 'uploadedBy', label: '올린 회원', type: 'relationship', relationTo: 'members', admin: { readOnly: true } },
    // 아래 두 필드는 이 파일이 쓰인 게시물의 공개 상태를 복제한 값이며
    // hooks/syncPostImageVisibility.ts가 Posts 저장 시 채운다. 어느 게시물
    //에도 아직 연결되지 않은 신규 업로드는 기본적으로 비공개(false)다.
    { name: 'isPublic', label: '공개 여부', type: 'checkbox', defaultValue: false, admin: { readOnly: true } },
    { name: 'ownerMember', label: '소유 회원', type: 'relationship', relationTo: 'members', admin: { readOnly: true } },
  ],
}
