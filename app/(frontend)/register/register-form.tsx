"use client"

import { useActionState } from "react"
import Link from "next/link"
import { registerAction, type ActionResult } from "../actions/memberAuth"

const fieldStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #d0ccc5", fontSize: "14px" }
const labelStyle: React.CSSProperties = { display: "block", fontSize: "13px", color: "#4e4a42", marginBottom: "6px" }

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(registerAction, null)

  return (
    <form action={formAction} style={{ width: "100%", maxWidth: "380px" }}>
      <h1 className="font-serif" style={{ fontSize: "28px", fontWeight: 700, color: "#161410", marginBottom: "32px", textAlign: "center" }}>
        회원가입
      </h1>

      <div style={{ marginBottom: "14px" }}>
        <label className="font-sans" style={labelStyle}>이메일</label>
        <input name="email" type="email" required className="font-sans" style={fieldStyle} />
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label className="font-sans" style={labelStyle}>비밀번호 (10자 이상)</label>
        <input name="password" type="password" required minLength={10} className="font-sans" style={fieldStyle} />
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label className="font-sans" style={labelStyle}>닉네임 (2~20자)</label>
        <input name="nickname" type="text" required minLength={2} maxLength={20} className="font-sans" style={fieldStyle} />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label className="font-sans" style={labelStyle}>실명</label>
        <input name="realName" type="text" required className="font-sans" style={fieldStyle} />
        <p className="font-sans" style={{ fontSize: "12px", color: "#888078", marginTop: "4px" }}>
          실명은 관리자만 확인하며 공개되지 않습니다.
        </p>
      </div>

      <div className="font-sans" style={{ fontSize: "13px", color: "#4e4a42", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
        <label style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <input type="checkbox" name="agreeTerms" required style={{ marginTop: "3px" }} />
          <span>
            <Link href="/pages/terms" target="_blank" style={{ textDecoration: "underline" }}>이용약관</Link>에 동의합니다.
          </span>
        </label>
        <label style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <input type="checkbox" name="agreePrivacy" required style={{ marginTop: "3px" }} />
          <span>
            <Link href="/pages/privacy" target="_blank" style={{ textDecoration: "underline" }}>개인정보처리방침</Link>에 동의합니다.
          </span>
        </label>
        <label style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <input type="checkbox" name="agreeBoardPolicy" required style={{ marginTop: "3px" }} />
          <span>
            <Link href="/pages/board-policy" target="_blank" style={{ textDecoration: "underline" }}>게시판 운영정책</Link>에 동의합니다.
          </span>
        </label>
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
        {pending ? "가입 처리 중..." : "가입하기"}
      </button>
    </form>
  )
}
