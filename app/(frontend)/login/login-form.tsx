"use client"

import { useActionState } from "react"
import Link from "next/link"
import { loginAction, type ActionResult } from "../actions/memberAuth"

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(loginAction, null)

  return (
    <form action={formAction} style={{ width: "100%", maxWidth: "360px" }}>
      <h1 className="font-serif" style={{ fontSize: "28px", fontWeight: 700, color: "#161410", marginBottom: "32px", textAlign: "center" }}>
        로그인
      </h1>

      <div style={{ marginBottom: "16px" }}>
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

      <div style={{ marginBottom: "24px" }}>
        <label className="font-sans" style={{ display: "block", fontSize: "13px", color: "#4e4a42", marginBottom: "6px" }}>
          비밀번호
        </label>
        <input
          name="password"
          type="password"
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
        {pending ? "로그인 중..." : "로그인"}
      </button>

      <div className="font-sans" style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "#888078", display: "flex", justifyContent: "center", gap: "12px" }}>
        <Link href="/register" style={{ color: "#161410" }}>
          회원가입
        </Link>
        <span>·</span>
        <Link href="/forgot-password" style={{ color: "#161410" }}>
          비밀번호를 잊으셨나요?
        </Link>
      </div>
    </form>
  )
}
