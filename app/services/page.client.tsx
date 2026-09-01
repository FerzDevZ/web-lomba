"use client"

import * as React from "react"
import { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { PageShell } from "@/components/layout/page-shell"
import { SearchX, SlidersHorizontal, ChevronDown, X } from "lucide-react"
import {
  ServiceTile,
  ServiceTileSkeleton,
  type ServiceTileData,
} from "@/components/services/service-tile"
import {
  CatalogFilterPanel,
  CatalogFilterDrawer,
  type CatalogFilters,
  type CategoryOption,
} from "@/components/services/catalog-filters"

type ServiceItem = ServiceTileData & {
  description: string
  category: { id: string | number; name: string; slug: string }
}

type ServicesResponse = {
  services: ServiceItem[]
  total: number
  page: number
  totalPages: number
}

const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "popular", label: "Terlaris" },
  { value: "price-asc", label: "Harga Terendah" },
  { value: "price-desc", label: "Harga Tertinggi" },
  { value: "rating", label: "Rating Tertinggi" },
]

const EMPTY_FILTERS: CatalogFilters = {
  category: "",
  location: "",
  minPrice: "",
  maxPrice: "",
  rating: 0,
}

function useDebouncedValue<T>(value: T, delay = 500) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function CatalogSkeleton() {
  return (
    <PageShell className="py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="h-96 animate-pulse rounded-2xl bg-muted" />
        </aside>
        <div className="flex-1">
          <div className="mb-6 h-10 w-64 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ServiceTileSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  )
}

function CatalogContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const debouncedSearch = useDebouncedValue(search)
  const [filters, setFilters] = useState<CatalogFilters>({
    ...EMPTY_FILTERS,
    category: searchParams.get("category") ?? "",
  })
  const debouncedFilters = useDebouncedValue(filters, 400)
  const [sort, setSort] = useState("newest")
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Setiap perubahan filter mengembalikan ke halaman 1 — tanpa ini pengguna
  // bisa terjebak di halaman 5 dari hasil yang cuma punya 1 halaman.
  const updateFilters = useCallback((patch: Partial<CatalogFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }, [])

  const resetFilters = useCallback(() => {
    setSearch("")
    setFilters(EMPTY_FILTERS)
    setSort("newest")
    setPage(1)
  }, [])

  const { category, location, minPrice, maxPrice, rating } = debouncedFilters

  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (category) params.set("category", category)
    if (location) params.set("location", location)
    if (minPrice) params.set("minPrice", minPrice)
    if (maxPrice) params.set("maxPrice", maxPrice)
    if (rating) params.set("rating", String(rating))
    if (sort !== "newest") params.set("sort", sort)
    if (page > 1) params.set("page", String(page))
    const qs = params.toString()
    router.replace(qs ? `/services?${qs}` : "/services", { scroll: false })
  }, [
    debouncedSearch,
    category,
    location,
    minPrice,
    maxPrice,
    rating,
    sort,
    page,
    router,
  ])

  const { data: categories } = useQuery<CategoryOption[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories")
      if (!res.ok) throw new Error("Gagal memuat kategori")
      return res.json()
    },
  })

  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!sortOpen) return
    const onDown = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSortOpen(false) }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey) }
  }, [sortOpen])

  const { data, isLoading, isFetching, isError, error } = useQuery<ServicesResponse>({
    queryKey: [
      "services",
      debouncedSearch,
      category,
      location,
      minPrice,
      maxPrice,
      rating,
      sort,
      page,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({ sort, page: String(page) })
      if (debouncedSearch) params.append("search", debouncedSearch)
      if (category) params.append("category", category)
      if (location) params.append("location", location)
      if (minPrice) params.append("minPrice", minPrice)
      if (maxPrice) params.append("maxPrice", maxPrice)
      if (rating) params.append("rating", String(rating))
      // Validasi client-side untuk min>max (P1-6) — tangkap sebelum request
      if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
        throw new Error("Harga minimum tidak boleh lebih besar dari maksimum")
      }
      const res = await fetch(`/api/services?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error ?? "Gagal memuat jasa")
      }
      return res.json()
    },
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [page])

  const pageNumbers = (() => {
    const total = data?.totalPages ?? 1
    if (total <= 1) return []
    const start = Math.max(1, page - 2)
    const end = Math.min(total, start + 4)
    const nums: number[] = []
    for (let i = start; i <= end; i++) nums.push(i)
    return nums
  })()

  const activeFilterCount =
    (category ? 1 : 0) +
    (location ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (rating ? 1 : 0)

  const panelProps = {
    filters,
    categories,
    onChange: updateFilters,
    onReset: resetFilters,
  }

  return (
    <PageShell className="py-8 pb-24 lg:pb-8">
      {/* Judul halaman berada DI ATAS grid, bukan di dalam kolom hasil: dengan
          sidebar filter yang dirender lebih dulu di DOM, h2 "Filter" muncul
          sebelum h1 dan urutan heading jadi tidak logis untuk screen reader. */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jelajahi Jasa</h1>
          <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
            {isLoading
              ? "Memuat daftar jasa…"
              : `${data?.total ?? 0} jasa ditemukan`}
          </p>
        </div>
        <div ref={sortRef} className="relative shrink-0">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={sortOpen}
            aria-label="Urutkan jasa"
            id="sort-button"
            aria-controls="sort-listbox"
            onClick={() => setSortOpen((v) => !v)}
            className="focus-ring flex h-10 w-full items-center justify-between rounded-lg border border-input bg-card px-3 text-sm sm:w-48"
          >
            <span>{SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Terbaru"}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${sortOpen ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {sortOpen && (
            <div
              role="listbox"
              id="sort-listbox"
              aria-label="Urutkan jasa"
              aria-labelledby="sort-button"
              className="absolute right-0 top-full z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card shadow-card-lg sm:w-48"
              onKeyDown={(e) => { if (e.key === "Tab") setSortOpen(false) }}
            >
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  role="option"
                  id={`sort-option-${o.value}`}
                  aria-selected={o.value === sort}
                  onClick={() => { setSort(o.value); setPage(1); setSortOpen(false) }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSort(o.value); setPage(1); setSortOpen(false) }
                    if (e.key === "Escape") { e.preventDefault(); setSortOpen(false); (document.getElementById("sort-button") as HTMLElement)?.focus() }
                    if (e.key === "Tab") setSortOpen(false)
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      e.preventDefault()
                      const idx = SORT_OPTIONS.findIndex((x) => x.value === o.value)
                      const next = e.key === "ArrowDown" ? (idx + 1) % SORT_OPTIONS.length : (idx - 1 + SORT_OPTIONS.length) % SORT_OPTIONS.length
                      const el = sortRef.current?.querySelectorAll('[role="option"]')[next] as HTMLElement | undefined
                      el?.focus()
                    }
                    if (e.key === "Home") { e.preventDefault(); (sortRef.current?.querySelectorAll('[role="option"]')[0] as HTMLElement)?.focus() }
                    if (e.key === "End") { e.preventDefault(); const els = sortRef.current?.querySelectorAll('[role="option"]'); (els?.[els.length -1] as HTMLElement)?.focus() }
                  }}
                  tabIndex={o.value === sort ? 0 : -1}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${o.value === sort ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                >
                  {o.label}
                  {o.value === sort && <span aria-hidden>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="hidden w-64 shrink-0 lg:block">
          <CatalogFilterPanel
            {...panelProps}
            className="sticky top-24 rounded-2xl border border-border bg-card p-5"
          />
        </aside>

        <div className="min-w-0 flex-1">
          {/* Baris chip filter aktif — sticky, tanpa -mx-4 biar nggak overflow di 320 */}
          {activeFilterCount > 0 && data && data.services.length > 0 && (
            <div className="sticky top-16 z-10 mb-4 flex flex-wrap items-center gap-2 bg-background/80 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:mx-0">
              {category && categories && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary-strong">
                  {categories.find((c) => String(c.id) === category)?.name ?? category}
                  <button type="button" aria-label="Hapus filter kategori" onClick={() => updateFilters({ category: "" })} className="focus-ring ml-1 rounded-full p-0.5 hover:bg-primary/20"><X className="h-3 w-3" /></button>
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary-strong">
                  {location}
                  <button type="button" aria-label="Hapus filter lokasi" onClick={() => updateFilters({ location: "" })} className="focus-ring ml-1 rounded-full p-0.5 hover:bg-primary/20"><X className="h-3 w-3" /></button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary-strong">
                  Rp {minPrice || "0"} – Rp {maxPrice || "∞"}
                  <button type="button" aria-label="Hapus filter harga" onClick={() => updateFilters({ minPrice: "", maxPrice: "" })} className="focus-ring ml-1 rounded-full p-0.5 hover:bg-primary/20"><X className="h-3 w-3" /></button>
                </span>
              )}
              {rating > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rating/15 px-3 py-1 text-xs font-medium">
                  ≥ {rating}★
                  <button type="button" aria-label="Hapus filter rating" onClick={() => updateFilters({ rating: 0 })} className="focus-ring ml-1 rounded-full p-0.5 hover:bg-rating/20"><X className="h-3 w-3" /></button>
                </span>
              )}
              <button type="button" onClick={resetFilters} className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Hapus semua</button>
            </div>
          )}

          {/* Hasil katalog dalam wrapper yang memudar saat refetch (keepPreviousData)
              — bukan skeleton blink penuh. */}
          <div className={isFetching && !isLoading ? "opacity-60 transition-opacity" : undefined}>
          {/* Penutup wrapper opacity untuk keepPreviousData */}
          {isError ? (
            <div
              role="alert"
              className="rounded-2xl border border-destructive/30 bg-destructive/5 p-12 text-center"
            >
              <p className="font-semibold">Gagal memuat jasa</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {(error as Error)?.message ?? "Periksa koneksi Anda, lalu ubah salah satu filter untuk memuat ulang daftar."}
              </p>
              {minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice) && (
                <p className="mt-2 text-sm font-medium text-destructive-strong">Harga minimum melebihi maksimum — perbaiki filter harga.</p>
              )}
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ServiceTileSkeleton key={i} />
              ))}
            </div>
          ) : data?.services.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Tidak ada jasa yang cocok"
              description={
                location
                  ? `Tidak ada jasa di "${location}". Coba hapus filter harga/rating atau lihat jasa di Kepulauan Riau (3 jasa) & Bali.`
                  : "Kombinasi filter Anda terlalu sempit. Longgarkan rentang harga atau hapus filter rating."
              }
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" onClick={resetFilters}>
                    Reset Semua Filter
                  </Button>
                  {location && (
                    <Button variant="ghost" onClick={() => updateFilters({ location: "Kepulauan Riau" })}>
                      Lihat Kepulauan Riau
                    </Button>
                  )}
                </div>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data?.services.map((service, i) => (
                  <div
                    key={service.id}
                    className="animate-rise-in"
                    style={{ animationDelay: `${Math.min(i * 60, 280)}ms`, animationFillMode: "both" } as React.CSSProperties}
                  >
                    <ServiceTile service={service} showDescription />
                  </div>
                ))}
              </div>

              {(data?.totalPages ?? 0) > 1 && (
                <nav
                  className="mt-10 flex flex-wrap items-center justify-center gap-2"
                  aria-label="Navigasi halaman"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Sebelumnya
                  </Button>
                  {pageNumbers[0] > 1 && (
                    <>
                      <Button variant="outline" size="sm" className="min-w-9" onClick={() => setPage(1)}>1</Button>
                      {pageNumbers[0] > 2 && <span className="px-1 text-muted-foreground">…</span>}
                    </>
                  )}
                  {pageNumbers.map((n) => (
                    <Button
                      key={n}
                      variant={n === page ? "default" : "outline"}
                      size="sm"
                      className="min-w-9"
                      onClick={() => setPage(n)}
                      aria-current={n === page ? "page" : undefined}
                    >
                      {n}
                    </Button>
                  ))}
                  {pageNumbers[pageNumbers.length - 1] < (data?.totalPages ?? 1) && (
                    <>
                      {pageNumbers[pageNumbers.length - 1] < (data?.totalPages ?? 1) - 1 && <span className="px-1 text-muted-foreground">…</span>}
                      <Button variant="outline" size="sm" className="min-w-9" onClick={() => setPage(data?.totalPages ?? 1)}>{data?.totalPages}</Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= (data?.totalPages ?? 1)}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Berikutnya
                  </Button>
                </nav>
              )}
            </>
          )}
          </div>
        </div>
      </div>

      {/* Action bar mobile: glass + safe-area */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/80 px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <span className="shrink-0 text-xs text-muted-foreground sm:text-sm">
            {isLoading ? "Memuat…" : `${data?.total ?? 0} jasa`}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => setDrawerOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-2xs font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <CatalogFilterDrawer
        {...panelProps}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        resultCount={data?.total ?? 0}
      />
    </PageShell>
  )
}

export default function ServicesPageClient() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogContent />
    </Suspense>
  )
}
