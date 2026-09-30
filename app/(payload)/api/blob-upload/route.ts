import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { getCurrentMember } from '@/lib/memberAuth'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

/**
 * guide.md 10.2/10.7절: Vercel 서버리스 함수는 요청 본문이 4.5MB로
 * 고정 제한돼 있어(플랜 무관), 회원이 이미지를 서버 경유로 직접
 * 업로드하는 기존 방식은 10MB 파일에서 항상 413으로 실패한다(10단계
 * Preview 배포에서 확정 재검증). 그래서 클라이언트가 이 엔드포인트로
 * 발급받은 토큰으로 Vercel Blob에 "임시 스테이징" 파일을 직접
 * 올리고(요청이 우리 서버를 거치지 않으므로 크기 제한 없음), 서버는
 * 그 결과 URL만 작은 텍스트로 전달받는다. 실제 검증(MIME/시그니처)과
 * EXIF 제거, 최종 media-private 저장은 여전히 서버에서 한다
 * (app/(frontend)/actions/posts.ts) — 이 임시 파일은 처리 후 곧바로
 * 삭제되므로 검증되지 않은 원본이 오래 남아있지 않는다.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN_PUBLIC,
      onBeforeGenerateToken: async () => {
        const member = await getCurrentMember()
        if (!member || member.status !== 'active') {
          throw new Error('로그인이 필요합니다.')
        }
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
          addRandomSuffix: true,
        }
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '업로드 준비에 실패했습니다.' }, { status: 400 })
  }
}
