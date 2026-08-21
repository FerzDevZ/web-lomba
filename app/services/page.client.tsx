"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { PageShell } from "@/components/layout/page-shell"
import { SearchX, SlidersHorizontal } from "lucide-react"
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
  category: { id: number; name: string; slug: string }
}

type ServicesResponse = {
  services: ServiceItem[]
  total: number
  page: number
  totalPages: number
}

const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
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

  const { data, isLoading, isError } = useQuery<ServicesResponse>({
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
      const res = await fetch(`/api/services?${params.toString()}`)
      if (!res.ok) throw new Error("Gagal memuat jasa")
      return res.json()
    },
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
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value)
            setPage(1)
          }}
          className="focus-ring h-10 shrink-0 rounded-lg border border-input bg-card px-3 text-sm"
          aria-label="Urutkan jasa"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="hidden w-64 shrink-0 lg:block">
          <CatalogFilterPanel
            {...panelProps}
            className="sticky top-24 rounded-2xl border border-border bg-card p-5"
          />
        </aside>

        <div className="min-w-0 flex-1">

          {isError ? (
            <div
              role="alert"
              className="rounded-2xl border border-destructive/30 bg-destructive/5 p-12 text-center"
            >
              <p className="font-semibold">Gagal memuat jasa</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Periksa koneksi Anda, lalu ubah salah satu filter untuk memuat
                ulang daftar.
              </p>
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
              description="Kombinasi filter Anda terlalu sempit. Longgarkan rentang harga atau hapus filter rating."
              action={
                <Button variant="outline" onClick={resetFilters}>
                  Reset Semua Filter
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data?.services.map((service) => (
                  <ServiceTile key={service.id} service={service} showDescription />
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

      {/* Action bar mobile: filter tidak lagi mendorong hasil ke bawah lipatan */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {isLoading ? "Memuat…" : `${data?.total ?? 0} jasa`}
          </span>
          <Button
            variant="outline"
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
