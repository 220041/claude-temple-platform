import type { Block } from 'payload'

/**
 * guide.md 5.2: 정적 페이지 허용 블록 — 제목, 문단, 사진, 갤러리, 안내표.
 * 관리자가 임의 CSS/script/iframe/HTML 원문을 넣을 수 없도록 서식 없는
 * 텍스트 필드만 사용한다(리치텍스트/HTML 입력 금지).
 */

export const HeadingBlock: Block = {
  slug: 'heading',
  labels: { singular: '제목', plural: '제목' },
  imageURL: '/admin-blocks/heading.svg',
  imageAltText: '제목 블록 미리보기',
  fields: [
    { name: 'text', label: '내용', type: 'text', required: true },
    {
      name: 'level',
      label: '크기',
      type: 'select',
      defaultValue: 'h2',
      options: [
        { label: '큰 제목', value: 'h2' },
        { label: '중간 제목', value: 'h3' },
      ],
    },
  ],
}

export const ParagraphBlock: Block = {
  slug: 'paragraph',
  labels: { singular: '문단', plural: '문단' },
  imageURL: '/admin-blocks/paragraph.svg',
  imageAltText: '문단 블록 미리보기',
  fields: [{ name: 'text', label: '내용', type: 'textarea', required: true }],
}

export const PhotoBlock: Block = {
  slug: 'photo',
  labels: { singular: '사진', plural: '사진' },
  imageURL: '/admin-blocks/photo.svg',
  imageAltText: '사진 블록 미리보기',
  fields: [
    {
      name: 'image',
      label: '사진',
      type: 'upload',
      relationTo: 'media-public',
      required: true,
      admin: { description: '사진이 필요합니다. 사진이 없으면 이 블록 오른쪽의 "…" 메뉴에서 블록을 삭제한 뒤 게시하세요.' },
    },
    { name: 'caption', label: '설명', type: 'text' },
  ],
}

export const GalleryBlock: Block = {
  slug: 'gallery',
  labels: { singular: '갤러리', plural: '갤러리' },
  imageURL: '/admin-blocks/gallery.svg',
  imageAltText: '갤러리 블록 미리보기',
  fields: [
    {
      name: 'images',
      label: '사진 목록',
      labels: { singular: '사진', plural: '사진' },
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'image', label: '사진', type: 'upload', relationTo: 'media-public', required: true },
        { name: 'caption', label: '설명', type: 'text' },
      ],
    },
  ],
}

export const InfoTableBlock: Block = {
  slug: 'infoTable',
  labels: { singular: '안내표', plural: '안내표' },
  imageURL: '/admin-blocks/infotable.svg',
  imageAltText: '안내표 블록 미리보기',
  fields: [
    {
      name: 'rows',
      label: '행',
      labels: { singular: '행', plural: '행' },
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'label', label: '항목', type: 'text', required: true },
        { name: 'value', label: '내용', type: 'text', required: true },
      ],
    },
  ],
}

export const pageBlocks: Block[] = [HeadingBlock, ParagraphBlock, PhotoBlock, GalleryBlock, InfoTableBlock]
