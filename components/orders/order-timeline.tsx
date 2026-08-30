import { CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ORDER_STEPS, statusShortLabel, type OrderStatus } from "@/lib/order-status"

const STEP_LABEL: Record<string, string> = {
  PENDING: "Dipesan",
  IN_PROGRESS: "Dikerjakan",
  COMPLETED: "Selesai",
}

/**
 * Timeline progres pesanan. CANCELLED bukan langkah lanjutan, jadi saat
 * dibatalkan seluruh jalur ditampilkan redup dengan catatan terpisah —
 * bukan sebagai step keempat yang menyesatkan.
 */
export function OrderTimeline({ status }: { status: OrderStatus }) {
  const cancelled = status === "CANCELLED"
  const currentStep = ORDER_STEPS.indexOf(status)

  return (
    <Card>
      <CardContent className="p-6">
        <ol
          className="flex items-center"
          aria-label={`Progres pesanan: ${statusShortLabel(status)}`}
        >
          {ORDER_STEPS.map((step, i) => {
            const done = !cancelled && (currentStep > i || status === step)
            return (
              <li key={step} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <div className="relative flex flex-col items-center">
                    <div
                      aria-current={status === step ? "step" : undefined}
                      className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : status === step && !cancelled
                            ? "border-primary bg-primary/10 text-primary-strong"
                            : "border-border bg-card text-muted-foreground"
                      } ${status === step && !cancelled ? "ring-2 ring-primary/20" : ""}`}
                    >
                      {done ? (
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`mt-2 text-2xs font-medium ${
                      done ? "text-foreground" : "text-muted-foreground"
                    } ${status === step ? "text-primary-strong" : ""}`}
                  >
                    {STEP_LABEL[step]}
                  </span>
                </div>
                {i < ORDER_STEPS.length - 1 && (
                  <div
                    aria-hidden
                    className={`mx-2 mb-6 h-0.5 flex-1 rounded-full transition-colors duration-500 ${
                      !cancelled && currentStep > i ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </li>
            )
          })}
        </ol>

        {cancelled && (
          <p className="mt-4 flex items-center gap-2 text-sm text-destructive-strong">
            <XCircle className="h-4 w-4 shrink-0" aria-hidden /> Pesanan ini
            dibatalkan.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
