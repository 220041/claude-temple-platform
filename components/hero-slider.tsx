"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

export type HeroSlide = {
  src: string
  alt: string
  caption: string
  sub: string
  desc: string
  href?: string
}

// CMS(HomePage.mainSlides)가 비어 있거나 연결에 실패했을 때만 쓰는 개발용
// 기본값. guide.md 6절: 운영 배포 전 이 기본값이 노출되지 않는지 검증한다.
const FALLBACK_SLIDES: HeroSlide[] = [
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/KakaoTalk_20260728_195210204-Flp8RFQORhTQnwadYjPwRrbvtcbND7.jpg",
    alt: "봉림사 석양 - 분홍빛 하늘과 처마 실루엣",
    caption: "마음이 고요하다. 청정하다.",
    sub: "하논에 자리한 천년수행의 도량",
    desc: "봉림사는 세상의 모든 이들을 위해 언제나 문이 열려 있습니다",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/KakaoTalk_20260728_195210204_05-Tsk6bQlYzqu2KBHeYDKzSN55TTIZSc.jpg",
    alt: "봉림사 전경 항공뷰",
    caption: "수행과 기도의 도량",
    sub: "제주 하논의 자연 속에서 고요히 마음을 쉬어 가세요.",
    desc: "",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/KakaoTalk_20260728_195210204_07-bFscndzCV7o75c3Th9LQsAXxJl5UAy.jpg",
    alt: "봉림사 야간 연등 법회",
    caption: "빛으로 피어나는 발원",
    sub: "부처님 오신 날 연등 법회",
    desc: "수백 개의 연등이 빛나는\n봉림사의 아름다운 밤입니다.",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/KakaoTalk_20260728_195526881-9da9CoY0tnAIa0zhKp8cWYinucu8dx.jpg",
    alt: "봉림사 일주문과 철쭉꽃",
    caption: "사계절 아름다운 기도 도량",
    sub: "새봄의 철쭉과 함께 봉림사로 마음을 씻으러 오세요.",
    desc: "",
  },
]

export default function HeroSlider({ slides: slidesProp }: { slides?: HeroSlide[] }) {
  const slides = slidesProp && slidesProp.length > 0 ? slidesProp : FALLBACK_SLIDES
  const [current, setCurrent] = useState(0)
  const [transitioning, setTransitioning] = useState(false)

  const goTo = useCallback((index: number) => {
    if (transitioning) return
    setTransitioning(true)
    setCurrent((index + slides.length) % slides.length)
    setTimeout(() => setTransitioning(false), 600)
  }, [transitioning])

  const prev = useCallback(() => goTo(current - 1), [current, goTo])
  const next = useCallback(() => goTo(current + 1), [current, goTo])

  useEffect(() => {
    const t = setInterval(next, 5500)
    return () => clearInterval(t)
  }, [next])

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: "clamp(380px, 54vw, 620px)" }}
      aria-label="봉림사 메인 슬라이더"
    >
      {/* 슬라이드 */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className={`object-cover ${i === current ? "hero-kenburns" : ""}`}
            priority={i === 0}
            sizes="100vw"
          />
          {/* 미황사처럼 우측 텍스트를 위한 부드러운 오버레이 */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to left, rgba(10,10,10,.72) 0%, rgba(10,10,10,.3) 45%, rgba(10,10,10,.05) 70%, transparent 100%)" }}
          />
        </div>
      ))}

      {/* 텍스트 - 미황사처럼 우측 정렬 */}
      <div
        className="absolute inset-0 z-10 flex flex-col items-end justify-center"
        style={{ paddingRight: "clamp(32px, 8vw, 120px)", paddingBottom: "24px" }}
      >
        <div style={{ maxWidth: "min(90vw, 720px)", textAlign: "right" }}>
          <h2
            className="font-serif"
            style={{
              fontSize: "clamp(28px, 3.8vw, 54px)",
              color: "#ffffff",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              marginBottom: "16px",
              textShadow: "0 2px 16px rgba(0,0,0,.4)",
            }}
          >
            {slides[current].caption}
          </h2>
          <p
            className="font-sans"
            style={{
              fontSize: "clamp(13px, 1.4vw, 15px)",
              color: "rgba(255,255,255,.7)",
              lineHeight: 1.7,
              marginBottom: "8px",
              whiteSpace: "pre-line",
            }}
          >
            {slides[current].sub}
          </p>
          <p
            className="font-sans"
            style={{
              fontSize: "clamp(12px, 1.2vw, 14px)",
              color: "rgba(255,255,255,.55)",
              lineHeight: 1.8,
              whiteSpace: "pre-line",
            }}
          >
            {slides[current].desc}
          </p>
        </div>
      </div>

      {/* 슬라이드 번호 - 미황사처럼 좌측 하단 */}
      <div
        className="absolute z-20 font-sans flex items-center gap-2"
        style={{ bottom: "28px", left: "clamp(32px, 5vw, 80px)", color: "rgba(255,255,255,.6)", fontSize: "13px", letterSpacing: "0.06em" }}
      >
        <span style={{ color: "rgba(255,255,255,.95)", fontWeight: 600 }}>{String(current + 1).padStart(2, "0")}</span>
        <span style={{ width: "28px", height: "1px", background: "rgba(255,255,255,.4)", display: "inline-block" }} />
        <span>{String(slides.length).padStart(2, "0")}</span>
      </div>

      {/* 이전/다음 버튼 - 미황사처럼 양쪽 끝, 반투명 원 없이 */}
      <button
        onClick={prev}
        className="absolute z-20 flex items-center justify-center transition-opacity"
        style={{
          left: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "44px",
          height: "44px",
          color: "rgba(255,255,255,.8)",
          opacity: 0.7,
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = "1" }}
        onMouseLeave={e => { e.currentTarget.style.opacity = "0.7" }}
        aria-label="이전 슬라이드"
      >
        <ChevronLeft style={{ width: "32px", height: "32px" }} />
      </button>
      <button
        onClick={next}
        className="absolute z-20 flex items-center justify-center transition-opacity"
        style={{
          right: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "44px",
          height: "44px",
          color: "rgba(255,255,255,.8)",
          opacity: 0.7,
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = "1" }}
        onMouseLeave={e => { e.currentTarget.style.opacity = "0.7" }}
        aria-label="다음 슬라이드"
      >
        <ChevronRight style={{ width: "32px", height: "32px" }} />
      </button>
    </section>
  )
}
