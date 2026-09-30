"use client"

import { useActionState } from "react"
import { resetPasswordAction, type ActionResult } from "../actions/memberAuth"

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(resetPasswordAction, null)

  if (!token) {
    return (
      <div style={{ width: "100%", maxWidth: "360px", textAlign: "center" }}>
        <p className="font-sans" style={{ color: "#cc5030", fontSize: "14px" }}>
          유효하지 않은 재설정 링크입니다. 비밀번호 찾기를 다시 시도해 주세요.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} style={{ width: "100%", maxWidth: "360px" }}>
      <h1 className="font-serif" style={{ fontSize: "28px", fontWeight: 700, color: "#161410", marginBottom: "32px", textAlign: "center" }}>
        새 비밀번호 설정
      </h1>

      <input type="hidden" name="token" value={token} />

      <div style={{ marginBottom: "16px" }}>
        <label className="font-sans" style={{ display: "block", fontSize: "13px", color: "#4e4a42", marginBottom: "6px" }}>
          새 비밀번호 (10자 이상)
        </label>
        <input
          name="password"
          type="password"
          required
          minLength={10}
          className="font-sans"
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #d0ccc5", fontSize: "14px" }}
        />
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label className="font-sans" style={{ display: "block", fontSize: "13px", color: "#4e4a42", marginBottom: "6px" }}>
          새 비밀번호 확인
        </label>
        <input
          name="passwordConfirm"
          type="password"
          required
          minLength={10}
          className="font-sans"
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #d0ccc5", fontSize: "14px" }}
        />
      </div>

      {state && "error" in state && (
        <p className="font-sans" style={{ color: "#cc5030", fontSize: "13px", marginBottom: "16px" }}>
          {state.error}
        </p>
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
