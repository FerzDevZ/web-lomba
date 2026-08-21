import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  MapPin,
  Star,
  ShieldCheck,
  Package,
  MessageSquare,
  CalendarDays,
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { PageShell } from "@/components/layout/page-shell"
import { RatingStars } from "@/components/services/rating-stars"
import { ServiceTile } from "@/components/services/service-tile"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id, 10) },
    select: { name: true, role: true },
  })
  if (!user || user.role === "CUSTOMER") {
    // Sama seperti /service/[slug]: <Navbar /> async di root layout membuat
    // respons di-stream sebelum notFound() dievaluasi, jadi status tetap 200.
    // noindex mencegah soft 404 ini terindeks.
    return {
      title: "Provider tidak ditemukan",
      robots: { index: false, follow: false },
    }
  }
  return {
    title: `${user.name} — Penyedia Jasa`,
    description: `Lihat profil, jasa, dan ulasan ${user.name} di ServisLokal.`,
  }
}

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const providerId = parseInt(id, 10)

  const [user, services, reviews] = await Promise.all([
    prisma.user.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        name: true,
        bio: true,
        location: true,
        avatarUrl: true,
        createdAt: true,
      },
    }),
    prisma.service.findMany({
      where: { providerId, status: "ACTIVE" },
      include: {
        category: true,
        // ServiceTile menampilkan nama provider di kartu — tanpa relasi ini
        // kartu di halaman profil berbeda bentuk dari kartu di katalog.
        provider: { select: { name: true } },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.review.findMany({
      where: { order: { service: { providerId, status: "ACTIVE" } } },
      include: {
        reviewer: { select: { name: true } },
        order: { select: { service: { select: { title: true, slug: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  if (!user) notFound()

  const totalReviews = reviews.length
  const ratingAvg =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0
  const monthsActive = Math.max(
    1,
    Math.round(
      (Date.now() - user.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000)
    )
  )

  return (
    <PageShell className="py-10">
      {/* Header profil */}
      <div className="flex flex-col items-start gap-6 rounded-3xl border border-border bg-card p-6 shadow-card md:flex-row md:items-center md:p-8">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-4xl font-extrabold text-primary-strong">
          {(user.name ?? "P").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">
              {user.name}
            </h1>
            <Badge className="gap-1">
              <ShieldCheck className="h-3 w-3" /> Terverifikasi
            </Badge>
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {user.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" /> Aktif {monthsActive} bulan
            </span>
          </p>
          {user.bio && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {user.bio}
            </p>
          )}
        </div>

        {/* Statistik */}
        <div className="grid w-full grid-cols-3 gap-4 md:w-auto">
          <div className="rounded-2xl border border-border bg-background p-4 text-center">
            <div className="text-2xl font-extrabold text-primary-strong">
              {ratingAvg.toFixed(1)}
            </div>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-rating text-rating" /> Rating
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4 text-center">
            <div className="text-2xl font-extrabold">{totalReviews}</div>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" /> Ulasan
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4 text-center">
            <div className="text-2xl font-extrabold">{services.length}</div>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Package className="h-3 w-3" /> Jasa
            </div>
          </div>
        </div>
      </div>

      {/* Jasa */}
      <div className="mt-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Jasa yang ditawarkan</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {services.length} jasa aktif
            </p>
          </div>
        </div>

        {services.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Belum ada jasa aktif"
            description="Provider ini belum menayangkan jasa. Coba lihat provider lain di katalog."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceTile key={service.id} service={service} media="sm" />
            ))}
          </div>
        )}
      </div>

      {/* Ulasan */}
      <div className="mt-14">
        <h2 className="mb-6 text-xl font-semibold tracking-tight">
          Ulasan pelanggan
        </h2>
        {totalReviews === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Belum ada ulasan"
            description="Ulasan muncul setelah pelanggan menyelesaikan pesanan dengan provider ini."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary-strong">
                    {(review.reviewer.name ?? "P").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      {review.reviewer.name}
                    </div>
                    <Link
                      href={`/service/${review.order.service.slug}`}
                      className="focus-ring block truncate rounded text-xs text-muted-foreground hover:text-primary-strong"
                    >
                      {review.order.service.title}
                    </Link>
                  </div>
                  <RatingStars
                    value={review.rating}
                    size="sm"
                    className="ml-auto"
                  />
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}
