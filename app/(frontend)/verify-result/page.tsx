import Link from "next/link"
import SiteShell from "@/components/site-shell"

export default async function VerifyResultPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const success = status === "success"

  return (
    <SiteShell>
      <div className="flex items-center justify-center" style={{ padding: "64px 24px" }}>
        <div className="font-sans" style={{ maxWidth: "380px", textAlign: "center" }}>
          <h1 className="font-serif" style={{ fontSize: "24px", fontWeight: 700, color: "#161410", marginBottom: "16px" }}>
            {success ? "이메일 인증이 완료되었습니다" : "인증에 실패했습니다"}
          </h1>
          <p style={{ fontSize: "14px", color: "#4e4a42", lineHeight: 1.8, marginBottom: "24px" }}>
            {success
              ? "이제 로그인하여 이용하실 수 있습니다."
              : "인증 링크가 만료되었거나 잘못된 링크입니다. 로그인 화면에서 인증 메일을 다시 요청해 주세요."}
          </p>
          <Link href="/login" className="font-sans" style={{ display: "inline-block", padding: "10px 24px", background: "#161410", color: "#fff", fontSize: "14px" }}>
            로그인하러 가기
          </Link>
        </div>
      </div>
    </SiteShell>
  )
}
