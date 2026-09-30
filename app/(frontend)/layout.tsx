import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, Noto_Serif_KR } from 'next/font/google'
import './globals.css'
import PopupModal, { type PopupData } from '@/components/popup-modal'
import { getPopupSettings, getSiteSettings } from '@/lib/payload'

/** 미설치 상태(설정이 비어있음)에서는 특정 사찰 이름/설명을 노출하지 않는다. */
const UNCONFIGURED_METADATA = {
  title: '사찰 홈페이지',
  description: '이 사찰 홈페이지는 아직 설정되지 않았습니다.',
  themeColor: '#263328',
} as const

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
})

const notoSerifKR = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto-serif-kr',
  display: 'swap',
})

// 팝업 설정을 이 레이아웃에서 조회하므로, 페이지와 동일한 주기로 재검증한다.
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const metadataBase = process.env.NEXT_PUBLIC_SERVER_URL ? new URL(process.env.NEXT_PUBLIC_SERVER_URL) : undefined
  const settings = await getSiteSettings()

  if (!settings?.installed) {
    return { metadataBase, title: UNCONFIGURED_METADATA.title, description: UNCONFIGURED_METADATA.description }
  }

  const siteName = settings.siteShortName || settings.siteName || UNCONFIGURED_METADATA.title
  const siteNamePart = settings.siteName && settings.siteNameEn ? `${settings.siteName} | ${settings.siteNameEn}` : siteName

  return {
    metadataBase,
    title: siteNamePart,
    description: settings.siteDescription || undefined,
    keywords: settings.siteKeywords || undefined,
  }
}

export async function generateViewport(): Promise<Viewport> {
  const settings = await getSiteSettings()
  const themeColor = settings?.installed ? settings.themeColor || UNCONFIGURED_METADATA.themeColor : UNCONFIGURED_METADATA.themeColor
  return { colorScheme: 'light', themeColor }
}

function resolveImageUrl(image: unknown): string | undefined {
  if (image && typeof image === 'object' && 'url' in image && typeof image.url === 'string') {
    return image.url
  }
  return undefined
}

async function getActivePopup(): Promise<PopupData | null> {
  const popup = await getPopupSettings()
  if (!popup || !popup.enabled) return null

  const now = Date.now()
  if (popup.startDate && now < new Date(popup.startDate).getTime()) return null
  if (popup.endDate && now > new Date(popup.endDate).getTime()) return null

  return {
    id: String(popup.id),
    title: popup.title ?? undefined,
    image: resolveImageUrl(popup.image),
    linkUrl: popup.linkUrl ?? undefined,
    allowHideForOneDay: popup.allowHideForOneDay ?? undefined,
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const popup = await getActivePopup()

  return (
    <html lang="ko" className={`bg-white ${notoSansKR.variable} ${notoSerifKR.variable}`}>
      <body className="antialiased font-sans">
        {children}
        {popup && <PopupModal popup={popup} />}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
