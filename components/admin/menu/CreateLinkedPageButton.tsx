'use client'

import { useCallback, useState } from 'react'
import { useFieldPath, useForm } from '@payloadcms/ui'

/**
 * "새 페이지 만들기"가 선택됐을 때만 보이는 ui 필드. 클릭하면
 * /api/menu/create-linked-page를 호출해 초안 Pages 문서를 만들고,
 * 같은 메뉴 항목 행의 linkType을 'page'로, pageRef를 새 문서 id로
 * 즉시 바꿔치기한다 — linkType:'newPage' 자체는 저장되지 않는다.
 */
export function CreateLinkedPageButton() {
  const path = useFieldPath()
  const rowPath = path.split('.').slice(0, -1).join('.')
  const { dispatchFields } = useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/menu/create-linked-page', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || '페이지를 만들지 못했습니다.')

      dispatchFields({ type: 'UPDATE', path: `${rowPath}.linkType`, value: 'page', valid: true })
      dispatchFields({ type: 'UPDATE', path: `${rowPath}.pageRef`, value: data.id, valid: true })

      window.open(`/admin/collections/pages/${data.id}`, '_blank', 'noopener,noreferrer')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [dispatchFields, rowPath])

  return (
    <div style={{ marginTop: '8px', marginBottom: '8px' }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          padding: '8px 14px',
          borderRadius: '4px',
          border: '1px solid var(--theme-elevation-200, #d7d0c4)',
          background: 'var(--theme-input-bg, #fff)',
          fontSize: '13px',
          cursor: loading ? 'default' : 'pointer',
        }}
      >
        {loading ? '만드는 중...' : '새 페이지 만들기 실행'}
      </button>
      {error && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px' }}>{error}</p>}
    </div>
  )
}
