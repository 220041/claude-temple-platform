import type { Metadata } from "next"
import { redirect } from "next/navigation"
import SiteShell from "@/components/site-shell"
import { getCurrentMember } from "@/lib/memberAuth"
import { generateAccountPageMetadata } from "@/lib/seo"
import WithdrawForm from "./withdraw-form"

export async function generateMetadata(): Promise<Metadata> {
  return generateAccountPageMetadata("회원 탈퇴")
}

export default async function WithdrawPage() {
  const member = await getCurrentMember()
  if (!member) redirect("/login")

  return (
    <SiteShell>
      <div style={{ maxWidth: "420px", margin: "0 auto", padding: "64px 24px" }}>
        <h1 className="font-serif" style={{ fontSize: "24px", fontWeight: 700, color: "#161410", marginBottom: "24px" }}>
          회원 탈퇴
        </h1>

        <div className="font-sans" style={{ border: "1px solid #e5e1d8", padding: "16px", marginBottom: "24px", fontSize: "13px", color: "#4e4a42", lineHeight: 1.7 }}>
          <p style={{ marginBottom: "8px" }}>탈퇴 전 아래 내용을 확인해 주세요.</p>
          <ul style={{ paddingLeft: "18px", listStyle: "disc" }}>
            <li>탈퇴 후 로그인 및 게시글·댓글 작성이 불가능합니다.</li>
            <li>기존에 작성한 게시글과 댓글은 삭제되지 않고 그대로 남으며, 작성자 표시는 &quot;탈퇴한 회원&quot;으로 바뀝니다. 직접 삭제를 원하면 탈퇴 전에 미리 삭제해 주세요.</li>
            <li>실명·이메일 등 개인정보는 즉시 비식별 처리됩니다.</li>
          </ul>
        </div>

        <WithdrawForm />
      </div>
    </SiteShell>
  )
}
