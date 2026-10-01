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
  // 관리자가 미디어 업로드 화면에서 지정한 초점(Payload 기본 제공 focal
  // point 편집기, 0~100 퍼센트) — 전체 화면 배너로 크게 잘릴 때 인물/
  // 현판처럼 중요한 부분이 가운데가 아니어도 잘리지 않게 한다.
  focalX?: number
  focalY?: number
}

export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0)
  const [transitioning, setTransitioning] = useState(false)

  const goTo = useCallback((index: number) => {
    if (transitioning || slides.length === 0) return
    setTransitioning(true)
    setCurrent((index + slides.length) % slides.length)
    setTimeout(() => setTransitioning(false), 600)
  }, [transitioning, slides.length])

  const prev = useCallback(() => goTo(current - 1), [current, goTo])
  const next = useCallback(() => goTo(current + 1), [current, goTo])

  useEffect(() => {
    if (slides.length === 0) return
    const t = setInterval(next, 5500)
    return () => clearInterval(t)
  }, [next, slides.length])

  // HomePage.mainSlides가 비어 있으면(설정 전/설치 미완료) 아무 사찰의
  // 슬라이드도 대신 보여주지 않는다 — 빈 영역을 그대로 남긴다.
  if (slides.length === 0) return null

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
            style={
              slide.focalX != null && slide.focalY != null
                ? { objectPosition: `${slide.focalX}% ${slide.focalY}%` }
                : undefined
            }
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
