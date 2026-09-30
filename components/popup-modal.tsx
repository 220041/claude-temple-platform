"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"

export type PopupData = {
  id: string
  title?: string
  image?: string
  linkUrl?: string
  allowHideForOneDay?: boolean
}

const HIDE_KEY_PREFIX = "popup-hide-until:"

// 최종 디자인은 아직 확정되지 않아, 우선 중립적인 회색 박스로 노출 여부·
// 기간·닫기·하루 동안 보지 않기 로직만 구현한다(guide.md 6절 팝업).
export default function PopupModal({ popup }: { popup: PopupData }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hideUntil = window.localStorage.getItem(HIDE_KEY_PREFIX + popup.id)
    if (hideUntil && Date.now() < Number(hideUntil)) return
    setVisible(true)
  }, [popup.id])

  if (!visible) return null

  const close = () => setVisible(false)

  const hideForOneDay = () => {
    const until = Date.now() + 24 * 60 * 60 * 1000
    window.localStorage.setItem(HIDE_KEY_PREFIX + popup.id, String(until))
    setVisible(false)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,.5)" }}
      role="dialog"
      aria-modal="true"
      aria-label={popup.title || "공지 팝업"}
    >
      <div style={{ width: "min(360px, 90vw)", background: "#e5e5e5", color: "#333" }}>
        <div className="flex items-center justify-end" style={{ padding: "8px" }}>
          <button
            onClick={close}
            aria-label="팝업 닫기"
            style={{ color: "#555", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={20} />
          </button>
        </div>

        {popup.image ? (
          <div className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
            <Image src={popup.image} alt={popup.title || ""} fill className="object-cover" />
          </div>
        ) : (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#888" }}>
            {popup.title || "공지"}
          </div>
        )}

        {popup.image && popup.title && (
          <p style={{ padding: "16px 20px 0", fontSize: "14px", fontWeight: 600 }}>{popup.title}</p>
        )}

        {popup.linkUrl && (
          <div style={{ padding: "16px 20px" }}>
            <Link
              href={popup.linkUrl}
              className="block text-center"
              style={{ padding: "10px", background: "#999", color: "#fff", fontSize: "13px" }}
            >
              자세히 보기
            </Link>
          </div>
        )}

        <div
          className="flex items-center justify-between"
          style={{ padding: "12px 20px", borderTop: "1px solid #d0d0d0", fontSize: "12px" }}
        >
          {popup.allowHideForOneDay ? (
            <button onClick={hideForOneDay} style={{ color: "#555" }}>
              오늘 하루 보지 않기
            </button>
          ) : (
            <span />
          )}
          <button onClick={close} style={{ color: "#555" }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
