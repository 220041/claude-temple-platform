import type { Metadata } from "next"
import { redirect } from "next/navigation"
import SiteShell from "@/components/site-shell"
import { getCurrentMember } from "@/lib/memberAuth"
import PasswordForm from "./password-form"

export const metadata: Metadata = { title: "비밀번호 변경 | 하논봉림사", robots: { index: false, follow: false } }

export default async function PasswordPage() {
  const member = await getCurrentMember()
  if (!member) redirect("/login")

  return (
    <SiteShell>
      <div style={{ maxWidth: "420px", margin: "0 auto", padding: "64px 24px" }}>
        <h1 className="font-serif" style={{ fontSize: "24px", fontWeight: 700, color: "#161410", marginBottom: "32px" }}>
          비밀번호 변경
        </h1>
        <PasswordForm />
      </div>
    </SiteShell>
  )
}
