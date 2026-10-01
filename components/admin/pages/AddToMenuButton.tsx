'use client'

import { useState } from 'react'
import { useDocumentInfo, useFormModified } from '@payloadcms/ui'

type Status = { kind: 'success' } | { kind: 'error'; message: string } | null

/**
 * 메뉴 편집 화면 → 새 페이지 만들기(CreateLinkedPageButton.tsx)의 반대
 * 방향 — 이미 만든 페이지를 나중에 메뉴에 연결한다. 새 페이지를 만드는
 * 게 아니라 기존 페이지를 메뉴에 연결하는 행위라 라벨에 "만들기"는
 * 쓰지 않는다. 성공해도 자동으로 새 탭을 열지 않는다(반대쪽 플로우는
 * 새 페이지 편집 화면으로 자동 이동하지만, 여기서는 페이지 편집 중인
 * 화면을 그대로 유지하는 쪽이 자연스럽다).
 */
export function AddToMenuButton() {
  const { id } = useDocumentInfo()
  const modified = useFormModified()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<Status>(null)

  if (id === undefined) {
    return (
      <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--theme-elevation-500, #888078)' }}>
        페이지를 먼저 저장해야 메뉴에 추가할 수 있습니다.
      </p>
    )
  }

  const handleClick = async () => {
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch('/api/pages/add-to-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || '메뉴에 추가하지 못했습니다.')
      setStatus({ kind: 'success' })
    } catch (e) {
      setStatus({ kind: 'error', message: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ margin: '0 0 16px' }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || modified}
        title={modified ? '저장한 뒤 다시 시도하세요.' : undefined}
        style={{
          padding: '8px 14px',
          borderRadius: '4px',
          border: '1px solid var(--theme-elevation-200, #d7d0c4)',
          background: 'var(--theme-input-bg, #fff)',
          fontSize: '13px',
          cursor: loading || modified ? 'default' : 'pointer',
          opacity: modified ? 0.5 : 1,
        }}
      >
        {loading ? '추가하는 중...' : '메뉴에 추가'}
      </button>
      {modified && (
        <p style={{ color: 'var(--theme-elevation-500, #888078)', fontSize: '13px', marginTop: '6px' }}>
          저장하지 않은 변경사항이 있습니다. 저장한 뒤 다시 시도하세요.
        </p>
      )}
      {status?.kind === 'error' && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px' }}>{status.message}</p>}
      {status?.kind === 'success' && (
        <p style={{ color: '#16a34a', fontSize: '13px', marginTop: '6px' }}>
          상단 메뉴에 추가했습니다.{' '}
          <a href="/admin/globals/main-menu" target="_blank" rel="noopener noreferrer">
            메뉴 편집 화면 열기
          </a>
        </p>
      )}
    </div>
  )
}
