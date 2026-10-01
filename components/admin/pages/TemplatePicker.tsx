'use client'

import { useState } from 'react'
import { useForm, useFormFields } from '@payloadcms/ui'

/**
 * 새 페이지가 블록 0개로 시작해 관리자가 어떤 블록을 어떻게 조합해야
 * 하는지 스스로 알아내야 하는 문제를 줄인다 — 미리 구성된 블록 조합을
 * 선택하면 빈 입력란이 채워진 상태로 시작한다(blocks/pageBlocks.ts의
 * 5종 블록 중 자주 쓰는 조합). blocks 필드에 이미 내용이 있으면(기존
 * 페이지 편집) 표시하지 않는다.
 */
const TEMPLATES: { label: string; blockTypes: string[] }[] = [
  { label: '사찰 소개', blockTypes: ['heading', 'paragraph', 'photo'] },
  { label: '오시는 길', blockTypes: ['heading', 'infoTable', 'photo'] },
  { label: '사진 모음', blockTypes: ['heading', 'gallery'] },
]

export function TemplatePicker() {
  const { addFieldRow } = useForm()
  const blockRowCount = useFormFields(([fields]) => fields.blocks?.rows?.length ?? 0)
  const [dismissed, setDismissed] = useState(false)

  if (blockRowCount > 0 || dismissed) return null

  const applyTemplate = (blockTypes: string[]) => {
    blockTypes.forEach((blockType, rowIndex) => {
      addFieldRow({ path: 'blocks', schemaPath: 'blocks', blockType, rowIndex })
    })
    setDismissed(true)
  }

  return (
    <div
      style={{
        margin: '0 0 16px',
        padding: '16px 20px',
        borderRadius: '6px',
        background: 'var(--theme-elevation-50, #f5f4f2)',
        border: '1px solid var(--theme-elevation-150, #e0ded9)',
      }}
    >
      <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: '14px' }}>어떤 페이지를 만들까요?</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {TEMPLATES.map((template) => (
          <button
            key={template.label}
            type="button"
            onClick={() => applyTemplate(template.blockTypes)}
            style={{
              padding: '8px 14px',
              borderRadius: '4px',
              background: 'var(--theme-input-bg, #fff)',
              border: '1px solid var(--theme-elevation-200, #d7d0c4)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {template.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            padding: '8px 14px',
            borderRadius: '4px',
            background: 'var(--theme-input-bg, #fff)',
            border: '1px solid var(--theme-elevation-200, #d7d0c4)',
            fontSize: '13px',
            cursor: 'pointer',
            color: 'var(--theme-elevation-500, #888078)',
          }}
        >
          빈 페이지로 시작
        </button>
      </div>
    </div>
  )
}
