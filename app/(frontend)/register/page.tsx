import SiteShell from "@/components/site-shell"
import RegisterForm from "./register-form"

export default function RegisterPage() {
  const enabled = process.env.PUBLIC_REGISTRATION_ENABLED === "true"

  return (
    <SiteShell>
      <div className="flex items-center justify-center" style={{ padding: "64px 24px" }}>
        {enabled ? (
          <RegisterForm />
        ) : (
          <div className="font-sans" style={{ maxWidth: "360px", textAlign: "center", color: "#4e4a42", fontSize: "14px", lineHeight: 1.8 }}>
            <p>공식 도메인 연결 및 이메일 발송 검증이 끝나기 전까지 공개 회원가입이 일시 중단되어 있습니다.</p>
            <p style={{ marginTop: "12px", color: "#888078", fontSize: "13px" }}>guide.md 4.2절 정책에 따른 개발 단계 제한입니다.</p>
          </div>
        )}
      </div>
    </SiteShell>
  )
}
