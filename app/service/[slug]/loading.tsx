import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <Skeleton className="aspect-video rounded-2xl" />
        <div className="space-y-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-24 rounded-2xl" />
          <div className="flex gap-3">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 flex-1" />
          </div>
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
      <Skeleton className="mt-16 h-12 w-full max-w-3xl" />
      <Skeleton className="mt-8 h-64 rounded-2xl" />
    </div>
  )
}
