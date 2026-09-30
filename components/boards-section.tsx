"use client"

import Link from "next/link"

export type TempleNewsItem = {
  id: number | string
  cat: string
  title: string
  date: string
  href: string
  isNew?: boolean
}

export default function BoardsSection({ newsItems = [] }: { newsItems?: TempleNewsItem[] }) {
  return (
    <section className="bg-white" style={{ borderBottom: "1px solid #e8e4de" }}>
      <div className="max-w-[1280px] mx-auto px-8 lg:px-16" style={{ paddingTop: "64px", paddingBottom: "64px" }}>

        {/* 1번처럼: 제목 + "+" 버튼 */}
        <div className="flex items-center justify-between" style={{ marginBottom: "32px" }}>
          <h2 className="font-serif" style={{ fontSize: "22px", fontWeight: 500, color: "#1a1a1a", letterSpacing: "-0.01em" }}>
            봉림사 소식
          </h2>
          <Link
            href="/temple-news"
            className="flex items-center justify-center transition-colors"
            style={{
              width: "28px", height: "28px",
              border: "1px solid #ccc",
              color: "#888",
              fontSize: "18px",
              lineHeight: 1,
            }}
            aria-label="전체 소식 보기"
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#9b6b3f"; e.currentTarget.style.color = "#9b6b3f" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.color = "#888" }}
          >
            +
          </Link>
        </div>

        {/* 2번 스타일: 좌측 공지사항 리스트 + 우측 컬러배너 2개 */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 좌측: 공지사항 최근게시물 */}
          <div className="lg:col-span-2">
            {newsItems.length === 0 ? (
              <p className="font-sans" style={{ padding: "20px 8px", fontSize: "13px", color: "#888078" }}>
                등록된 소식이 없습니다.
              </p>
            ) : (
            <ul style={{ borderTop: "1px solid #e8e6e1" }}>
              {newsItems.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    className="flex items-center transition-colors"
                    style={{ gap: "20px", padding: "20px 8px", borderBottom: "1px solid #e8e6e1" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#fdfbf8" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                  >
                    <span
                      className="font-sans font-medium flex-shrink-0 text-center"
                      style={{
                        fontSize: "12px",
                        color: "#cc5030",
                        background: "#fdf4f0",
                        padding: "4px 10px",
                      }}
                    >
                      {n.cat}
                    </span>
                    <span className="flex-1 font-sans truncate" style={{ fontSize: "14px", color: "#333" }}>
                      {n.title}
                      {n.isNew && (
                        <span className="font-sans font-bold" style={{ marginLeft: "8px", fontSize: "10px", color: "#cc5030" }}>
                          NEW
                        </span>
                      )}
                    </span>
                    <span className="font-sans flex-shrink-0" style={{ fontSize: "12px", color: "#bbb" }}>
                      {n.date}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            )}
          </div>

          {/* 우측: 컬러배너 2개 — 1번 버전 (봉림사 이야기 / 감로당 이야기) */}
          <div className="space-y-6">
            <Link
              href="/stories/bonglimsa"
              className="relative flex flex-col justify-between transition-opacity group"
              style={{ padding: "28px 24px 24px", background: "#c8705a", color: "#fff" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.9" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1" }}
            >
              <div>
                <p className="font-serif font-bold" style={{ fontSize: "17px", lineHeight: 1.5, marginBottom: "10px" }}>
                  봉림사<br />이야기
                </p>
                <p className="font-sans" style={{ fontSize: "12px", lineHeight: 1.7, color: "rgba(255,255,255,.8)" }}>
                  봉림사에서 전해지는<br />
                  오래된 이야기들을<br />
                  받아드립니다.
                </p>
              </div>
              <span
                className="font-sans font-medium self-end"
                style={{ fontSize: "12px", letterSpacing: "0.06em", padding: "5px 12px", background: "rgba(0,0,0,.18)", marginTop: "24px" }}
              >
                바로가기
              </span>
            </Link>

            <Link
              href="/stories/gamrodang"
              className="relative flex flex-col justify-between transition-opacity group"
              style={{ padding: "28px 24px 24px", background: "#c8a882", color: "#fff" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.9" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1" }}
            >
              <div>
                <p className="font-serif font-bold" style={{ fontSize: "17px", lineHeight: 1.5, marginBottom: "10px" }}>
                  감로당<br />이야기
                </p>
                <p className="font-sans" style={{ fontSize: "12px", lineHeight: 1.7, color: "rgba(255,255,255,.85)" }}>
                  봉림사에서 전해지는<br />
                  감로당 이야기들을<br />
                  받아드립니다.
                </p>
              </div>
              <span
                className="font-sans font-medium self-end"
                style={{ fontSize: "12px", letterSpacing: "0.06em", padding: "5px 12px", background: "rgba(0,0,0,.14)", marginTop: "24px" }}
              >
                바로가기
              </span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}
