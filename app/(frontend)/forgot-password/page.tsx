import type { Metadata } from "next"
import SiteShell from "@/components/site-shell"
import ForgotPasswordForm from "./forgot-password-form"

export const metadata: Metadata = { title: "비밀번호 재설정 | 하논봉림사", robots: { index: false, follow: false } }

export default function ForgotPasswordPage() {
  return (
    <SiteShell>
      <div className="flex items-center justify-center" style={{ padding: "64px 24px" }}>
        <ForgotPasswordForm />
      </div>
    </SiteShell>
  )
}
