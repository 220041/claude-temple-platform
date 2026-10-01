'use client'

import { useDocumentInfo, useFormModified } from '@payloadcms/ui'

/**
 * "임시 저장됨 / 아직 공개되지 않음 / 홈페이지에 반영됨"을 한눈에
 * 구분해서 보여준다(검토 문서 §6). 상단의 Status 뱃지(Draft/Published)는
 * 이미 Payload 기본 화면에 있지만, 저장하지 않은 변경사항이 있는지는
 * 별도로 표시하지 않고 영문이라 비개발자에게는 상태 구분이 어렵다.
 */
export function StatusBadge() {
  const { hasPublishedDoc, data } = useDocumentInfo()
  const modified = useFormModified()

  if (modified) {
    return (
      <p style={{ margin: '0 0 16px', padding: '10px 14px', borderRadius: '4px', background: '#4a3312', border: '1px solid #d97706', color: '#fff', fontSize: '13px' }}>
        ⚠️ 저장하지 않은 변경사항이 있습니다.
      </p>
    )
  }

  if (!hasPublishedDoc) {
    return (
      <p style={{ margin: '0 0 16px', padding: '10px 14px', borderRadius: '4px', background: 'var(--theme-elevation-50, #f5f4f2)', border: '1px solid var(--theme-elevation-150, #e0ded9)', fontSize: '13px' }}>
        📝 초안 상태입니다 — 아직 홈페이지에 공개되지 않았습니다.
      </p>
    )
  }

  const slug = typeof data?.slug === 'string' ? data.slug : undefined

  return (
    <p style={{ margin: '0 0 16px', padding: '10px 14px', borderRadius: '4px', background: '#1e3a2f', border: '1px solid #16a34a', color: '#fff', fontSize: '13px' }}>
      ✅ 홈페이지에 공개되어 있습니다.
      {slug && (
        <>
          {' '}
          <a href={`/pages/${slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>
            공개 화면 열기
          </a>
        </>
      )}
    </p>
  )
}
