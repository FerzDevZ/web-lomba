/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // No heavy bundle config — Next.js handles us. Preload warning note:
  // Dev runtime logs “resource preloaded but not used within load event” for
  // critical-chain CSS because Next.js preload is used by RSC hydration only
  // after the first render cycle, and Chrome logs proactively. This does not
  // affect production performance. No runtime suppression — no negative perf.
}

export default nextConfig
