import { Fragment } from "react"
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

function resolveImageFocal(image: unknown): { focalX?: number; focalY?: number } {
  if (!image || typeof image !== "object") return {}
  const focalX = "focalX" in image && typeof image.focalX === "number" ? image.focalX : undefined
  const focalY = "focalY" in image && typeof image.focalY === "number" ? image.focalY : undefined
  return { focalX, focalY }
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
      ...resolveImageFocal(slide.image),
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

  // 표시 여부는 기존 체크박스(show*)가 그대로 담당하고, sectionOrder는
  // "보일 섹션들을 어떤 순서로 배치할지"만 결정한다 — 두 개념을 하나의
  // 필드로 합치면 관리자 입장에서 "순서 목록에서 뺐는데 체크박스는
  // 켜져 있다" 같은 혼동이 생긴다.
  const sectionRenderers: Record<string, React.ReactNode> = {
    templeIntro: (
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
    ),
    prayer: (homePage?.showPrayerSection ?? true) ? (
      <PrayerSection cards={prayerCards.length > 0 ? prayerCards : undefined} />
    ) : null,
    location: (homePage?.showLocationSection ?? true) ? <LocationSection location={location} /> : null,
  }

  const sectionOrder = (homePage?.sectionOrder ?? [])
    .map((row) => row.section)
    .filter((key): key is NonNullable<typeof key> => Boolean(key))
  const orderedKeys: string[] = sectionOrder.length > 0 ? sectionOrder : ["templeIntro", "prayer", "location"]

  return (
    <SiteShell temporaryHome={!siteSettings.homepageReady}>
      <HeroSlider slides={slides} />
      {orderedKeys.map((key) => (
        <Fragment key={key}>{sectionRenderers[key]}</Fragment>
      ))}
    </SiteShell>
  )
}
