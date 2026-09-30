import type { Metadata } from "next"
import SiteShell from "@/components/site-shell"
import { generateAccountPageMetadata } from "@/lib/seo"
import ResetPasswordForm from "./reset-password-form"

export async function generateMetadata(): Promise<Metadata> {
  return generateAccountPageMetadata("비밀번호 재설정")
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams

  return (
    <SiteShell>
      <div className="flex items-center justify-center" style={{ padding: "64px 24px" }}>
        <ResetPasswordForm token={token ?? ""} />
      </div>
    </SiteShell>
  )
}
