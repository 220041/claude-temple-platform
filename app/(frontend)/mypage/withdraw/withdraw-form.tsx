"use client"

import { useActionState } from "react"
import { withdrawAction, type ActionResult } from "../../actions/mypage"

const fieldStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #d0ccc5", fontSize: "14px" }
const labelStyle: React.CSSProperties = { display: "block", fontSize: "13px", color: "#4e4a42", marginBottom: "6px" }

export default function WithdrawForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(withdrawAction, null)

  return (
    <form action={formAction}>
      <div style={{ marginBottom: "20px" }}>
        <label className="font-sans" style={labelStyle}>비밀번호 확인</label>
        <input name="currentPassword" type="password" required className="font-sans" style={fieldStyle} />
      </div>

      {state && "error" in state && (
        <p className="font-sans" style={{ color: "#cc5030", fontSize: "13px", marginBottom: "16px" }}>{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="font-sans"
        style={{ width: "100%", padding: "12px", background: "#cc5030", color: "#fff", fontSize: "14px", fontWeight: 500 }}
      >
        {pending ? "처리 중..." : "탈퇴하기"}
      </button>
    </form>
  )
}
