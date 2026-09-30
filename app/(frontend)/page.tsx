import HeroSlider, { type HeroSlide } from "@/components/hero-slider"
import InstallationPending from "@/components/installation-pending"
import LocationSection from "@/components/location-section"
import PrayerSection, { type PrayerCard } from "@/components/prayer-section"
import TempleIntroSection from "@/components/temple-intro-section"
import SiteShell from "@/components/site-shell"
import { getHomePage, getSiteSettings } from "@/lib/payload"

// 관리자가 CMS를 수정하면 재배포 없이도 최대 60초 내에 반영되도록 ISR 적용.
export const revalidate = 60

function resolveImageUrl(image: unknown): string {
  if (image && typeof image === "object" && "url" in image && typeof image.url === "string") {
    return image.url
  }
  return ""
}

export default async function HomePage() {
  const [homePage, siteSettings] = await Promise.all([getHomePage(), getSiteSettings()])

  if (!siteSettings?.installed) {
    return (
      <SiteShell temporaryHome>
        <InstallationPending />
      </SiteShell>
    )
  }

  const slides: HeroSlide[] = (homePage?.mainSlides ?? [])
    .filter((slide) => slide.enabled !== false)
    .map((slide) => ({
      src: resolveImageUrl(slide.image),
      alt: slide.title,
      caption: slide.title,
      sub: slide.subtitle ?? "",
      desc: slide.description ?? "",
      href: slide.linkUrl ?? undefined,
    }))
    .filter((slide) => slide.src)

  const prayerCards: PrayerCard[] = (homePage?.prayerCards ?? []).map((card, i) => ({
    id: `prayer-${i}`,
    icon: card.icon ?? "calendar",
    title: card.title,
    desc: card.description ?? "",
    image: resolveImageUrl(card.image),
    href: card.linkUrl ?? "#",
  }))

  const location = siteSettings?.installed && siteSettings.location?.lat != null && siteSettings.location?.lng != null
    ? {
        lat: siteSettings.location.lat,
        lng: siteSettings.location.lng,
        mapLabel: siteSettings.location.mapLabel || siteSettings.siteShortName || siteSettings.siteName || "",
        zoomLevel: siteSettings.location.zoomLevel ?? undefined,
      }
    : undefined

  return (
    <SiteShell temporaryHome>
      <HeroSlider slides={slides} />
      <TempleIntroSection
        templeIntro={{
          title: homePage?.templeIntro?.title ?? undefined,
          summary: homePage?.templeIntro?.summary ?? undefined,
          image: resolveImageUrl(homePage?.templeIntro?.image) || undefined,
          linkUrl: homePage?.templeIntro?.linkUrl ?? undefined,
        }}
        monkIntro={{
          title: homePage?.monkIntro?.title ?? undefined,
          summary: homePage?.monkIntro?.summary ?? undefined,
          image: resolveImageUrl(homePage?.monkIntro?.image) || undefined,
          linkUrl: homePage?.monkIntro?.linkUrl ?? undefined,
        }}
        showTempleIntro={homePage?.showTempleIntro ?? true}
        showMonkIntro={homePage?.showMonkIntro ?? true}
      />
      {(homePage?.showPrayerSection ?? true) && (
        <PrayerSection cards={prayerCards.length > 0 ? prayerCards : undefined} />
      )}
      {(homePage?.showLocationSection ?? true) && <LocationSection location={location} />}
    </SiteShell>
  )
}
