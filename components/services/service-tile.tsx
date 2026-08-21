import Link from "next/link"
import Image from "next/image"
import { Star, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatIDR } from "@/lib/utils"
import { getCategoryIcon } from "@/lib/category-icons"
import { cn } from "@/lib/utils"

export type ServiceTileData = {
  id: number
  title: string
  slug: string
  description?: string | null
  price: number
  deliveryTimeDays: number
  imageUrl: string | null
  ratingAvg: number
  totalReviews: number
  provider: { name: string | null }
  category: { name: string; slug: string }
}

/**
 * Kartu jasa tunggal untuk seluruh grid katalog: landing, /services,
 * profil provider, dan "jasa terkait". Markup yang sama sebelumnya disalin
 * di empat tempat dengan tinggi gambar, radius, dan info berbeda-beda —
 * itu sebabnya kartu jasa terlihat tidak sama antar halaman.
 *
 * `media` mengatur tinggi area visual saja; sisanya identik di semua tempat.
 */
export function ServiceTile({
  service,
  media = "md",
  showDescription = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  className,
}: {
  service: ServiceTileData
  media?: "sm" | "md"
  showDescription?: boolean
  sizes?: string
  className?: string
}) {
  const Icon = getCategoryIcon(service.category.slug)
  const mediaHeight = media === "sm" ? "h-36" : "h-44"

  return (
    <Link
      href={`/service/${service.slug}`}
      className={cn(
        "focus-ring group block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-base hover:-translate-y-1 hover:shadow-card-lg",
        className
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-accent",
          mediaHeight
        )}
      >
        {service.imageUrl ? (
          <Image
            src={service.imageUrl}
            alt={service.title}
            fill
            sizes={sizes}
            className="object-cover"
          />
        ) : (
          <Icon
            className="h-16 w-16 text-primary-strong/25 transition-transform duration-slow group-hover:scale-110"
            aria-hidden
          />
        )}
        <Badge className="absolute left-4 top-4 bg-card/90 text-foreground backdrop-blur">
          {service.category.name}
        </Badge>
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-xs font-semibold backdrop-blur">
          <Star className="h-3 w-3 fill-rating text-rating" aria-hidden />
          {service.ratingAvg > 0 ? service.ratingAvg.toFixed(1) : "Baru"}
          {service.totalReviews > 0 && (
            <span className="font-normal text-muted-foreground">
              ({service.totalReviews})
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <h3 className="line-clamp-2 font-bold leading-snug transition-colors group-hover:text-primary-strong">
          {service.title}
        </h3>

        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <span
            aria-hidden
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xs font-bold text-primary-strong"
          >
            {(service.provider.name ?? "P").charAt(0).toUpperCase()}
          </span>
          <span className="truncate">{service.provider.name ?? "Provider"}</span>
        </div>

        {showDescription && service.description && (
          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
            {service.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {service.deliveryTimeDays} hari
          </span>
          <span className="text-lg font-extrabold text-primary-strong">
            {formatIDR(service.price)}
          </span>
        </div>
      </div>
    </Link>
  )
}

/** Skeleton dengan proporsi sama seperti ServiceTile. */
export function ServiceTileSkeleton({ media = "md" }: { media?: "sm" | "md" }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div
        className={cn(
          "animate-pulse bg-muted",
          media === "sm" ? "h-36" : "h-44"
        )}
      />
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
