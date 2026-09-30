import type { Metadata } from 'next'
import { getBoardByKey, getPostDetail } from './boards'
import { getSiteSettings } from './payload'

/** 미설치 상태(설정이 비어있음)에서 사찰명을 노출하지 않기 위한 범용 대체 이름. */
const UNCONFIGURED_SITE_NAME = '사찰 홈페이지'

async function resolveSiteName(): Promise<string> {
  const settings = await getSiteSettings()
  if (!settings?.installed) return UNCONFIGURED_SITE_NAME
  // 기존 하드코딩 SITE_NAME='하논봉림사'는 정식 명칭이었다 — 짧은 이름(헤더 브랜드용)보다
  // 정식 명칭을 우선해 <title> 접미사가 이전과 동일하게 유지되게 한다.
  return settings.siteName || settings.siteShortName || UNCONFIGURED_SITE_NAME
}

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

/**
 * 로그인·마이페이지 등 비색인 계정 관리 페이지 제목. 모두 동일하게
 * `robots: noindex`이므로 페이지마다 제목 문자열만 넘겨 재사용한다.
 */
export async function generateAccountPageMetadata(title: string): Promise<Metadata> {
  const siteName = await resolveSiteName()
  return { title: `${title} | ${siteName}`, robots: { index: false, follow: false } }
}

/** 게시판 목록 페이지(공지사항 등) 메타데이터. 게시판별로 고정이라 정적으로 계산한다. */
export async function generateBoardListMetadata(boardKey: string): Promise<Metadata> {
  const [board, siteName] = await Promise.all([getBoardByKey(boardKey), resolveSiteName()])
  const title = board ? `${board.displayName} | ${siteName}` : siteName
  return { title }
}

/**
 * 게시물 상세 페이지 메타데이터. 비밀글은 guide.md 9.3절 취지에 따라
 * 제목·내용을 노출하지 않고 검색엔진 색인도 막는다(noindex).
 */
export async function generatePostMetadata(boardKey: string, id: string): Promise<Metadata> {
  const [result, siteName] = await Promise.all([getPostDetail(boardKey, id), resolveSiteName()])
  if (!result) return { title: siteName }

  const { board, post } = result

  if (post.visibility === 'secret') {
    return {
      title: `비밀글입니다 | ${board.displayName} | ${siteName}`,
      robots: { index: false, follow: false },
    }
  }

  const imageUrl = resolveImageUrl(post.featuredImage)

  return {
    title: `${post.title} | ${board.displayName} | ${siteName}`,
    description: excerpt(post.content),
    openGraph: {
      title: post.title,
      description: excerpt(post.content),
      type: 'article',
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
  }
}
