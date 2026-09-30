import HeroSlider, { type HeroSlide } from "@/components/hero-slider"
import LocationSection from "@/components/location-section"
import PrayerSection, { type PrayerCard } from "@/components/prayer-section"
import SiteShell from "@/components/site-shell"
import { getHomePage } from "@/lib/payload"

// 관리자가 CMS를 수정하면 재배포 없이도 최대 60초 내에 반영되도록 ISR 적용.
export const revalidate = 60

function resolveImageUrl(image: unknown): string {
  if (image && typeof image === "object" && "url" in image && typeof image.url === "string") {
    return image.url
  }
  return ""
}

export default async function HomePage() {
  const homePage = await getHomePage()

  const slides: HeroSlide[] = (homePage?.mainSlides ?? [])
    .filter((slide) => slide.enabled !== false)
    .map((slide) => ({
      src: resolveImageUrl(slide.image),
      alt: slide.title,
      caption: slide.title,
      sub: slide.subtitle === "한라산 하논에 자리한 천년 수행의 도량"
        ? "하논에 자리한 천년수행의 도량"
        : slide.subtitle ?? "",
      desc: slide.description === "봉황이 깃드는 숲, 봉림사는\n세상의 모든 이들을 위해 언제나 문이 열려 있습니다."
        ? "봉림사는 세상의 모든 이들을 위해 언제나 문이 열려 있습니다"
        : slide.description ?? "",
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

  return (
    <SiteShell temporaryHome>
      <HeroSlider slides={slides} />
      <PrayerSection cards={prayerCards.length > 0 ? prayerCards : undefined} />
      <LocationSection />
    </SiteShell>
  )
}
