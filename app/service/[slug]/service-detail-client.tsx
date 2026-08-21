"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Star,
  MessageSquare,
  Clock,
  MapPin,
  User,
  ShieldCheck,
  ArrowRight,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { SaveButton } from "@/components/services/save-button"
import { EmptyState } from "@/components/ui/empty-state"
import { PageShell } from "@/components/layout/page-shell"
import { RatingStars } from "@/components/services/rating-stars"
import { ServiceTile } from "@/components/services/service-tile"
import { formatIDR } from "@/lib/utils"
import Image from "next/image"

type ServiceItem = {
  id: number
  title: string
  slug: string
  description: string
  price: number
  deliveryTimeDays: number
  imageUrl: string | null
  ratingAvg: number
  totalReviews: number
  provider: { id: number; name: string | null; avatarUrl: string | null }
  category: { id: number; name: string; slug: string }
}

type ReviewItem = {
  id: number
  rating: number
  comment: string | null
  createdAt: string
  reviewer: { id: number; name: string | null; avatarUrl: string | null }
}

export default function ServiceDetailClient({
  service,
  related,
}: {
  service: ServiceItem
  related: ServiceItem[]
}) {
  const [activeTab, setActiveTab] = useState("description")

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

  return (
    <PageShell className="py-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Kiri: visual utama */}
        <div className="space-y-4">
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-accent">
            {service.imageUrl ? (
              <Image
                src={service.imageUrl}
                alt={service.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <User className="h-32 w-32 text-primary-strong/25" />
            )}
            <Badge className="absolute left-4 top-4 bg-card/90 text-foreground backdrop-blur">
              {service.category.name}
            </Badge>
          </div>
        </div>

        {/* Kanan: info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-4">
              <RatingStars
                value={service.ratingAvg}
                size="lg"
                showValue
                reviewCount={service.totalReviews}
              />
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {service.deliveryTimeDays} hari
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Lokal
              </div>
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
              {service.title}
            </h1>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <div className="text-4xl font-extrabold text-primary-strong">
              {formatIDR(service.price)}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              per jasa • estimasi selesai dalam {service.deliveryTimeDays} hari
            </div>
          </div>

          <div className="flex gap-3 max-md:flex-col">
            <Button size="lg" className="flex-1 shadow-glow" asChild>
              <Link href={checkoutHref}>Pesan Sekarang</Link>
            </Button>
            <SaveButton
              serviceId={service.id}
              size="lg"
              className="flex-1"
            />
            <Button size="lg" variant="outline" className="flex-1" asChild>
              <Link href={`/provider/${service.provider.id}`}>
                <MessageSquare aria-hidden="true" /> Lihat Provider
              </Link>
            </Button>
          </div>

          {/* Info provider → link ke profil */}
          <Link
            href={`/provider/${service.provider.id}`}
            className="focus-ring group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-extrabold text-primary-strong">
              {(service.provider.name ?? "P").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-bold transition-colors group-hover:text-primary-strong">
                {service.provider.name}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary-strong" />
                Penyedia terverifikasi — lihat profil
              </div>
            </div>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-base group-hover:translate-x-0.5 group-hover:text-primary-strong"
              aria-hidden
            />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Deskripsi</TabsTrigger>
            <TabsTrigger value="reviews">
              Ulasan ({service.totalReviews})
            </TabsTrigger>
            <TabsTrigger value="about">Tentang Provider</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-8">
            <div className="max-w-3xl leading-relaxed text-muted-foreground">
              <p className="text-base">{service.description}</p>
              <p className="mt-4 text-sm">
                Setelah pemesanan, Anda dapat menambahkan catatan kebutuhan dan
                berkomunikasi langsung dengan penyedia jasa melalui dashboard.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-8">
            <div className="max-w-3xl">
              <div className="mb-8 flex items-center gap-4 rounded-2xl border border-border bg-card p-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Star className="h-8 w-8 fill-rating text-rating" aria-hidden />
                </div>
                <div>
                  <div className="text-3xl font-extrabold">
                    {service.ratingAvg.toFixed(1)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    dari {service.totalReviews} ulasan
                  </p>
                </div>
              </div>

              {reviewsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl border border-border bg-card p-6">
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary-strong">
                          {(review.reviewer.name ?? "P")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
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

          <TabsContent value="about" className="mt-8">
            <Card className="max-w-3xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-extrabold text-primary-strong">
                    {(service.provider.name ?? "P").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {service.provider.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 text-primary-strong" />
                      Penyedia terverifikasi
                    </div>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  {service.provider.name} adalah penyedia jasa terverifikasi di
                  ServisLokal yang melayani pelanggan di kategori{" "}
                  {service.category.name.toLowerCase()} dengan komitmen
                  kualitas dan ketepatan waktu.
                </p>
                <Link href={`/provider/${service.provider.id}`}>
                  <Button variant="outline" className="mt-5">
                    Lihat Profil Provider
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Jasa serupa */}
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

      {/* Action bar mobile. Di desktop CTA sudah ada di kolom kanan, jadi bar
          ini hanya muncul di layar kecil — sebelumnya ia menutup konten di
          semua ukuran dan mengulang tombol yang sama dua kali. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <div className="min-w-0">
            <div className="text-2xs uppercase tracking-wide text-muted-foreground">
              Harga jasa
            </div>
            <div className="truncate text-lg font-extrabold text-primary-strong">
              {formatIDR(service.price)}
            </div>
          </div>
          <Button size="lg" className="ml-auto flex-1 shadow-glow" asChild>
            <Link href={checkoutHref}>Pesan Sekarang</Link>
          </Button>
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </PageShell>
  )
}
