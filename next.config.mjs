import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // sharp은 플랫폼별 네이티브 바이너리(libvips)를 쓰는 모듈인데, Next.js
  // 16의 기본 프로덕션 번들러인 Turbopack이 이걸 제대로 트레이싱하지
  // 못해 Vercel 서버리스 런타임에서 "cannot open shared object file"로
  // 깨진다(10.7 Preview 배포에서 재현). serverExternalPackages +
  // outputFileTracingIncludes 조합도 시도했으나 pnpm의 중첩 저장소
  // 구조(node_modules/.pnpm/sharp@.../node_modules/@img/...) 때문에
  // 경로를 안정적으로 지정하기 어려웠다. 대신 프로덕션 빌드만 Webpack으로
  // 강제한다(package.json의 build 스크립트에 --webpack 플래그 추가) —
  // Webpack의 기존 파일 트레이싱은 네이티브 모듈을 안정적으로 처리한다.
  async headers() {
    return [
      {
        // Payload admin 패널과 Next.js 하이드레이션이 인라인 스크립트/
        // 스타일에 의존하므로 script-src/style-src에 'unsafe-inline'을
        // 허용한다(nonce 기반으로 더 엄격히 하려면 Payload admin 쪽
        // 호환성을 별도로 검증해야 함 — 지금은 범위 밖). connect-src에
        // Vercel Blob 도메인을 허용한 이유: 회원 이미지가 우리 서버를
        // 거치지 않고 브라우저에서 Blob으로 직접 업로드되기 때문
        // (guide.md 10.7절 클라이언트 직접 업로드 파이프라인). script-src/
        // connect-src에 dapi.kakao.com·daumcdn.net을 허용한 이유: 홈페이지
        // '찾아오는길' 지도가 카카오맵 JS SDK로 렌더링되기 때문.
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://dapi.kakao.com https://*.daumcdn.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https: data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.vercel-storage.com https://*.blob.vercel-storage.com https://dapi.kakao.com https://*.daumcdn.net",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
