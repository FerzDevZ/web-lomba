import type { Metadata } from "next"
import Link from "next/link"
import { Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/layout/Navbar"
import { OfflineIndicator } from "@/components/layout/offline-indicator"
import { ScrollToTop } from "@/components/layout/scroll-to-top"
import { Toaster } from "sonner"
import { Mail, HelpCircle } from "lucide-react"
import { SITE_URL } from "@/lib/site-url"

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
})

// SITE_URL berasal dari lib/site-url.ts — satu sumber untuk metadata,
// sitemap, dan robots.txt.

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ServisLokal — Marketplace Jasa Lokal",
    template: "%s | ServisLokal",
  },
  description:
    "Temukan penyedia jasa terpercaya di sekitar Anda: perbaikan, kebersihan, instalasi, dan lainnya.",
  applicationName: "ServisLokal",
  keywords: [
    "jasa lokal",
    "marketplace jasa",
    "tukang",
    "service AC",
    "jasa kebersihan",
    "jasa instalasi",
    "penyedia jasa Indonesia",
  ],
  authors: [{ name: "ServisLokal" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "ServisLokal",
    title: "ServisLokal — Marketplace Jasa Lokal",
    description:
      "Temukan penyedia jasa terpercaya di sekitar Anda: perbaikan, kebersihan, instalasi, dan lainnya.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "ServisLokal — Marketplace Jasa Lokal",
    description:
      "Temukan penyedia jasa terpercaya di sekitar Anda: perbaikan, kebersihan, instalasi, dan lainnya.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
}

/**
 * Tautan footer. Hanya anchor yang benar-benar ada di /faq (lihat FAQ_SECTIONS)
 * — sebelumnya kolom "Tentang" menunjuk ke #syarat dan #privasi yang tidak
 * pernah dirender, jadi kliknya tidak melakukan apa pun.
 */
const FOOTER_LINKS = [
  {
    title: "Jelajahi",
    links: [
      { href: "/services", label: "Semua Jasa" },
      { href: "/services?sort=rating", label: "Rating Terbaik" },
      { href: "/dashboard/provider/buka-jasa", label: "Buka Jasa" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/faq#cara-pesan", label: "Cara Pesan" },
      { href: "/faq#pembayaran", label: "Pembayaran" },
      { href: "/faq#kebijakan", label: "Kebijakan" },
    ],
  },
  {
    title: "Tentang",
    links: [
      { href: "/faq#tentang", label: "Tentang Kami" },
      { href: "/faq#penyedia", label: "Untuk Penyedia Jasa" },
    ],
  },
] as const

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "ServisLokal",
      url: SITE_URL,
      description:
        "Marketplace jasa lokal yang menghubungkan pelanggan dengan penyedia jasa profesional di Indonesia.",
      areaServed: { "@type": "Country", name: "Indonesia" },
      email: "halo@servislokal.id",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "ServisLokal",
      inLanguage: "id-ID",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/services?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("servislokal-theme")||"dark";var d=t==="dark";document.documentElement.classList.toggle("dark",d)}catch(e){document.documentElement.classList.add("dark")}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F97316" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(
                    (registration) => {
                      console.log('SW registered: ', registration)
                    },
                    (error) => {
                      console.log('SW registration failed: ', error)
                    }
                  )
                })
              }
            `,
          }}
        />
      </head>
      <body className={`${sans.variable} ${serif.variable} font-sans`}>
        <ThemeProvider>
          <Providers>
            <a
              href="#konten-utama"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              Lewati ke konten utama
            </a>
            <Navbar />
            <main id="konten-utama" className="min-h-[calc(100vh-4rem)]">
              {children}
            </main>
            <footer className="border-t border-border bg-card">
              <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
                  <div className="col-span-2 lg:col-span-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-sm font-black text-primary-foreground">
                        S
                      </span>
                      <span className="text-lg font-bold tracking-tight">
                        Servis<span className="text-primary-strong">Lokal</span>
                      </span>
                    </div>
                    <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                      Marketplace jasa lokal terpercaya. Temukan penyedia jasa
                      profesional di sekitar Anda — dari perbaikan, kebersihan,
                      hingga instalasi.
                    </p>
                    <div className="mt-5 flex gap-3">
                      <a
                        href="mailto:halo@servislokal.id"
                        className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary-strong"
                        aria-label="Kirim email ke ServisLokal"
                      >
                        <Mail className="h-4 w-4" aria-hidden="true" />
                      </a>
                      <Link
                        href="/faq"
                        className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary-strong"
                        aria-label="Pusat bantuan dan FAQ"
                      >
                        <HelpCircle className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>

                  {/* Kolom tautan digenerate dari satu sumber (FOOTER_LINKS)
                      supaya tidak ada lagi <li> yang disalin manual — itu yang
                      dulu menyebabkan anchor mati seperti /faq#syarat. */}
                  {FOOTER_LINKS.map((column) => (
                    <div key={column.title}>
                      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {column.title}
                      </h2>
                      <ul className="space-y-2.5 text-sm">
                        {column.links.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              className="focus-ring rounded text-muted-foreground transition-colors hover:text-primary-strong"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground md:flex-row">
                  <p>
                    © {new Date().getFullYear()} ServisLokal — Temukan jasa
                    terbaik di sekitar Anda.
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Dibangun untuk penyedia jasa di Indonesia
                  </p>
                </div>
              </div>
            </footer>
            <Toaster position="top-center" richColors closeButton />
            <OfflineIndicator />
            <ScrollToTop />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
