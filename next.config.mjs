/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
    // framer-motion dan @react-three/drei sudah dilepas dari dependencies —
    // menyebut paket yang tidak terpasang di sini tidak berefek apa pun.
    optimizePackageImports: ['lucide-react', 'gsap', '@react-three/fiber', 'recharts', 'three'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    dangerouslyAllowSVG: false,
    // Format gambar optimal: AVIF > WebP > JPEG. Browser modern mendukung AVIF
    // yang 50% lebih kecil dari JPEG pada kualitas yang sama.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'cdn.servislokal.id' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  poweredByHeader: false,
  generateEtags: false,
  async headers() {
    // Header keamanan dasar. CSP sengaja tidak diaktifkan di sini karena
    // Next.js masih memakai inline script untuk hydration; menambahkannya
    // butuh nonce per-request lewat middleware.
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
      {
        // Endpoint API tidak boleh di-cache oleh CDN/browser.
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ]
  },
}

export default nextConfig
