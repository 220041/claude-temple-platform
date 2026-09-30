import type { Metadata } from "next"
import { redirect } from "next/navigation"
import SiteShell from "@/components/site-shell"
import { getCurrentMember } from "@/lib/memberAuth"
import { generateAccountPageMetadata } from "@/lib/seo"
import ProfileForms from "./profile-forms"

export async function generateMetadata(): Promise<Metadata> {
  return generateAccountPageMetadata("회원정보 수정")
}

export default async function ProfilePage() {
  const member = await getCurrentMember()
  if (!member) redirect("/login")

  return (
    <SiteShell>
      <div style={{ maxWidth: "420px", margin: "0 auto", padding: "64px 24px" }}>
        <h1 className="font-serif" style={{ fontSize: "24px", fontWeight: 700, color: "#161410", marginBottom: "32px" }}>
          회원정보 수정
        </h1>
        <ProfileForms currentNickname={member.nickname} currentEmail={member.email} />
      </div>
    </SiteShell>
  )
}
