import type { DefaultCellComponentProps } from 'payload'

/**
 * guide.md 12절: 신고 3건 이상이면 관리자 목록 화면에서 바로 눈에 띄도록
 * 강조 표시한다(자동 숨김/삭제는 하지 않고 식별만 돕는다).
 */
export function ReportCountCell({ cellData }: DefaultCellComponentProps) {
  const count = typeof cellData === 'number' ? cellData : 0

  if (count >= 3) {
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '4px',
          background: '#dc2626',
          color: '#fff',
          fontWeight: 600,
          fontSize: '13px',
        }}
      >
        🚨 {count}건
      </span>
    )
  }

  return <span>{count}</span>
}
