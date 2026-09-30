import Header from "@/components/header"
import TemporaryHeader from "@/components/temporary-header"
import SiteNotice from "@/components/site-notice"
import Footer, { type FooterInfo } from "@/components/footer"
import { getFooterSettings } from "@/lib/payload"
import { getCurrentMemberCached } from "@/lib/memberAuth"

/** 모든 프런트엔드 페이지가 반복하던 Header/Footer + 세션·설정 조회를 한 곳에 모은다. */
export default async function SiteShell({ children, temporaryHome = false }: { children: React.ReactNode; temporaryHome?: boolean }) {
  const [footerSettings, member] = await Promise.all([getFooterSettings(), getCurrentMemberCached()])

  const footerInfo: Partial<FooterInfo> | undefined = footerSettings
    ? {
        address: footerSettings.address ?? undefined,
        phone: footerSettings.phone ?? undefined,
        fax: footerSettings.fax ?? undefined,
        email: footerSettings.email ?? undefined,
        copyrightText: footerSettings.copyrightText ?? undefined,
      }
    : undefined

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#ffffff" }}>
      <SiteNotice />
      {temporaryHome ? <TemporaryHeader /> : <Header memberNickname={member?.nickname} />}
      <main className="flex-1">{children}</main>
      <Footer footerInfo={footerInfo} temporaryHome={temporaryHome} />
    </div>
  )
}
