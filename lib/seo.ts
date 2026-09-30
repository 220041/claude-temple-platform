import type { Metadata } from 'next'
import { getBoardByKey, getPostDetail } from './boards'

const SITE_NAME = '하논봉림사'

function excerpt(content: string, length = 120): string {
  const plain = content.replace(/\s+/g, ' ').trim()
  return plain.length > length ? `${plain.slice(0, length)}…` : plain
}

/**
 * featuredImage는 relationTo: ['media-public','media-private'] 폴리모픽
 * 업로드 필드라 값이 { relationTo, value } 형태로 감싸져 있다
 * (components/board/post-detail.tsx의 resolveImageUrl과 동일한 함정).
 */
function resolveImageUrl(image: unknown): string | undefined {
  if (!image || typeof image !== 'object') return undefined
  const target = 'value' in image ? (image as { value: unknown }).value : image
  if (target && typeof target === 'object' && 'url' in target && typeof (target as { url?: unknown }).url === 'string') {
    return (target as { url: string }).url
  }
  return undefined
}

/** 게시판 목록 페이지(공지사항 등) 메타데이터. 게시판별로 고정이라 정적으로 계산한다. */
export async function generateBoardListMetadata(boardKey: string): Promise<Metadata> {
  const board = await getBoardByKey(boardKey)
  const title = board ? `${board.displayName} | ${SITE_NAME}` : SITE_NAME
  return { title }
}

/**
 * 게시물 상세 페이지 메타데이터. 비밀글은 guide.md 9.3절 취지에 따라
 * 제목·내용을 노출하지 않고 검색엔진 색인도 막는다(noindex).
 */
export async function generatePostMetadata(boardKey: string, id: string): Promise<Metadata> {
  const result = await getPostDetail(boardKey, id)
  if (!result) return { title: SITE_NAME }

  const { board, post } = result

  if (post.visibility === 'secret') {
    return {
      title: `비밀글입니다 | ${board.displayName} | ${SITE_NAME}`,
      robots: { index: false, follow: false },
    }
  }

  const imageUrl = resolveImageUrl(post.featuredImage)

  return {
    title: `${post.title} | ${board.displayName} | ${SITE_NAME}`,
    description: excerpt(post.content),
    openGraph: {
      title: post.title,
      description: excerpt(post.content),
      type: 'article',
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
  }
}
