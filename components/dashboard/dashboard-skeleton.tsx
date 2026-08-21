import { Skeleton } from "@/components/ui/skeleton"

/**
 * Skeleton generik untuk halaman dashboard: header, deret KPI, lalu satu
 * panel besar. Dipakai oleh loading.tsx tiap segmen agar transisi rute tidak
 * menampilkan layar kosong.
 */
export function DashboardSkeleton({
  stats = 4,
  panels = 1,
}: {
  stats?: number
  panels?: number
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: stats }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>

      {Array.from({ length: panels }).map((_, i) => (
        <Skeleton key={i} className="h-72 rounded-2xl" />
      ))}
    </div>
  )
}
