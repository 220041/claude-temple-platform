"use client"

import { useActionState } from "react"
import { updateNicknameAction, updateEmailAction, type ActionResult } from "../../actions/mypage"

const fieldStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #d0ccc5", fontSize: "14px" }
const labelStyle: React.CSSProperties = { display: "block", fontSize: "13px", color: "#4e4a42", marginBottom: "6px" }
const buttonStyle: React.CSSProperties = { padding: "10px 16px", background: "#161410", color: "#fff", fontSize: "13px", fontWeight: 500 }

export default function ProfileForms({ currentNickname, currentEmail }: { currentNickname: string; currentEmail: string }) {
  const [nicknameState, nicknameAction, nicknamePending] = useActionState<ActionResult | null, FormData>(updateNicknameAction, null)
  const [emailState, emailAction, emailPending] = useActionState<ActionResult | null, FormData>(updateEmailAction, null)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
      <form action={nicknameAction}>
        <h2 className="font-sans" style={{ fontSize: "15px", fontWeight: 600, color: "#161410", marginBottom: "12px" }}>닉네임 변경</h2>
        <div style={{ marginBottom: "12px" }}>
          <label className="font-sans" style={labelStyle}>새 닉네임 (2~20자, 30일에 1회만 변경 가능)</label>
          <input name="nickname" type="text" required minLength={2} maxLength={20} defaultValue={currentNickname} className="font-sans" style={fieldStyle} />
        </div>
        {nicknameState && "error" in nicknameState && (
          <p className="font-sans" style={{ color: "#cc5030", fontSize: "13px", marginBottom: "10px" }}>{nicknameState.error}</p>
        )}
        {nicknameState && "success" in nicknameState && (
          <p className="font-sans" style={{ color: "#2e7d32", fontSize: "13px", marginBottom: "10px" }}>닉네임이 변경되었습니다.</p>
        )}
        <button type="submit" disabled={nicknamePending} className="font-sans" style={buttonStyle}>
          {nicknamePending ? "변경 중..." : "닉네임 변경"}
        </button>
      </form>

      <form action={emailAction}>
        <h2 className="font-sans" style={{ fontSize: "15px", fontWeight: 600, color: "#161410", marginBottom: "12px" }}>이메일 변경</h2>
        <p className="font-sans" style={{ fontSize: "12px", color: "#888078", marginBottom: "12px" }}>
          현재 이메일: {currentEmail}. 변경 시 새 이메일로 재인증이 필요하며, 인증 전까지 글쓰기·댓글이 제한됩니다.
        </p>
        <div style={{ marginBottom: "12px" }}>
          <label className="font-sans" style={labelStyle}>새 이메일</label>
          <input name="email" type="email" required className="font-sans" style={fieldStyle} />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label className="font-sans" style={labelStyle}>현재 비밀번호 확인</label>
          <input name="currentPassword" type="password" required className="font-sans" style={fieldStyle} />
        </div>
        {emailState && "error" in emailState && (
          <p className="font-sans" style={{ color: "#cc5030", fontSize: "13px", marginBottom: "10px" }}>{emailState.error}</p>
        )}
        {emailState && "success" in emailState && (
          <p className="font-sans" style={{ color: "#2e7d32", fontSize: "13px", marginBottom: "10px" }}>
            이메일이 변경되었습니다. 새 이메일로 발송된 인증 링크를 확인해 주세요.
          </p>
        )}
        <button type="submit" disabled={emailPending} className="font-sans" style={buttonStyle}>
          {emailPending ? "변경 중..." : "이메일 변경"}
        </button>
      </form>
    </div>
  )
}
