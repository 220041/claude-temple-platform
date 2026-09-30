"use client"

import Image from "next/image"
import Link from "next/link"
import { Calendar, Heart, Users, type LucideIcon } from "lucide-react"

const ICONS: Record<string, LucideIcon> = { calendar: Calendar, heart: Heart, users: Users }

export type PrayerCard = {
  id: string
  icon: string
  title: string
  desc: string
  image: string
  alt?: string
  href: string
}

// CMS(HomePage.prayerCards)가 비어 있을 때만 쓰는 개발용 기본값.
const FALLBACK_PRAYERS: PrayerCard[] = [
  {
    id: "annual",
    icon: "calendar",
    title: "연중기도",
    desc: "일 년 동안 끊이지 않는 기도의 물결. 매월 특별 기도일을 정해 가족과 이웃의 안녕을 빕니다.",
    image: "/images/KakaoTalk_20260728_195210204_04.jpg",
    alt: "봉림사 삼존불 앞 기도",
    href: "#prayer-yearly",
  },
  {
    id: "gwaneum",
    icon: "heart",
    title: "관음42수주기도",
    desc: "관세음보살의 42수 주문을 외우며 자비의 마음을 닦아가는 정진 기도입니다.",
    image: "/images/KakaoTalk_20260728_195210204_03.jpg",
    alt: "봉림사 야간 연등",
    href: "#prayer-gwaneum",
  },
  {
    id: "youth",
    icon: "users",
    title: "어린이·청소년 법회",
    desc: "미래의 주인공들이 부처님의 가르침 속에서 바르고 밝게 자라도록 인도하는 법회입니다.",
    image: "/images/KakaoTalk_20260728_195210204_01.jpg",
    alt: "봉림사 연등나무",
    href: "#prayer-youth",
  },
]

export default function PrayerSection({ cards }: { cards?: PrayerCard[] }) {
  const prayers = cards && cards.length > 0 ? cards : FALLBACK_PRAYERS
  return (
    <section id="prayer" aria-label="기도·법회" style={{ background: "#f5f4f2", borderBottom: "1px solid #e8e6e1" }}>
      <div className="max-w-[1280px] mx-auto px-8 lg:px-16" style={{ paddingTop: "72px", paddingBottom: "72px" }}>
        <div className="mb-10 flex flex-col items-center text-center">
          <Image src="/images/logo-mascot.png" alt="봉림사 마스코트" width={56} height={56} />
          <p className="mt-3 font-serif text-sm leading-7 text-[#888078]">
            "일체중생이 행복하기를" 간절한 마음으로 기도합니다.
          </p>
        </div>
        <h2 className="mb-[10px] font-serif" style={{ fontSize: "22px", fontWeight: 700, color: "#161410", letterSpacing: "-0.01em" }}>
          봉림사 이야기
        </h2>

        {/* 2번 스타일 3단 카드 — 번호워터마크 대신 상단 사진 */}
        <div className="grid md:grid-cols-3" style={{ gap: "1px", background: "#d0ccc5", border: "1px solid #d0ccc5" }}>
          {prayers.map((p) => {
            const Icon = ICONS[p.icon] ?? Calendar
            return (
              <Link
                key={p.id}
                href={p.href}
                className="group transition-colors"
                style={{ background: "#fff" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fdfbf8" }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff" }}
              >
                <div className="relative overflow-hidden" style={{ height: "180px" }}>
                  <Image
                    src={p.image}
                    alt={p.alt ?? p.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div style={{ padding: "32px" }}>
                  <div style={{ color: "#cc5030", marginBottom: "20px" }}>
                    <Icon size={24} />
                  </div>
                  <h3 className="font-serif" style={{ fontSize: "20px", fontWeight: 700, color: "#161410", marginBottom: "14px" }}>
                    {p.title}
                  </h3>
                  <div style={{ width: "32px", height: "1px", background: "#df7452", marginBottom: "14px" }} />
                  <p className="font-sans" style={{ fontSize: "13px", color: "#656058", lineHeight: 1.8 }}>
                    {p.desc}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

      </div>
    </section>
  )
}
