import SiteShell from "@/components/site-shell"

export default function RegisterDonePage() {
  return (
    <SiteShell>
      <div className="flex items-center justify-center" style={{ padding: "64px 24px" }}>
        <div className="font-sans" style={{ maxWidth: "380px", textAlign: "center" }}>
          <h1 className="font-serif" style={{ fontSize: "24px", fontWeight: 700, color: "#161410", marginBottom: "16px" }}>
            가입 신청이 완료되었습니다
          </h1>
          <p style={{ fontSize: "14px", color: "#4e4a42", lineHeight: 1.8 }}>
            입력하신 이메일로 인증 메일을 보냈습니다. 메일의 링크를 눌러 인증을 완료해야 로그인과 글쓰기를 이용할 수 있습니다.
          </p>
        </div>
      </div>
    </SiteShell>
  )
}
