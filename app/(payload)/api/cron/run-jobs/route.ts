import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { purgeExpiredTrash, purgeOrphanMedia } from '@/lib/cleanup'

/**
 * guide.md 10.4/10.6/20절: Vercel Cron이 하루 한 번 호출하는 운영 정리
 * 엔드포인트. 세 가지를 한 번에 처리한다(Hobby 플랜은 cron을 하루 1개
 * 주기로만 허용해서 여러 개로 나누지 않고 여기서 순서대로 처리한다):
 *   1) 예약 발행(schedulePublish) 큐 실행 — 9단계에서 발견한, 큐를
 *      돌려줄 트리거가 없던 문제 해결.
 *   2) 30일 지난 소프트 삭제 게시물/댓글 영구정리.
 *   3) 어떤 게시물/홈페이지/팝업에도 연결되지 않은 고아 미디어 정리.
 * CRON_SECRET 환경변수로 인증한다(Vercel Cron이 설정 시 자동으로
 * `Authorization: Bearer <CRON_SECRET>` 헤더를 붙여주는 공식 컨벤션).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET이 설정되지 않았습니다.' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })

  const jobs = await payload.jobs.run()
  const trash = await purgeExpiredTrash(payload)
  const media = await purgeOrphanMedia(payload)

  return NextResponse.json({ ok: true, jobs, trash, media })
}
