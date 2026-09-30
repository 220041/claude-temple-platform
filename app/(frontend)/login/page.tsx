import type { Metadata } from "next"
import SiteShell from "@/components/site-shell"
import { generateAccountPageMetadata } from "@/lib/seo"
import LoginForm from "./login-form"

export async function generateMetadata(): Promise<Metadata> {
  return generateAccountPageMetadata("로그인")
}

export default function LoginPage() {
  return (
    <SiteShell>
      <div className="flex items-center justify-center" style={{ padding: "64px 24px" }}>
        <LoginForm />
      </div>
    </SiteShell>
  )
}
