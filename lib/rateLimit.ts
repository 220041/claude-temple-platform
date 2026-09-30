import type { PayloadRequest } from 'payload'
import { getPayloadClient } from './payload'

/**
 * 공개 엔드포인트 남용 방지(재설정 이메일 폭탄, 회원가입 봇 등). 매 시도마다
 * `security-events`에 기록을 남기고, 최근 `windowMs` 이내에 허용된
 * (blocked:false) 시도가 `max`건 이상이면 이번 시도는 차단한다. 댓글 작성
 * 제한(`collections/hooks/validateComment.ts`)과 같은 "DB에서 최근 기록을
 * 조회해 판단"하는 방식 — 서버리스 환경에서 인스턴스 간 공유되지 않는
 * 메모리 캐시 대신 이미 있는 Postgres를 그대로 쓴다.
 *
 * `max`를 생략하면 1(=windowMs 동안 1회만 허용, 쿨다운 방식)로 동작한다.
 */
export async function checkRateLimit({
  identifier,
  endpoint,
  windowMs,
  max = 1,
  req,
}: {
  identifier: string
  endpoint: string
  windowMs: number
  max?: number
  req?: PayloadRequest
}): Promise<boolean> {
  const payload = await getPayloadClient()
  const since = new Date(Date.now() - windowMs).toISOString()

  const { totalDocs } = await payload.count({
    collection: 'security-events',
    where: {
      and: [
        { identifier: { equals: identifier } },
        { endpoint: { equals: endpoint } },
        { blocked: { equals: false } },
        { createdAt: { greater_than: since } },
      ],
    },
    overrideAccess: true,
    req,
  })

  const blocked = totalDocs >= max

  await payload.create({
    collection: 'security-events',
    data: { identifier, endpoint, blocked },
    overrideAccess: true,
    req,
  })

  return !blocked
}
