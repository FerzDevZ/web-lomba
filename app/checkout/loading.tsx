import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageShell } from "@/components/layout/page-shell"

export default function Loading() {
  return (
    <PageShell className="py-10">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-6 h-9 w-72" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-5 w-40" />
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit">
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
