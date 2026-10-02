"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, Menu, X } from "lucide-react"
import { logoutAction } from "@/app/(frontend)/actions/memberAuth"
import SiteLogo, { type SiteLogoInfo } from "@/components/site-logo"
import type { ResolvedMenuLink } from "@/lib/menuLink"

// 홈/통합검색은 UI 액션 링크라 코드에 두고, 그 사이의 바로가기 링크는
// 사찰마다 달라 MainMenu.utilityLinks(관리자 설정)에서 받는다.
function buildTopLinks(siteShortName: string | undefined, utilityLinks: { label: string; href: string }[]) {
  return [
    { label: siteShortName || "홈", href: "#hero" },
    ...utilityLinks,
    { label: "통합검색", href: "/search" },
  ]
}

export default function Header({
  memberNickname,
  logo,
  menuItems,
  utilityLinks = [],
}: {
  memberNickname?: string | null
  logo?: SiteLogoInfo & { siteShortName?: string }
  menuItems: ResolvedMenuLink[]
  utilityLinks?: { label: string; href: string }[]
}) {
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<number | null>(null)
  const topLinks = buildTopLinks(logo?.siteShortName, utilityLinks)

  return (
    <header className="relative z-50 bg-white">
      {/* 상단 유틸리티 바 — 2번 스타일: 좌측 3개 링크 + 우측 로그인/회원가입 */}
      <div style={{ borderBottom: "1px solid #e8e6e1" }}>
        <div className="max-w-[1280px] mx-auto px-8 lg:px-16 flex items-center justify-between" style={{ height: "36px" }}>
          <nav className="flex items-center" style={{ gap: "24px" }}>
            {topLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="font-sans transition-colors"
                style={{ fontSize: "12px", color: "#656058", letterSpacing: "0.02em" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#161410" }}
                onMouseLeave={e => { e.currentTarget.style.color = "#656058" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center" style={{ gap: "20px" }}>
            {memberNickname ? (
              <>
                <Link href="/mypage" className="font-sans transition-colors" style={{ fontSize: "12px", color: "#888078" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#3a3730" }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#888078" }}>
                  {memberNickname}님
                </Link>
                <form action={logoutAction}>
                  <button type="submit" className="font-sans transition-colors" style={{ fontSize: "12px", color: "#888078", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#3a3730" }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#888078" }}>
                    로그아웃
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="font-sans transition-colors" style={{ fontSize: "12px", color: "#888078" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#3a3730" }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#888078" }}>
                  로그인
                </Link>
                <Link href="/register" className="font-sans transition-colors" style={{ fontSize: "12px", color: "#888078" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#3a3730" }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#888078" }}>
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 메인 헤더 — 1번 스타일: 로고 + 우측 메뉴 */}
      <div
        className="max-w-[1280px] mx-auto px-8 lg:px-16 flex items-center justify-between"
        style={{ height: "80px" }}
      >
        <div className="flex-shrink-0">
          <SiteLogo logoUrl={logo?.logoUrl} logoAlt={logo?.logoAlt} logoTagline={logo?.logoTagline} />
        </div>

        {/* 데스크탑 네비게이션 */}
        <nav className="hidden lg:flex items-center justify-end" aria-label="주 메뉴">
          {menuItems.map((item, i) => {
            const hasChildren = item.children.length > 0
            const visibleChildren = item.children.filter((child) => child.href)
            return (
              <div
                key={i}
                className="relative"
                onMouseEnter={() => setOpenMenu(i)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <div
                  className="flex items-center gap-1 font-sans font-medium"
                  style={{
                    padding: "28px 20px",
                    fontSize: "15px",
                    color: openMenu === i ? "var(--color-accent)" : "#1a1a1a",
                    letterSpacing: "0.01em",
                  }}
                >
                  {item.href ? (
                    <Link href={item.href} className="transition-colors">
                      {item.label}
                    </Link>
                  ) : (
                    <span>{item.label}</span>
                  )}
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => setOpenMenu(openMenu === i ? null : i)}
                      aria-expanded={openMenu === i}
                      aria-haspopup="true"
                      aria-label={`${item.label} 하위 메뉴 펼치기`}
                      style={{ display: "flex", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                    >
                      <ChevronDown
                        className="transition-transform duration-200"
                        style={{
                          width: "13px",
                          height: "13px",
                          opacity: 0.5,
                          transform: openMenu === i ? "rotate(180deg)" : "rotate(0)",
                        }}
                      />
                    </button>
                  )}
                </div>

                {/* 2차 메뉴 — 2번 스타일: 항목 아래 좁은 박스형 드롭다운 */}
                {hasChildren && openMenu === i && (
                  <div
                    className="absolute top-full left-1/2 z-40"
                    style={{
                      transform: "translateX(-50%)",
                      width: "176px",
                      background: "#fff",
                      border: "1px solid #e8e6e1",
                      boxShadow: "0 10px 24px rgba(22,20,16,0.12)",
                    }}
                  >
                    {visibleChildren.map((child, j) => (
                      <Link
                        key={j}
                        href={child.href as string}
                        className="block font-sans transition-colors"
                        style={{
                          padding: "12px 20px",
                          fontSize: "13px",
                          color: "#4e4a42",
                          borderBottom: j < visibleChildren.length - 1 ? "1px solid #f5f4f2" : "none",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#fdfbf8"; e.currentTarget.style.color = "#161410" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4e4a42" }}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* 모바일 메뉴 버튼 */}
        <button
          className="lg:hidden"
          style={{ color: "#1a1a1a" }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
        >
          {mobileOpen ? <X style={{ width: "22px", height: "22px" }} /> : <Menu style={{ width: "22px", height: "22px" }} />}
        </button>
      </div>

      {/* 하단 경계선 */}
      <div style={{ borderBottom: "1px solid #e8e6e1" }} />

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <div className="lg:hidden bg-white" style={{ borderTop: "1px solid #e8e6e1" }}>
          {menuItems.map((item, i) => {
            const hasChildren = item.children.length > 0
            const visibleChildren = item.children.filter((child) => child.href)
            return (
              <div key={i} style={{ borderBottom: "1px solid #f5f4f2" }}>
                <div
                  className="w-full flex items-center justify-between font-sans font-medium"
                  style={{ padding: "15px 24px", fontSize: "15px", color: "#1a1a1a" }}
                >
                  {item.href ? (
                    <Link href={item.href} className="flex-1">{item.label}</Link>
                  ) : (
                    <span className="flex-1">{item.label}</span>
                  )}
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => setMobileExpanded(mobileExpanded === i ? null : i)}
                      aria-expanded={mobileExpanded === i}
                      aria-label={`${item.label} 하위 메뉴 펼치기`}
                      style={{ background: "none", border: "none", padding: "4px", cursor: "pointer", display: "flex" }}
                    >
                      <ChevronDown style={{
                        width: "14px", height: "14px", color: "var(--color-accent)",
                        transform: mobileExpanded === i ? "rotate(180deg)" : "rotate(0)",
                        transition: "transform .2s",
                      }} />
                    </button>
                  )}
                </div>
                {hasChildren && mobileExpanded === i && (
                  <div style={{ background: "#fdfbf8" }}>
                    {visibleChildren.map((child, j) => (
                      <Link key={j} href={child.href as string} className="block font-sans"
                        style={{ padding: "12px 40px", fontSize: "14px", color: "#555", borderTop: "1px solid #eee" }}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </header>
  )
}
