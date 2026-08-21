"use client"

import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Heart, Star, Clock, Trash2 } from "lucide-react"
import { formatIDR } from "@/lib/utils"
import { getCategoryIcon } from "@/lib/category-icons"
import Image from "next/image"

type SavedServiceItem = {
  id: number
  title: string
  slug: string
  price: number
  deliveryTimeDays: number
  imageUrl: string | null
  ratingAvg: number
  totalReviews: number
  provider: { name: string | null }
  category: { id: number; name: string; slug: string }
}

// Daftar jasa yang disimpan pelanggan (wishlist)
export function SavedServices() {
  const queryClient = useQueryClient()

  const { data: saved, isLoading } = useQuery<SavedServiceItem[]>({
    queryKey: ["saved-services"],
    queryFn: async () => {
      const res = await fetch("/api/saved")
      if (!res.ok) throw new Error("Gagal memuat jasa tersimpan")
      return res.json()
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId }),
      })
      if (!res.ok) throw new Error("Gagal menghapus")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-services"] })
    },
  })

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary-strong" />
          Jasa Disimpan
        </CardTitle>
        <span className="text-sm text-muted-foreground">
          {isLoading ? "..." : `${saved?.length ?? 0} jasa`}
        </span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : saved?.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Belum ada jasa tersimpan"
            description="Tekan tombol Simpan di halaman detail jasa untuk menandai jasa favorit Anda."
            action={
              <Link href="/services">
                <Button variant="outline">Jelajahi Jasa</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {saved?.map((service) => {
              const Icon = getCategoryIcon(service.category.slug)
              return (
                <div
                  key={service.id}
                  className="group flex items-center gap-4 rounded-2xl border border-border p-4 transition-shadow duration-base hover:shadow-card"
                >
                  <Link
                    href={`/service/${service.slug}`}
                    aria-label={`Buka ${service.title}`}
                    className="focus-ring relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent text-primary-strong"
                  >
                    {service.imageUrl ? (
                      <Image
                        src={service.imageUrl}
                        alt={service.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <Icon className="h-6 w-6" aria-hidden />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/service/${service.slug}`}
                      className="focus-ring block truncate rounded font-semibold transition-colors hover:text-primary-strong"
                    >
                      {service.title}
                    </Link>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-rating text-rating" />
                        {service.ratingAvg.toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {service.deliveryTimeDays} hari
                      </span>
                      <span className="font-semibold text-primary-strong">
                        {formatIDR(service.price)}
                      </span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Hapus dari simpanan"
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(service.id)}
                    className="shrink-0 text-muted-foreground hover:text-destructive-strong"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
