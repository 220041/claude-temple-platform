import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * 관리자 대시보드 첫 화면에 최근 24시간 rate-limit 차단 건수를 보여준다.
 * 0건이면 조용히 아무것도 렌더링하지 않고, 1건이라도 있으면 눈에 띄는
 * 카드로 강조한다(신고 3건 배지와 같은 의도 — 관리자가 직접 찾아보지
 * 않아도 로그인 직후 바로 보이게).
 */
export async function RateLimitAlertCard() {
  const payload = await getPayload({ config })
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { totalDocs, docs } = await payload.find({
    collection: 'security-events',
    where: { and: [{ blocked: { equals: true } }, { createdAt: { greater_than: since } }] },
    overrideAccess: true,
    sort: '-createdAt',
    limit: 5,
  })

  if (totalDocs === 0) return null

  return (
    <div
      style={{
        margin: '16px 0',
        padding: '16px 20px',
        borderRadius: '6px',
        background: '#4a1512',
        border: '1px solid #dc2626',
        color: '#fff',
      }}
    >
      <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>
        🚨 최근 24시간 내 반복 요청 차단 {totalDocs}건
      </p>
      <p style={{ margin: '6px 0 0', fontSize: '13px', opacity: 0.85 }}>
        비밀번호 재설정/회원가입/게시물 작성 등에서 짧은 시간 안에 반복 요청이 감지되어 자동 차단되었습니다.
        운영 &gt; Security Events 컬렉션에서 상세 내역을 확인할 수 있습니다.
      </p>
      <ul style={{ margin: '10px 0 0', paddingLeft: '18px', fontSize: '12px', opacity: 0.8 }}>
        {docs.map((d) => (
          <li key={d.id}>
            {String(d.endpoint)} — {String(d.identifier)} ({new Date(d.createdAt as string).toLocaleString('ko-KR')})
          </li>
        ))}
      </ul>
    </div>
  )
}
