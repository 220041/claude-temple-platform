import type { Metadata } from "next"
import SiteShell from "@/components/site-shell"
import { generateAccountPageMetadata } from "@/lib/seo"
import ForgotPasswordForm from "./forgot-password-form"

export async function generateMetadata(): Promise<Metadata> {
  return generateAccountPageMetadata("비밀번호 재설정")
}

export default function ForgotPasswordPage() {
  return (
    <SiteShell>
      <div className="flex items-center justify-center" style={{ padding: "64px 24px" }}>
        <ForgotPasswordForm />
      </div>
    </SiteShell>
  )
}
