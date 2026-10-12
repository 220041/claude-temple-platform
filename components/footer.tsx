"use client"

import Link from "next/link"
import type { ResolvedMenuLink } from "@/lib/menuLink"

export type FooterInfo = {
  address: string
  phone: string
  fax: string
  email: string
  copyrightText: string
  tagline: string
}

// CMS(FooterSettings) 조회가 실패했을 때만 쓰는 타입 안전장치용 기본값.
// 특정 사찰의 실제 연락처를 담지 않는다 — 콘텐츠 폴백이 아니다.
const FALLBACK_FOOTER: FooterInfo = {
  address: "",
  phone: "",
  fax: "",
  email: "",
  copyrightText: "ALL RIGHTS RESERVED.",
  tagline: "",
}

export type FooterBrand = { shortName?: string; nameEn?: string; affiliation?: string }

export default function Footer({
  footerInfo,
  temporaryHome = false,
  brand,
  menuItems = [],
}: {
  footerInfo?: Partial<FooterInfo>
  temporaryHome?: boolean
  brand?: FooterBrand
  menuItems?: ResolvedMenuLink[]
}) {
  const info = { ...FALLBACK_FOOTER, ...footerInfo }
  const shortName = brand?.shortName || "사찰"
  const nameEn = brand?.nameEn?.toUpperCase()
  const affiliation = brand?.affiliation

  if (temporaryHome) {
    return (
      <footer className="bg-[#4f4f4f] text-[#d1d1d1]">
        <div className="mx-auto max-w-[1280px] px-8 pb-10 pt-12 lg:px-16">
          <Link href="/" className="mb-8 inline-block leading-none">
            {affiliation && <span className="block font-sans text-[9px] tracking-[0.15em]">{affiliation}</span>}
            <span className="mt-1 block font-serif text-2xl font-bold tracking-[0.05em] text-white">{shortName}</span>
            {nameEn && <span className="mt-1 block font-sans text-[9px] tracking-[0.3em] text-[#969696]">{nameEn}</span>}
          </Link>

          <address className="grid gap-6 font-sans not-italic sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {[
              { label: "주소", value: info.address },
              { label: "전화", value: info.phone },
              { label: "팩스", value: info.fax },
              { label: "이메일", value: info.email },
            ]
              .filter(({ value }) => Boolean(value))
              .map(({ label, value }) => (
              <div key={label}>
                <span className="mb-2 block text-xs text-[#aaa]">{label}</span>
                <span className="block whitespace-pre-line break-words text-[13px] leading-6 text-[#eee]">{value}</span>
              </div>
            ))}
          </address>

          <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-5 font-sans text-xs text-[#aaa] sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; {new Date().getFullYear()} {shortName}. {info.copyrightText}</p>
            {info.tagline && <p className="font-serif text-[13px] text-[#d1d1d1]">{info.tagline}</p>}
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer>
      {/* 메인 푸터 - 구성은 1번, 배경/폰트 색상은 buddhism.or.kr 기준 */}
      <div style={{ background: "#4f4f4f", color: "#d1d1d1" }}>
        <div className="max-w-[1280px] mx-auto px-8 lg:px-16" style={{ paddingTop: "64px", paddingBottom: "40px" }}>

          <div className="grid lg:grid-cols-5 gap-10">
            {/* 사찰 정보 */}
            <div className="lg:col-span-1">
              <Link href="/" className="block mb-6">
                {affiliation && (
                  <span className="font-sans block" style={{ fontSize: "9px", color: "#d1d1d1", letterSpacing: "0.15em", marginBottom: "6px" }}>{affiliation}</span>
                )}
                <span className="font-serif block font-bold" style={{ fontSize: "24px", color: "#ffffff", letterSpacing: "0.05em" }}>{shortName}</span>
                {nameEn && (
                  <span className="font-sans block" style={{ fontSize: "9px", color: "#969696", letterSpacing: "0.3em", marginTop: "4px" }}>{nameEn}</span>
                )}
              </Link>
              <address className="font-sans not-italic" style={{ fontSize: "13px", color: "#d1d1d1", lineHeight: 1.9 }}>
                <p style={{ whiteSpace: "pre-line" }}>{info.address}</p>
                <p style={{ marginTop: "10px" }}>
                  전화: {info.phone}<br />
                  팩스: {info.fax}
                </p>
                <p style={{ marginTop: "10px" }}>이메일: {info.email}</p>
              </address>
            </div>

            {/* 메뉴 링크 */}
            {menuItems.map((group, i) => (
              <div key={i}>
                {group.href ? (
                  <Link
                    href={group.href}
                    className="font-sans font-semibold transition-colors"
                    style={{ display: "block", fontSize: "13px", color: "#d1d1d1", marginBottom: "16px", letterSpacing: "0.04em" }}
                  >
                    {group.label}
                  </Link>
                ) : (
                  <h4 className="font-sans font-semibold" style={{ fontSize: "13px", color: "#d1d1d1", marginBottom: "16px", letterSpacing: "0.04em" }}>
                    {group.label}
                  </h4>
                )}
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {group.children.filter((link) => link.href).map((link, j) => (
                    <li key={j} style={{ marginBottom: "10px" }}>
                      <Link
                        href={link.href as string}
                        className="font-sans transition-colors"
                        style={{ fontSize: "13px", color: "#969696" }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#ffffff" }}
                        onMouseLeave={e => { e.currentTarget.style.color = "#969696" }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* 하단 카피라이트 */}
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-sans"
            style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,.12)", fontSize: "12px", color: "#969696" }}
          >
            <p>&copy; {new Date().getFullYear()} {shortName}. {info.copyrightText}</p>
            {info.tagline && <p className="font-serif" style={{ fontSize: "13px", color: "#d1d1d1", letterSpacing: "0.05em" }}>{info.tagline}</p>}
          </div>
        </div>
      </div>
    </footer>
  )
}
