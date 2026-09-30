import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import SiteShell from "@/components/site-shell"
import { getCurrentMember } from "@/lib/memberAuth"

export const metadata: Metadata = { title: "마이페이지 | 하논봉림사", robots: { index: false, follow: false } }

const STATUS_LABEL: Record<string, string> = {
  pending: "이메일 인증 대기",
  active: "정상 이용",
  suspended: "이용 정지",
  withdrawn: "탈퇴",
}

const menuItemStyle: React.CSSProperties = {
  display: "block",
  padding: "16px",
  border: "1px solid #e5e1d8",
  color: "#161410",
  textDecoration: "none",
}

export default async function MyPage() {
  const member = await getCurrentMember()
  if (!member) redirect("/login")

  return (
    <SiteShell>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "64px 24px" }}>
        <h1 className="font-serif" style={{ fontSize: "28px", fontWeight: 700, color: "#161410", marginBottom: "24px" }}>
          마이페이지
        </h1>

        <div className="font-sans" style={{ border: "1px solid #e5e1d8", padding: "20px", marginBottom: "32px", fontSize: "14px", color: "#4e4a42" }}>
          <p style={{ marginBottom: "6px" }}>
            <strong style={{ color: "#161410" }}>{member.nickname}</strong> 님
          </p>
          <p style={{ marginBottom: "6px" }}>이메일: {member.email}</p>
          <p>상태: {STATUS_LABEL[member.status ?? "pending"] ?? member.status}</p>
        </div>

        <div className="font-sans" style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
          <Link href="/mypage/profile" style={menuItemStyle}>회원정보 수정 (닉네임 / 이메일)</Link>
          <Link href="/mypage/password" style={menuItemStyle}>비밀번호 변경</Link>
          <Link href="/mypage/posts" style={menuItemStyle}>내가 쓴 글</Link>
          <Link href="/mypage/comments" style={menuItemStyle}>내가 쓴 댓글</Link>
          <Link href="/mypage/withdraw" style={{ ...menuItemStyle, color: "#cc5030" }}>회원 탈퇴</Link>
        </div>
      </div>
    </SiteShell>
  )
}
