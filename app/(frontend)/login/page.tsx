import type { Metadata } from "next"
import SiteShell from "@/components/site-shell"
import LoginForm from "./login-form"

export const metadata: Metadata = { title: "로그인 | 하논봉림사", robots: { index: false, follow: false } }

export default function LoginPage() {
  return (
    <SiteShell>
      <div className="flex items-center justify-center" style={{ padding: "64px 24px" }}>
        <LoginForm />
      </div>
    </SiteShell>
  )
}
