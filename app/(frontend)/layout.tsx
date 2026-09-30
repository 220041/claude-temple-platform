import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, Noto_Serif_KR } from 'next/font/google'
import './globals.css'
import PopupModal, { type PopupData } from '@/components/popup-modal'
import { getPopupSettings } from '@/lib/payload'

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

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SERVER_URL ? new URL(process.env.NEXT_PUBLIC_SERVER_URL) : undefined,
  title: '하논봉림사 | Bonglimsa',
  description: '제주 한라산 기슭에 자리한 봉림사(Bonglimsa)는 천년의 역사를 간직한 수행과 기도의 도량입니다.',
  keywords: '봉림사, 하논봉림사, 제주사찰, 불교, 기도, 법회, Bonglimsa, bonglimsa',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#263328',
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
