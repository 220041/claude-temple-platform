"use client"

import { useEffect, useRef } from "react"

declare global {
  interface Window {
    kakao: any
  }
}

const KAKAO_SDK_ID = "kakao-maps-sdk"

export type LocationInfo = {
  lat: number
  lng: number
  mapLabel: string
  zoomLevel?: number
}

export default function LocationSection({ location }: { location?: LocationInfo }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const lat = location?.lat
  const lng = location?.lng
  const level = location?.zoomLevel ?? 4

  useEffect(() => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY
    if (!appKey || !mapRef.current || lat === undefined || lng === undefined) return

    const renderMap = () => {
      window.kakao.maps.load(() => {
        if (!mapRef.current) return
        const center = new window.kakao.maps.LatLng(lat, lng)
        const map = new window.kakao.maps.Map(mapRef.current, { center, level })
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
  }, [lat, lng, level])

  if (lat === undefined || lng === undefined) return null

  return (
    <section aria-label="찾아오는 길" className="border-b border-[#e8e6e1] bg-white">
      <div className="mx-auto max-w-[1280px] px-8 lg:px-16" style={{ paddingTop: "72px", paddingBottom: "72px" }}>
        <h2 className="mb-[10px] font-serif" style={{ fontSize: "22px", fontWeight: 700, color: "#161410", letterSpacing: "-0.01em" }}>
          찾아오는 길
        </h2>
        <div ref={mapRef} className="mt-6 h-[360px] w-full lg:h-[440px]" style={{ background: "#f5f4f2" }} />
        <a
          href={`https://map.kakao.com/link/map/${encodeURIComponent(location?.mapLabel || "")},${lat},${lng}`}
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
