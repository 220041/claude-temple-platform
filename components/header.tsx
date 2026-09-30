"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, Menu, X } from "lucide-react"
import { logoutAction } from "@/app/(frontend)/actions/memberAuth"

const topLinks = [
  { label: "봉림사", href: "#hero" },
  { label: "기도·법회", href: "/pages/prayer-info" },
  { label: "오시는 길", href: "/pages/location" },
  { label: "통합검색", href: "/search" },
]

const navItems = [
  {
    label: "봉림사 소개",
    children: [
      { label: "봉림사 역사", href: "/pages/temple-history" },
      { label: "언론 속 봉림사", href: "/press" },
      { label: "오시는 길", href: "/pages/location" },
    ],
  },
  {
    label: "기도 · 법회",
    children: [
      { label: "연중기도", href: "#" },
      { label: "관음42수주기도", href: "#" },
      { label: "어린이·청소년 법회", href: "#" },
    ],
  },
  {
    label: "회주·주지스님",
    children: [
      { label: "행장", href: "/pages/monk-biography" },
      { label: "법문", href: "/dharma" },
      { label: "포토갤러리", href: "/gallery/monks" },
    ],
  },
  {
    label: "봉림 풍경",
    children: [
      { label: "공지사항", href: "/notices" },
      { label: "감로당", href: "/stories/gamrodang" },
      { label: "포토갤러리", href: "/gallery/scenery" },
      { label: "자유게시판", href: "/community" },
    ],
  },
]

export default function Header({ memberNickname }: { memberNickname?: string | null }) {
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<number | null>(null)

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
        {/* 로고 */}
        <Link href="/" className="flex-shrink-0 flex flex-col items-center leading-none gap-1.5">
          <span className="font-sans" style={{ fontSize: "11px", color: "#aaa", letterSpacing: "0.12em" }}>하논에 깃든 사찰</span>
          <Image
            src="/images/logo-combined.png"
            alt="대한불교조계종 봉림사 Bonglimsa"
            width={357}
            height={63}
            style={{ height: "40px", width: "auto" }}
            priority
          />
        </Link>

        {/* 데스크탑 네비게이션 */}
        <nav className="hidden lg:flex items-center justify-end" aria-label="주 메뉴">
          {navItems.map((item, i) => (
            <div
              key={i}
              className="relative"
              onMouseEnter={() => setOpenMenu(i)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <button
                className="flex items-center gap-1 font-sans font-medium transition-colors"
                style={{
                  padding: "28px 20px",
                  fontSize: "15px",
                  color: openMenu === i ? "#9b6b3f" : "#1a1a1a",
                  letterSpacing: "0.01em",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                aria-expanded={openMenu === i}
                aria-haspopup="true"
              >
                {item.label}
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

              {/* 2차 메뉴 — 2번 스타일: 항목 아래 좁은 박스형 드롭다운 */}
              {openMenu === i && (
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
                  {item.children.map((child, j) => (
                    <Link
                      key={j}
                      href={child.href}
                      className="block font-sans transition-colors"
                      style={{
                        padding: "12px 20px",
                        fontSize: "13px",
                        color: "#4e4a42",
                        borderBottom: j < item.children.length - 1 ? "1px solid #f5f4f2" : "none",
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
          ))}
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
          {navItems.map((item, i) => (
            <div key={i} style={{ borderBottom: "1px solid #f5f4f2" }}>
              <button
                className="w-full flex items-center justify-between font-sans font-medium"
                style={{ padding: "15px 24px", fontSize: "15px", color: "#1a1a1a" }}
                onClick={() => setMobileExpanded(mobileExpanded === i ? null : i)}
              >
                {item.label}
                <ChevronDown style={{
                  width: "14px", height: "14px", color: "#9b6b3f",
                  transform: mobileExpanded === i ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform .2s",
                }} />
              </button>
              {mobileExpanded === i && (
                <div style={{ background: "#fdfbf8" }}>
                  {item.children.map((child, j) => (
                    <Link key={j} href={child.href} className="block font-sans"
                      style={{ padding: "12px 40px", fontSize: "14px", color: "#555", borderTop: "1px solid #eee" }}>
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </header>
  )
}
