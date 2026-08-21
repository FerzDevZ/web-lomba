import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const TONES = {
  primary: "bg-primary/10 text-primary-strong",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  muted: "bg-muted text-muted-foreground",
} as const

/**
 * Kartu statistik dashboard. Sebelumnya blok 15-baris yang sama disalin
 * empat kali per dashboard dengan warna hardcoded berbeda-beda.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
  className,
}: {
  label: string
  value: React.ReactNode
  icon: LucideIcon
  tone?: keyof typeof TONES
  hint?: string
  className?: string
}) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 truncate text-2xl font-bold tabular-nums">
              {value}
            </p>
            {hint && (
              <p className="mt-1 text-2xs text-muted-foreground">{hint}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              TONES[tone]
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
