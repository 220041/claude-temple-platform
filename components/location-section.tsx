"use client"

import { useEffect, useRef } from "react"

declare global {
  interface Window {
    kakao: any
  }
}

// 도로명주소(제주특별자치도 서귀포시 태평로205번길 87) 기준 Kakao
// 지오코딩 결과. 건물명이 "봉림사"로 정확히 일치하는 것을 확인했다.
const BONGRIMSA_LAT = 33.2509992116399
const BONGRIMSA_LNG = 126.539461742188
const KAKAO_SDK_ID = "kakao-maps-sdk"

export default function LocationSection() {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY
    if (!appKey || !mapRef.current) return

    const renderMap = () => {
      window.kakao.maps.load(() => {
        if (!mapRef.current) return
        const center = new window.kakao.maps.LatLng(BONGRIMSA_LAT, BONGRIMSA_LNG)
        const map = new window.kakao.maps.Map(mapRef.current, { center, level: 4 })
        new window.kakao.maps.Marker({ position: center, map })
      })
    }

    if (window.kakao?.maps) {
      renderMap()
      return
    }

    const existing = document.getElementById(KAKAO_SDK_ID) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener("load", renderMap)
      return
    }

    const script = document.createElement("script")
    script.id = KAKAO_SDK_ID
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`
    script.async = true
    script.addEventListener("load", renderMap)
    document.head.appendChild(script)
  }, [])

  return (
    <section aria-label="봉림사 찾아오는길" className="border-b border-[#e8e6e1] bg-white">
      <div className="mx-auto max-w-[1280px] px-8 lg:px-16" style={{ paddingTop: "72px", paddingBottom: "72px" }}>
        <h2 className="mb-[10px] font-serif" style={{ fontSize: "22px", fontWeight: 700, color: "#161410", letterSpacing: "-0.01em" }}>
          봉림사 찾아오는길
        </h2>
        <div ref={mapRef} className="mt-6 h-[360px] w-full lg:h-[440px]" style={{ background: "#f5f4f2" }} />
        <a
          href={`https://map.kakao.com/link/map/봉림사,${BONGRIMSA_LAT},${BONGRIMSA_LNG}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block font-sans text-[13px]"
          style={{ color: "#cc5030" }}
        >
          카카오맵에서 길찾기 →
        </a>
      </div>
    </section>
  )
}
