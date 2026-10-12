/**
 * 관리자 대시보드 첫 화면에 자주 쓰는 작업 바로가기를 링크 카드로
 * 보여준다. Payload 기본 컬렉션 목록 대시보드를 대체하지 않고 그 위에
 * 얹는 형태 — RateLimitAlertCard와 같은 beforeDashboard 슬롯을 쓴다.
 * 전체 작업 중심 대시보드로의 교체는 이번 범위 밖이다.
 */
const ACTIONS: { label: string; description: string; href: string; superAdminOnly?: boolean }[] = [
  { label: '공지 쓰기', description: '공지사항 게시물 작성', href: '/admin/collections/posts/create' },
  { label: '페이지 수정', description: '기존 정적 페이지 편집', href: '/admin/collections/pages' },
  { label: '메인 사진 바꾸기', description: '홈페이지 슬라이드·소개 이미지 편집', href: '/admin/globals/home-page' },
  { label: '팝업 올리기', description: '홈페이지 팝업 설정', href: '/admin/globals/popup-settings' },
  { label: '게시판 만들기', description: '새 게시판 등록(최고관리자 전용)', href: '/admin/collections/boards/create', superAdminOnly: true },
]

export function QuickActionsCard({ user }: { user?: { role?: string } | null }) {
  const actions = ACTIONS.filter((a) => !a.superAdminOnly || user?.role === 'super-admin')
  return (
    <div
      style={{
        margin: '16px 0',
        padding: '16px 20px',
        borderRadius: '6px',
        background: 'var(--theme-elevation-50, #f5f4f2)',
        border: '1px solid var(--theme-elevation-150, #e0ded9)',
      }}
    >
      <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: '14px' }}>자주 하는 작업</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {actions.map((action) => (
          <a
            key={action.href}
            href={action.href}
            title={action.description}
            style={{
              display: 'inline-block',
              padding: '8px 14px',
              borderRadius: '4px',
              background: 'var(--theme-input-bg, #fff)',
              border: '1px solid var(--theme-elevation-200, #d7d0c4)',
              fontSize: '13px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            {action.label}
          </a>
        ))}
      </div>
    </div>
  )
}
