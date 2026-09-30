"use client"

import { useActionState, useState } from "react"
import { createReportAction, type ActionResult } from "@/app/(frontend)/actions/reports"

const REASONS = [
  { value: "ad", label: "광고·홍보" },
  { value: "abuse", label: "욕설·비방" },
  { value: "illegal", label: "음란·불법 콘텐츠" },
  { value: "privacy", label: "개인정보 노출" },
  { value: "spam", label: "도배" },
  { value: "conflict", label: "종교·정치 분쟁 유도" },
  { value: "other", label: "기타" },
]

export default function ReportButton({ target, targetId, isLoggedIn }: { target: "posts" | "comments"; targetId: string; isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    createReportAction.bind(null, target, targetId),
    null,
  )

  if (!isLoggedIn) return null

  if (state && "success" in state) {
    return (
      <span className="font-sans" style={{ fontSize: "12px", color: "#888078" }}>
        신고가 접수되었습니다.
      </span>
    )
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="font-sans" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#888078" }}>
        신고
      </button>
    )
  }

  return (
    <form action={formAction} className="font-sans" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
      <select name="reason" required style={{ fontSize: "12px", border: "1px solid #d0ccc5", padding: "2px 4px" }}>
        <option value="">사유 선택</option>
        {REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <button type="submit" disabled={pending} style={{ color: "#cc5030", background: "none", border: "none", cursor: "pointer" }}>
        신고하기
      </button>
      <button type="button" onClick={() => setOpen(false)} style={{ color: "#888078", background: "none", border: "none", cursor: "pointer" }}>
        취소
      </button>
      {state && "error" in state && <span style={{ color: "#cc5030" }}>{state.error}</span>}
    </form>
  )
}
