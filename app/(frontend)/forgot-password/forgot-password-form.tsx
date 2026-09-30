"use client"

import { useActionState } from "react"
import Link from "next/link"
import { forgotPasswordAction, type ActionResult } from "../actions/memberAuth"

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(forgotPasswordAction, null)

  if (state && "success" in state) {
    return (
      <div style={{ width: "100%", maxWidth: "360px", textAlign: "center" }}>
        <h1 className="font-serif" style={{ fontSize: "24px", fontWeight: 700, color: "#161410", marginBottom: "16px" }}>
          메일을 확인해 주세요
        </h1>
        <p className="font-sans" style={{ fontSize: "14px", color: "#4e4a42", lineHeight: 1.7 }}>
          입력하신 이메일이 가입된 계정과 일치하면 비밀번호 재설정 링크를 보내드렸습니다.
          <br />
          링크는 30분간 유효합니다.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} style={{ width: "100%", maxWidth: "360px" }}>
      <h1 className="font-serif" style={{ fontSize: "28px", fontWeight: 700, color: "#161410", marginBottom: "16px", textAlign: "center" }}>
        비밀번호 찾기
      </h1>
      <p className="font-sans" style={{ fontSize: "13px", color: "#888078", marginBottom: "24px", textAlign: "center" }}>
        가입하신 이메일을 입력하시면 재설정 링크를 보내드립니다.
      </p>

      <div style={{ marginBottom: "24px" }}>
        <label className="font-sans" style={{ display: "block", fontSize: "13px", color: "#4e4a42", marginBottom: "6px" }}>
          이메일
        </label>
        <input
          name="email"
          type="email"
          required
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
        {pending ? "전송 중..." : "재설정 링크 받기"}
      </button>

      <div className="font-sans" style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "#888078" }}>
        <Link href="/login" style={{ color: "#161410" }}>
          로그인으로 돌아가기
        </Link>
      </div>
    </form>
  )
}
