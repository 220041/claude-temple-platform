import { getPayload } from 'payload'
import config from '@payload-config'
import type { Board, Member } from '@/payload-types'

/**
 * Stage 3: 승인대기(memberPostApproval:requiresApproval) 게시판에 올라온
 * 회원 글은 Posts.access.read가 목록 조회에서는 관리자에게도 걸러낸다
 * (hiddenAt과 동일한 기존 관례) — 그래서 이 카드가 overrideAccess:true로
 * 직접 조회해 유일한 발견 경로를 제공한다. 실제 승인/반려는 여기서 바로
 * 처리하지 않고 Payload 기본 문서 편집 화면(딥링크)에서 moderationStatus
 * 필드를 바꿔 저장하는 것으로 끝낸다 — 별도 API를 만들지 않는다.
 */
export async function ModerationQueueCard() {
  const payload = await getPayload({ config })

  const { totalDocs, docs } = await payload.find({
    collection: 'posts',
    where: { moderationStatus: { equals: 'pending' } },
    overrideAccess: true,
    sort: '-createdAt',
    limit: 10,
    depth: 1,
  })

  if (totalDocs === 0) return null

  return (
    <div
      style={{
        margin: '16px 0',
        padding: '16px 20px',
        borderRadius: '6px',
        background: '#1e3a2f',
        border: '1px solid #16a34a',
        color: '#fff',
      }}
    >
      <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>📝 승인 대기 중인 회원 게시물 {totalDocs}건</p>
      <ul style={{ margin: '10px 0 0', paddingLeft: '18px', fontSize: '13px' }}>
        {docs.map((d) => (
          <li key={d.id}>
            <a href={`/admin/collections/posts/${d.id}`} style={{ color: '#fff', textDecoration: 'underline' }}>
              {d.title}
            </a>
            {' — '}
            {(d.board as Board)?.displayName ?? '게시판'} · {(d.memberAuthor as Member)?.nickname ?? '회원'}
          </li>
        ))}
      </ul>
    </div>
  )
}
