import Image from "next/image"
import Link from "next/link"

export type SiteLogoInfo = {
  logoUrl?: string
  logoAlt?: string
  logoTagline?: string
  /** 로고 이미지가 없을 때 대신 글자로 보여줄 사찰 이름. */
  siteName?: string
}

/**
 * header.tsx/temporary-header.tsx가 각자 하드코딩하던 로고+태그라인
 * 블록을 하나로 합친다. 값이 비어 있으면(미설치 상태) 태그라인/로고
 * 이미지 없이 홈 링크만 남는다 — 다른 사찰 자료를 대신 노출하지 않는다.
 */
export default function SiteLogo({ logoUrl, logoAlt, logoTagline, siteName }: SiteLogoInfo) {
  return (
    <Link href="/" className="flex flex-col items-center gap-1.5 leading-none">
      {logoTagline && <span className="font-sans text-[11px] tracking-[0.12em] text-[#aaa]">{logoTagline}</span>}
      {logoUrl && (
        <Image
          src={logoUrl}
          alt={logoAlt ?? ""}
          width={357}
          height={63}
          className="h-10 w-auto"
          priority
        />
      )}
      {!logoUrl && siteName && (<span className="font-serif text-2xl font-bold text-[#161410]">{siteName}</span>)}
    </Link>
  )
}
