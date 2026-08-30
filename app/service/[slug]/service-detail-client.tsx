"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Star,
  MessageSquare,
  Clock,
  MapPin,
  ShieldCheck,
  ArrowRight,
  CalendarCheck,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { SaveButton } from "@/components/services/save-button"
import { EmptyState } from "@/components/ui/empty-state"
import { PageShell } from "@/components/layout/page-shell"
import { RatingStars } from "@/components/services/rating-stars"
import { ServiceTile } from "@/components/services/service-tile"
import { formatIDR } from "@/lib/utils"
import { getCategoryIcon } from "@/lib/category-icons"

type ServiceItem = {
  id: string | number
  title: string
  slug: string
  description: string
  price: number
  deliveryTimeDays: number
  imageUrl: string | null
  images: string | null
  ratingAvg: number
  totalReviews: number
  provider: { id: string | number; name: string | null; avatarUrl: string | null; city?: string | null }
  category: { id: string | number; name: string; slug: string }
}

type ProviderStats = {
  completedOrders: number
  memberSince: string
  city: string | null
  avgRating: number
}

type ReviewItem = {
  id: string | number
  rating: number
  comment: string | null
  createdAt: string
  reviewer: { id: string | number; name: string | null; avatarUrl: string | null }
}

function formatCity(city: string | null): string {
  if (!city) return "Indonesia"
  return city
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

// Janji platform yang benar-benar dijalankan — sama dengan trust points
// checkout agar pengalaman antarhalaman konsisten.
const TRUST_POINTS = [
  "Bisa dibatalkan gratis selama belum dikerjakan",
  "Koordinasi jadwal & alamat via pesan",
  "Ulasan hanya dari pesanan selesai",
] as const

/** Distribusi bintang untuk panel kredibilitas ulasan. */
function RatingDistribution({ reviews }: { reviews: ReviewItem[] }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))
  const total = reviews.length || 1

  return (
    <div className="space-y-1.5">
      {counts.map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2 text-xs">
          <span className="flex w-8 items-center gap-0.5 tabular-nums text-muted-foreground">
            {star}
            <Star className="h-3 w-3 fill-rating text-rating" aria-hidden />
          </span>
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
            role="presentation"
          >
            <div
              className="h-full rounded-full bg-rating transition-[width] duration-500"
              style={{ width: `${Math.round((count / total) * 100)}%` }}
            />
          </div>
          <span className="w-6 text-right tabular-nums text-muted-foreground">
            {count}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function ServiceDetailClient({
  service,
  related,
  providerStats,
}: {
  service: ServiceItem
  related: ServiceItem[]
  providerStats: ProviderStats
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = searchParams.get("tab") === "reviews" ? "reviews" : searchParams.get("tab") === "about" ? "about" : "description"
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    const t = searchParams.get("tab")
    if (t === "reviews" || t === "about" || t === "description") setActiveTab(t)
  }, [searchParams])

  const handleTabChange = (v: string) => {
    setActiveTab(v)
    const params = new URLSearchParams(searchParams.toString())
    if (v === "description") params.delete("tab")
    else params.set("tab", v)
    const qs = params.toString()
    router.replace(`${window.location.pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
    // Scroll ke konten tab di HP — tanpa ini user klik Ulasan tidak lihat perubahan
    requestAnimationFrame(() => {
      document.getElementById(`tab-${v}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  const { data: reviews, isLoading: reviewsLoading } = useQuery<ReviewItem[]>({
    queryKey: ["service-reviews", service.id],
    queryFn: async () => {
      const res = await fetch(`/api/services/${service.id}/reviews`)
      if (!res.ok) throw new Error("Gagal memuat ulasan")
      return res.json()
    },
  })

  // Navigasi ke checkout memakai <Link>, bukan window.location.href: assignment
  // itu memicu full page reload — cache React Query dibuang dan pengguna
  // menunggu bundle dimuat ulang untuk rute yang sudah di-prefetch.
  const checkoutHref = `/checkout?service=${service.slug}`
  const CategoryIcon = getCategoryIcon(service.category.slug)
  const memberSince = new Date(providerStats.memberSince).toLocaleDateString(
    "id-ID",
    { month: "long", year: "numeric" }
  )

  const gallery: string[] = (() => {
    const arr: string[] = []
    if (service.imageUrl) arr.push(service.imageUrl)
    if (service.images) {
      try {
        const parsed = JSON.parse(service.images)
        if (Array.isArray(parsed)) arr.push(...parsed.filter((u: unknown) => typeof u === "string" && u))
      } catch {}
    }
    return arr
  })()
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  // sinkronkan lightbox index dengan active saat dibuka
  const openLightbox = (idx: number) => {
    setLightboxIdx(idx)
    setLightboxOpen(true)
  }
  const [lightboxIdx, setLightboxIdx] = useState(0)

  return (
    <PageShell className="py-8">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Beranda</Link>
        <span aria-hidden className="text-muted-foreground/50">/</span>
        <Link href={`/services?category=${service.category.id}`} className="hover:text-foreground transition-colors">{service.category.name}</Link>
        <span aria-hidden className="text-muted-foreground/50">/</span>
        <span aria-current="page" className="truncate font-medium text-foreground">{service.title}</span>
      </nav>
      <h1 className="sr-only">{service.title}</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:gap-12 lg:items-start">
        {/* Kolom kiri: galeri + tabs. Semua konten yang discroll berada di sini,
            sehingga box kanan yang sticky tidak pernah tumpang tindih dengan tabs. */}
        <div className="min-w-0 space-y-8">
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-2xl bg-accent">
              {gallery.length ? (
                <>
                  <button
                    type="button"
                    onClick={() => openLightbox(activeIdx)}
                    aria-label={`Perbesar foto ${activeIdx + 1} dari ${gallery.length}`}
                    className="focus-ring group relative block aspect-video w-full overflow-hidden"
                  >
                    <Image
                      src={gallery[activeIdx]}
                      alt={`${service.title} foto ${activeIdx + 1}`}
                      fill
                      priority={activeIdx === 0}
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-cover transition-transform duration-slow group-hover:scale-[1.02]"
                      unoptimized={gallery[activeIdx]?.startsWith("data:")}
                    />
                    <span className="pointer-events-none absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-foreground opacity-0 backdrop-blur transition-opacity duration-base group-hover:opacity-100">
                      <Maximize2 className="h-4 w-4" aria-hidden />
                    </span>
                  </button>
                  <Badge className="pointer-events-none absolute left-3 top-3 bg-card/90 text-foreground backdrop-blur">
                    {service.category.name}
                  </Badge>
                  <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                    {activeIdx + 1} / {gallery.length}
                  </span>
                  {gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label="Foto sebelumnya"
                        onClick={() => setActiveIdx((i) => (i - 1 + gallery.length) % gallery.length)}
                        className="absolute left-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm backdrop-blur hover:bg-card sm:flex"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Foto berikutnya"
                        onClick={() => setActiveIdx((i) => (i + 1) % gallery.length)}
                        className="absolute right-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm backdrop-blur hover:bg-card sm:flex"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-primary/15 via-accent to-background">
                  <CategoryIcon className="h-24 w-24 text-primary-strong/30" aria-hidden />
                </div>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {gallery.map((url, i) => (
                  <button
                    key={url + i}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    aria-label={`Tampilkan foto ${i + 1}`}
                    aria-current={i === activeIdx}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${i === activeIdx ? "border-primary shadow-glow" : "border-transparent opacity-70 hover:opacity-100"}`}
                  >
                    <Image src={url} alt="" fill sizes="96px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
              <DialogContent className="max-w-4xl p-2 sm:p-3">
                <DialogTitle className="sr-only">{service.title} — galeri</DialogTitle>
                <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                  {gallery[lightboxIdx] && (
                    <Image src={gallery[lightboxIdx]} alt={service.title} fill sizes="90vw" className="object-contain" unoptimized={gallery[lightboxIdx]?.startsWith("data:")} />
                  )}
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
                    {lightboxIdx + 1} / {gallery.length}
                  </span>
                  {gallery.length > 1 && (
                    <>
                      <button type="button" aria-label="Sebelumnya" onClick={() => setLightboxIdx((i) => (i - 1 + gallery.length) % gallery.length)} className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow hover:bg-white">
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button type="button" aria-label="Berikutnya" onClick={() => setLightboxIdx((i) => (i + 1) % gallery.length)} className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow hover:bg-white">
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
                {gallery.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {gallery.map((url, i) => (
                      <button key={url + i} type="button" onClick={() => setLightboxIdx(i)} className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${i === lightboxIdx ? "border-primary" : "border-transparent opacity-60"}`}>
                        <Image src={url} alt="" fill sizes="96px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Judul + meta singkat tetap di kiri agar sticky kanan fokus ke harga/CTA.
              Di layar besar judul duplicate di kanan dihilangkan untuk hindari duplikasi. */}
          <div className="lg:hidden">
            <RatingStars
              value={service.ratingAvg}
              size="lg"
              showValue
              reviewCount={service.totalReviews}
            />
            <div className="mt-3 text-3xl font-extrabold tracking-tight" aria-hidden="true">
              {service.title}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden />
                Estimasi {service.deliveryTimeDays} hari
              </span>
              {providerStats.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {formatCity(providerStats.city)}
                </span>
              )}
            </div>
          </div>

          {/* Harga + provider untuk mobile — di desktop versi ini disembunyikan
              karena sudah ada di kolom kanan yang sticky. Tanpa ini, urutan
              mobile jadi: galeri → judul → tabs, harga malah di bawah ulasan. */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 lg:hidden">
            <div className="text-3xl font-extrabold text-primary-strong">
              {formatIDR(service.price)}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              per jasa • estimasi selesai dalam {service.deliveryTimeDays} hari
            </div>
          </div>
          <ul className="space-y-2 lg:hidden">
            {TRUST_POINTS.map((text) => (
              <li key={text} className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
          <Link href={`/provider/${service.provider.id}`} className="focus-ring group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 lg:hidden">
            {service.provider.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={service.provider.avatarUrl} alt={service.provider.name ?? "Provider"} className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-primary/10" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-base font-extrabold text-primary-strong">
                {(service.provider.name ?? "P").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{service.provider.name}</div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary-strong" aria-hidden />
                {providerStats.completedOrders} pesanan selesai
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </Link>

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Deskripsi</TabsTrigger>
              <TabsTrigger value="reviews">
                Ulasan ({service.totalReviews})
              </TabsTrigger>
              <TabsTrigger value="about">Tentang Provider</TabsTrigger>
            </TabsList>

            {/* TabsContent dirender ulang saat berganti nilai, jadi
                animate-rise-in terpicu tiap perpindahan tab. */}
            <TabsContent value="description" id="tab-description" className="mt-8 animate-rise-in scroll-mt-24">
              <div className="grid max-w-4xl gap-6 lg:grid-cols-[1fr_280px]">
                <div className="leading-relaxed text-muted-foreground">
                  <p className="text-base">{service.description}</p>
                  <p className="mt-4 text-sm">
                    Setelah pemesanan, Anda dapat menambahkan catatan, alamat
                    pelaksanaan, dan jadwal — lalu berkomunikasi langsung dengan
                    penyedia jasa melalui halaman pesanan.
                  </p>
                </div>
                <Card>
                  <CardContent className="space-y-3 p-5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Durasi kerja</span>
                      <span className="font-semibold">
                        {service.deliveryTimeDays} hari
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Harga</span>
                      <span className="font-semibold text-primary-strong">
                        {formatIDR(service.price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Kategori</span>
                      <span className="font-semibold">
                        {service.category.name}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reviews" id="tab-reviews" className="mt-8 animate-rise-in scroll-mt-24">
              <div className="max-w-3xl">
                {/* Panel kredibilitas: rata-rata + distribusi per bintang.
                    Distribusi dihitung dari data ulasan yang sudah dimuat —
                    tanpa endpoint tambahan. */}
                {reviews && reviews.length > 0 && (
                  <div className="mb-8 flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4 sm:pr-6 sm:[border-right:1px_solid_hsl(var(--border))]">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Star
                          className="h-8 w-8 fill-rating text-rating"
                          aria-hidden
                        />
                      </div>
                      <div>
                        <div className="text-3xl font-extrabold tabular-nums">
                          {service.totalReviews > 0 ? service.ratingAvg.toFixed(1) : "Baru"}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {service.totalReviews > 0 ? `dari ${service.totalReviews} ulasan` : "Belum ada ulasan"}
                        </p>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <RatingDistribution reviews={reviews} />
                    </div>
                  </div>
                )}

                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-border bg-card p-6"
                      >
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                          <Skeleton className="ml-auto h-5 w-24" />
                        </div>
                        <Skeleton className="mt-4 h-4 w-full" />
                        <Skeleton className="mt-2 h-4 w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : reviews && reviews.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="Belum ada ulasan"
                    description="Jadilah pelanggan pertama yang memberi ulasan untuk jasa ini setelah pesanan selesai."
                  />
                ) : (
                  <div className="space-y-4">
                    {reviews?.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-2xl border border-border bg-card p-6"
                      >
                        <div className="flex items-center gap-3">
                          {review.reviewer.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={review.reviewer.avatarUrl} alt={review.reviewer.name ?? "Reviewer"} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary-strong">
                              {(review.reviewer.name ?? "P").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-semibold">
                              {review.reviewer.name ?? "Customer"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString(
                                "id-ID",
                                { day: "numeric", month: "long", year: "numeric" }
                              )}
                            </div>
                          </div>
                          <RatingStars
                            value={review.rating}
                            className="ml-auto"
                          />
                        </div>
                        {review.comment && (
                          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="about" id="tab-about" className="mt-8 animate-rise-in scroll-mt-24">
              <Card className="max-w-3xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {service.provider.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={service.provider.avatarUrl} alt={service.provider.name ?? "Provider"} className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-primary/15" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-extrabold text-primary-strong">
                        {(service.provider.name ?? "P").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-lg font-bold">
                        {service.provider.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <ShieldCheck
                          className="h-4 w-4 text-primary-strong"
                          aria-hidden
                        />
                        Penyedia terverifikasi
                      </div>
                    </div>
                  </div>

                  {/* Fakta terstruktur, bukan bio auto-generated: angka yang
                      bisa diverifikasi dari data platform. */}
                  <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-muted/60 p-4">
                      <dt className="text-2xs uppercase tracking-wide text-muted-foreground">
                        Pesanan selesai
                      </dt>
                      <dd className="mt-1 text-xl font-extrabold tabular-nums">
                        {providerStats.completedOrders}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-muted/60 p-4">
                      <dt className="text-2xs uppercase tracking-wide text-muted-foreground">
                        Rating rata-rata
                      </dt>
                      <dd className="mt-1 flex items-center gap-1 text-xl font-extrabold tabular-nums">
                        {providerStats.avgRating > 0
                          ? providerStats.avgRating.toFixed(1)
                          : "Baru"}
                        {providerStats.avgRating > 0 && (
                          <Star
                            className="h-4 w-4 fill-rating text-rating"
                            aria-hidden
                          />
                        )}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-muted/60 p-4">
                      <dt className="text-2xs uppercase tracking-wide text-muted-foreground">
                        Anggota sejak
                      </dt>
                      <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold capitalize">
                        <CalendarCheck
                          className="h-4 w-4 text-primary-strong"
                          aria-hidden
                        />
                        {memberSince}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-muted/60 p-4">
                      <dt className="text-2xs uppercase tracking-wide text-muted-foreground">
                        Area layanan
                      </dt>
                      <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                        <MapPin
                          className="h-4 w-4 text-primary-strong"
                          aria-hidden
                        />
                        {formatCity(providerStats.city)}
                      </dd>
                    </div>
                  </dl>

                  <Link href={`/provider/${service.provider.id}`}>
                    <Button variant="outline" className="mt-6">
                      Lihat Profil & Semua Jasa
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Kanan: order box sticky — hanya di desktop. Di mobile versi
            lg:hidden di kiri sudah tampil, jadi di sini hidden lg:block agar
            tidak duplikat dan tidak tumpang tindih dengan tabs. */}
        <div className="hidden min-w-0 space-y-5 lg:block lg:sticky lg:top-24 lg:self-start">
          <div>
            <RatingStars
              value={service.ratingAvg}
              size="lg"
              showValue
              reviewCount={service.totalReviews}
            />
            <div className="mt-3 text-3xl font-extrabold tracking-tight" aria-hidden="true">
              {service.title}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden />
                Estimasi {service.deliveryTimeDays} hari
              </span>
              {providerStats.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {formatCity(providerStats.city)}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <div className="text-4xl font-extrabold text-primary-strong">
              {formatIDR(service.price)}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              per jasa • estimasi selesai dalam {service.deliveryTimeDays} hari
            </div>
            <div className="mt-5 flex gap-3">
              <Button size="lg" className="flex-1 shadow-glow" asChild>
                <Link href={checkoutHref}>Pesan Sekarang</Link>
              </Button>
              <SaveButton serviceId={service.id} size="lg" />
            </div>
          </div>

          <ul className="space-y-2">
            {TRUST_POINTS.map((text) => (
              <li key={text} className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                {text}
              </li>
            ))}
          </ul>

          <Link
            href={`/provider/${service.provider.id}`}
            className="focus-ring group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
          >
            {service.provider.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={service.provider.avatarUrl} alt={service.provider.name ?? "Provider"} className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-primary/10" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-extrabold text-primary-strong">
                {(service.provider.name ?? "P").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="font-bold transition-colors group-hover:text-primary-strong">
                {service.provider.name}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary-strong" aria-hidden />
                {providerStats.completedOrders} pesanan selesai
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-base group-hover:translate-x-0.5 group-hover:text-primary-strong" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Jasa serupa — full width di bawah grid, tidak terjepit di kolom kiri */}
      {related.length > 0 && (
        <div className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Jasa serupa</h2>
            <Link
              href={`/services?category=${service.category.id}`}
              className="focus-ring inline-flex items-center gap-1 rounded text-sm font-semibold text-muted-foreground transition-colors hover:text-primary-strong"
            >
              Lihat semua <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ServiceTile key={item.id} service={item} media="sm" />
            ))}
          </div>
        </div>
      )}

      {/* Action bar mobile — glass */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/80 px-4 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <div className="min-w-0">
            <div className="text-2xs uppercase tracking-wide text-muted-foreground">
              Harga jasa
            </div>
            <div className="truncate text-lg font-extrabold text-primary-strong">
              {formatIDR(service.price)}
            </div>
          </div>
          <SaveButton
            serviceId={service.id}
            className="ml-auto shrink-0"
          />
          <Button size="lg" className="flex-1 shadow-glow" asChild>
            <Link href={checkoutHref}>Pesan Sekarang</Link>
          </Button>
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </PageShell>
  )
}
