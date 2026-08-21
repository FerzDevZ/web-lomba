"use client"

import * as React from "react"
import { SlidersHorizontal, MapPin, Star, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type CatalogFilters = {
  category: string
  location: string
  minPrice: string
  maxPrice: string
  rating: number
}

export type CategoryOption = {
  id: number
  name: string
  slug: string
  _count: { services: number }
}

/**
 * Panel filter katalog. Dipisah dari page.client.tsx supaya markup yang sama
 * bisa dipakai dua kali: sidebar sticky di desktop dan drawer di mobile —
 * sebelumnya panel ini menumpuk di atas hasil di layar kecil sehingga daftar
 * jasa terdorong jauh ke bawah lipatan.
 */
export function CatalogFilterPanel({
  filters,
  categories,
  onChange,
  onReset,
  className,
}: {
  filters: CatalogFilters
  categories: CategoryOption[] | undefined
  onChange: (patch: Partial<CatalogFilters>) => void
  onReset: () => void
  className?: string
}) {
  const { category, location, minPrice, maxPrice, rating } = filters

  return (
    <div className={cn("space-y-8", className)}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filter
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="focus-ring rounded text-xs font-medium text-primary-strong hover:underline"
        >
          Reset
        </button>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-muted-foreground">Kategori</p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onChange({ category: "" })}
            aria-pressed={category === ""}
            className={`focus-ring w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              category === ""
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            Semua
          </button>
          {categories?.map((cat) => {
            const active = category === String(cat.id)
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onChange({ category: String(cat.id) })}
                aria-pressed={active}
                className={`focus-ring flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <span className="truncate">{cat.name}</span>
                <span
                  className={`shrink-0 text-xs tabular-nums ${
                    active ? "text-primary-foreground/70" : "text-muted-foreground/60"
                  }`}
                >
                  {cat._count.services}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-muted-foreground">Lokasi</p>
        <div className="relative">
          <MapPin
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="text"
            placeholder="Kota, mis. Jakarta"
            value={location}
            onChange={(e) => onChange({ location: e.target.value })}
            className="pl-9"
            aria-label="Filter lokasi"
          />
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          Rentang Harga
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value })}
            aria-label="Harga minimum"
          />
          <span className="text-muted-foreground" aria-hidden>
            –
          </span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
            aria-label="Harga maksimum"
          />
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          Rating Minimal
        </p>
        <div className="flex gap-1" role="group" aria-label="Filter rating minimal">
          {[4.5, 4, 3].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange({ rating: rating === r ? 0 : r })}
              aria-pressed={rating === r}
              className={`focus-ring flex items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                rating === r
                  ? "bg-rating text-background"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              <Star className="h-3 w-3 fill-current" aria-hidden />
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Drawer filter untuk mobile. */
export function CatalogFilterDrawer({
  open,
  onOpenChange,
  resultCount,
  ...panelProps
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  resultCount: number
} & React.ComponentProps<typeof CatalogFilterPanel>) {
  React.useEffect(() => {
    if (!open) return
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filter jasa"
        className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl border-t border-border bg-background"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="font-semibold">Filter</span>
          <button
            type="button"
            aria-label="Tutup filter"
            onClick={() => onOpenChange(false)}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <CatalogFilterPanel {...panelProps} />
        </div>

        <div className="border-t border-border p-4">
          <Button
            className="w-full shadow-glow"
            onClick={() => onOpenChange(false)}
          >
            Lihat {resultCount} Jasa
          </Button>
        </div>
      </div>
    </div>
  )
}
