"use client"

import { useActionState } from "react"
import { changePasswordAction, type ActionResult } from "../../actions/mypage"

const fieldStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #d0ccc5", fontSize: "14px" }
const labelStyle: React.CSSProperties = { display: "block", fontSize: "13px", color: "#4e4a42", marginBottom: "6px" }

export default function PasswordForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(changePasswordAction, null)

  return (
    <form action={formAction}>
      <div style={{ marginBottom: "14px" }}>
        <label className="font-sans" style={labelStyle}>현재 비밀번호</label>
        <input name="currentPassword" type="password" required className="font-sans" style={fieldStyle} />
      </div>
      <div style={{ marginBottom: "14px" }}>
        <label className="font-sans" style={labelStyle}>새 비밀번호 (10자 이상)</label>
        <input name="newPassword" type="password" required minLength={10} className="font-sans" style={fieldStyle} />
      </div>
      <div style={{ marginBottom: "20px" }}>
        <label className="font-sans" style={labelStyle}>새 비밀번호 확인</label>
        <input name="newPasswordConfirm" type="password" required minLength={10} className="font-sans" style={fieldStyle} />
      </div>

      {state && "error" in state && (
        <p className="font-sans" style={{ color: "#cc5030", fontSize: "13px", marginBottom: "16px" }}>{state.error}</p>
      )}
      {state && "success" in state && (
        <p className="font-sans" style={{ color: "#2e7d32", fontSize: "13px", marginBottom: "16px" }}>비밀번호가 변경되었습니다.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="font-sans"
        style={{ width: "100%", padding: "12px", background: "#161410", color: "#fff", fontSize: "14px", fontWeight: 500 }}
      >
        {pending ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  )
}
