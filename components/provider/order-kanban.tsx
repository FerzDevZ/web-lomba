"use client"

import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"
import { formatIDR } from "@/lib/utils"
import {
  canTransition,
  isOrderStatus,
  statusShortLabel,
  type OrderStatus,
} from "@/lib/order-status"

export type ProviderOrder = {
  id: number
  totalPrice: number
  status: string
  createdAt: string
  orderNotes: string | null
  service: { title: string; slug: string }
}

// Titik warna kolom memakai token status yang sama dengan OrderStatusBadge,
// jadi indikator dan badge tidak pernah bercerita hal berbeda.
const COLUMNS: { key: OrderStatus; dot: string }[] = [
  { key: "PENDING", dot: "bg-warning" },
  { key: "IN_PROGRESS", dot: "bg-info" },
  { key: "COMPLETED", dot: "bg-success" },
]

/**
 * Kanban pesanan provider: Menunggu → Dikerjakan → Selesai dengan tombol
 * kontekstual per kartu (zona 2 di docs/PLANNING-UIUX.md).
 *
 * Sebelum ini kanban hanya ada di ProviderDashboard.tsx yang tidak pernah
 * diimpor siapa pun, jadi provider harus membuka halaman detail tiap pesanan
 * hanya untuk menekan "Terima & Kerjakan" — aksi paling sering mereka lakukan.
 *
 * FSM di lib/order-status memblokir transisi ilegal sebelum request dikirim.
 */
export function OrderKanban() {
  const queryClient = useQueryClient()

  const { data: orders, isLoading } = useQuery<ProviderOrder[]>({
    queryKey: ["provider-orders"],
    queryFn: async () => {
      const res = await fetch("/api/provider/orders")
      if (!res.ok) throw new Error("Gagal memuat pesanan")
      return res.json()
    },
  })

  const statusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: number
      status: OrderStatus
    }) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? "Gagal memperbarui status pesanan")
      }
      return res.json()
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["provider-orders"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success(
        variables.status === "COMPLETED"
          ? "Pesanan ditandai selesai"
          : "Pesanan diterima dan mulai dikerjakan"
      )
    },
    onError: (error: Error) => {
      toast.error("Gagal memperbarui status", { description: error.message })
    },
  })

  const busyId = statusMutation.isPending
    ? statusMutation.variables?.orderId
    : undefined

  const updateStatus = (order: ProviderOrder, next: OrderStatus) => {
    if (!isOrderStatus(order.status) || !canTransition(order.status, next)) {
      toast.error("Transisi status tidak diizinkan")
      return
    }
    statusMutation.mutate({ orderId: order.id, status: next })
  }

  const all = orders ?? []

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {COLUMNS.map((col) => {
        const items = all.filter((o) => o.status === col.key)
        return (
          <section key={col.key} aria-label={statusShortLabel(col.key)}>
            <div className="mb-3 flex items-center gap-2">
              <span
                aria-hidden
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${col.dot}`}
              />
              <h3 className="font-semibold">{statusShortLabel(col.key)}</h3>
              <Badge variant="outline">{items.length}</Badge>
            </div>

            <div className="space-y-3 rounded-2xl bg-muted/50 p-3">
              {isLoading ? (
                <>
                  <Skeleton className="h-24 rounded-lg" />
                  <Skeleton className="h-24 rounded-lg" />
                </>
              ) : items.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Tidak ada pesanan di kolom ini.
                </p>
              ) : (
                items.map((order) => {
                  const busy = busyId === order.id
                  return (
                    <article
                      key={order.id}
                      className="rounded-lg border border-border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/orders/${order.id}`}
                          className="focus-ring rounded font-medium leading-snug hover:text-primary-strong"
                        >
                          {order.service.title}
                        </Link>
                        <div className="shrink-0 text-sm font-bold text-primary-strong">
                          {formatIDR(order.totalPrice)}
                        </div>
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Pesanan #{order.id} •{" "}
                        {new Date(order.createdAt).toLocaleDateString("id-ID")}
                      </p>

                      {order.orderNotes && (
                        <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs">
                          {order.orderNotes}
                        </p>
                      )}

                      {order.status === "PENDING" && (
                        <Button
                          size="sm"
                          className="mt-3 w-full"
                          disabled={busy}
                          onClick={() => updateStatus(order, "IN_PROGRESS")}
                        >
                          {busy && (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          )}
                          Terima &amp; Kerjakan
                        </Button>
                      )}

                      {order.status === "IN_PROGRESS" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="mt-3 w-full"
                          disabled={busy}
                          onClick={() => updateStatus(order, "COMPLETED")}
                        >
                          {busy && (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          )}
                          Tandai Selesai
                        </Button>
                      )}
                    </article>
                  )
                })
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
