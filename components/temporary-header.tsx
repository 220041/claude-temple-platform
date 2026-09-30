import SiteLogo, { type SiteLogoInfo } from "@/components/site-logo"

export default function TemporaryHeader({ logo }: { logo?: SiteLogoInfo }) {
  return (
    <header className="border-b border-[#e8e6e1] bg-white">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center px-8 lg:px-16">
        <SiteLogo logoUrl={logo?.logoUrl} logoAlt={logo?.logoAlt} logoTagline={logo?.logoTagline} />
      </div>
    </header>
  )
}
