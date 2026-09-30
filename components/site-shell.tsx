import Header from "@/components/header"
import TemporaryHeader from "@/components/temporary-header"
import SiteNotice from "@/components/site-notice"
import Footer, { type FooterInfo, type FooterBrand } from "@/components/footer"
import { getFooterSettings, getMainMenu, getSiteSettings } from "@/lib/payload"
import { getCurrentMemberCached } from "@/lib/memberAuth"
import { buildMenuTree } from "@/lib/menuLink"

function resolveLogoUrl(logo: unknown): string | undefined {
  if (logo && typeof logo === "object" && "url" in logo && typeof logo.url === "string") {
    return logo.url
  }
  return undefined
}

/** 모든 프런트엔드 페이지가 반복하던 Header/Footer + 세션·설정 조회를 한 곳에 모은다. */
export default async function SiteShell({ children, temporaryHome = false }: { children: React.ReactNode; temporaryHome?: boolean }) {
  const [footerSettings, siteSettings, mainMenu, member] = await Promise.all([
    getFooterSettings(),
    getSiteSettings(),
    getMainMenu(),
    getCurrentMemberCached(),
  ])

  const topMenuItems = buildMenuTree(mainMenu, 'top')
  const bottomMenuItems = buildMenuTree(mainMenu, 'bottom')

  const footerInfo: Partial<FooterInfo> | undefined = footerSettings
    ? {
        address: footerSettings.address ?? undefined,
        phone: footerSettings.phone ?? undefined,
        fax: footerSettings.fax ?? undefined,
        email: footerSettings.email ?? undefined,
        copyrightText: footerSettings.copyrightText ?? undefined,
      }
    : undefined

  const installed = Boolean(siteSettings?.installed)
  const logo = {
    logoUrl: installed ? resolveLogoUrl(siteSettings?.logo) : undefined,
    logoAlt: installed ? siteSettings?.logoAlt ?? undefined : undefined,
    logoTagline: installed ? siteSettings?.logoTagline ?? undefined : undefined,
  }
  const brand: FooterBrand = {
    shortName: installed ? siteSettings?.siteShortName ?? undefined : undefined,
    nameEn: installed ? siteSettings?.siteNameEn ?? undefined : undefined,
    affiliation: installed ? siteSettings?.affiliation ?? undefined : undefined,
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#ffffff" }}>
      <SiteNotice />
      {temporaryHome ? (
        <TemporaryHeader logo={logo} />
      ) : (
        <Header memberNickname={member?.nickname} logo={{ ...logo, siteShortName: brand.shortName }} menuItems={topMenuItems} />
      )}
      <main className="flex-1">{children}</main>
      <Footer footerInfo={footerInfo} temporaryHome={temporaryHome} brand={brand} menuItems={bottomMenuItems} />
    </div>
  )
}
