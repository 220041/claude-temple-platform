import type { Metadata } from "next"
import SiteShell from "@/components/site-shell"
import ResetPasswordForm from "./reset-password-form"

export const metadata: Metadata = { title: "비밀번호 재설정 | 하논봉림사", robots: { index: false, follow: false } }

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
