"use client"

import Image from "next/image"
import Link from "next/link"

export type IntroBlock = {
  title: string
  summary: string
  image: string
  linkUrl: string
}

export default function TempleIntroSection({
  templeIntro,
  monkIntro,
  showTempleIntro = true,
  showMonkIntro = true,
}: {
  templeIntro?: Partial<IntroBlock>
  monkIntro?: Partial<IntroBlock>
  showTempleIntro?: boolean
  showMonkIntro?: boolean
}) {
  const intro =
    showTempleIntro && templeIntro?.title && templeIntro?.image
      ? { title: templeIntro.title, summary: templeIntro.summary ?? "", image: templeIntro.image, linkUrl: templeIntro.linkUrl ?? "#" }
      : undefined
  const monk =
    showMonkIntro && monkIntro?.title && monkIntro?.image
      ? { title: monkIntro.title, summary: monkIntro.summary ?? "", image: monkIntro.image, linkUrl: monkIntro.linkUrl ?? "#" }
      : undefined

  if (!intro && !monk) return null

  return (
    <section aria-label="사찰 주요 소개" style={{ borderBottom: "1px solid #e8e6e1", background: "#ffffff" }}>
      {/* 봉림사 소개 — 2번 스타일: 이미지-좌측 / 텍스트-우측, 풀블리드 스플릿 */}
      {intro && <div className="grid lg:grid-cols-2" style={{ minHeight: "520px" }}>
        <div className="relative" style={{ minHeight: "320px" }}>
          <Image
            src={intro.image}
            alt="봉림사 대웅전과 단청 처마"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <div className="flex items-center" style={{ padding: "64px 48px" }}>
          <div style={{ maxWidth: "420px" }}>
            <p className="font-sans" style={{ fontSize: "12px", letterSpacing: "0.3em", color: "#888078", marginBottom: "12px" }}>
              01 · 봉림사 소개
            </p>
            <h2
              className="font-serif"
              style={{ fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 700, color: "#161410", lineHeight: 1.3, marginBottom: "24px", whiteSpace: "pre-line" }}
            >
              {intro.title}
            </h2>
            <div style={{ width: "48px", height: "1px", background: "#cc5030", marginBottom: "24px" }} />
            <p className="font-sans" style={{ fontSize: "14px", color: "#4e4a42", lineHeight: 1.9, marginBottom: "32px", whiteSpace: "pre-line" }}>
              {intro.summary}
            </p>
            <Link
              href={intro.linkUrl || "#"}
              className="inline-flex items-center transition-colors"
              style={{ gap: "8px", fontSize: "14px", fontWeight: 500, color: "#272520" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#cc5030" }}
              onMouseLeave={e => { e.currentTarget.style.color = "#272520" }}
            >
              <span style={{ borderBottom: "1px solid currentColor", paddingBottom: "2px" }}>봉림사 역사 자세히 보기</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>}

      {/* 회주·주지 스님 행장 — 2번 스타일 유지, 텍스트는 우측 정렬 */}
      {monk && <div className="grid lg:grid-cols-2" style={{ minHeight: "520px" }}>
        <div
          className="flex items-center order-2 lg:order-1"
          style={{ padding: "64px 48px", background: "#fdfbf8", justifyContent: "flex-end" }}
        >
          <div style={{ maxWidth: "420px", textAlign: "right" }}>
            <p className="font-sans" style={{ fontSize: "12px", letterSpacing: "0.3em", color: "#888078", marginBottom: "12px" }}>
              03 · 회주·주지 스님
            </p>
            <h2
              className="font-serif"
              style={{ fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 700, color: "#161410", lineHeight: 1.3, marginBottom: "24px", whiteSpace: "pre-line" }}
            >
              {monk.title}
            </h2>
            <div style={{ width: "48px", height: "1px", background: "#cc5030", marginBottom: "24px", marginLeft: "auto" }} />
            <p className="font-sans" style={{ fontSize: "14px", color: "#4e4a42", lineHeight: 1.9, marginBottom: "32px", whiteSpace: "pre-line" }}>
              {monk.summary}
            </p>
            <Link
              href={monk.linkUrl || "#"}
              className="inline-flex items-center transition-colors"
              style={{ gap: "8px", fontSize: "14px", fontWeight: 500, color: "#272520", justifyContent: "flex-end" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#cc5030" }}
              onMouseLeave={e => { e.currentTarget.style.color = "#272520" }}
            >
              <span style={{ borderBottom: "1px solid currentColor", paddingBottom: "2px" }}>스님 행장 자세히 보기</span>
              <span>→</span>
            </Link>
          </div>
        </div>
        <div className="relative order-1 lg:order-2" style={{ minHeight: "320px" }}>
          <Image
            src={monk.image}
            alt="봉림사 스님 예불 장면"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>}
    </section>
  )
}
