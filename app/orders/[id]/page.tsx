"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Package,
  User,
  FileText,
  CalendarDays,
  CreditCard,
} from "lucide-react"
import { formatIDR } from "@/lib/utils"
import { MessageThread } from "@/components/orders/message-thread"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { OrderTimeline } from "@/components/orders/order-timeline"
import { ReviewForm, ReviewSubmitted } from "@/components/orders/review-form"
import { OrderDetailSkeleton } from "@/components/orders/order-detail-skeleton"
import { PageShell } from "@/components/layout/page-shell"
import {
  canTransition,
  isOrderStatus,
  type OrderStatus,
} from "@/lib/order-status"

type OrderDetail = {
  id: number
  totalPrice: number
  status: OrderStatus
  paymentMethod: string | null
  orderNotes: string | null
  createdAt: string
  customer: { id: number; name: string | null; avatarUrl: string | null }
  service: {
    id: number
    title: string
    slug: string
    provider: { id: number; name: string | null; avatarUrl: string | null }
    category: { name: string }
  }
  reviews: { id: number; rating: number; comment: string | null }[]
}

const PAYMENT_LABEL: Record<string, string> = {
  transfer: "Bank Transfer",
  ewallet: "E-Wallet",
  cod: "Cash on Delivery",
}

function OrderDetailContent() {
  const params = useParams()
  const orderId = params.id as string
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const { data: order, isLoading } = useQuery<OrderDetail>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) throw new Error("Gagal memuat pesanan")
      return res.json()
    },
  })

  if (isLoading) return <OrderDetailSkeleton />

  if (!order) {
    return (
      <PageShell width="prose" className="py-24 text-center">
        <p className="font-medium">Pesanan tidak ditemukan.</p>
        <Link href="/dashboard">
          <Button className="mt-4" variant="outline">
            Kembali ke Dashboard
          </Button>
        </Link>
      </PageShell>
    )
  }

  const userId = Number(session?.user?.id)
  const isCustomer = order.customer.id === userId
  const isProvider = order.service.provider.id === userId
  const alreadyReviewed = order.reviews.length > 0

  const updateStatus = async (next: OrderStatus) => {
    if (!isOrderStatus(order.status) || !canTransition(order.status, next)) {
      setError("Transisi status tidak diizinkan")
      return
    }
    setBusy(true)
    setError("")
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "Gagal memperbarui status")
      setBusy(false)
      return
    }
    queryClient.invalidateQueries({ queryKey: ["order", orderId] })
    queryClient.invalidateQueries({ queryKey: ["customer-orders"] })
    queryClient.invalidateQueries({ queryKey: ["provider-orders"] })
    setBusy(false)
  }

  const submitReview = async (rating: number, comment: string) => {
    if (rating === 0) {
      setError("Pilih rating 1–5 dulu.")
      return
    }
    setBusy(true)
    setError("")
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, rating, comment }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "Gagal mengirim ulasan")
      setBusy(false)
      return
    }
    queryClient.invalidateQueries({ queryKey: ["order", orderId] })
    queryClient.invalidateQueries({ queryKey: ["customer-orders"] })
    setBusy(false)
  }

  return (
    <PageShell width="prose" className="py-8">
      <Link
        href="/dashboard"
        className="focus-ring mb-6 inline-flex items-center gap-1 rounded-lg text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Kembali ke dashboard
      </Link>

      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Pesanan #{order.id}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Dibuat{" "}
          {new Date(order.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive-strong"
        >
          {error}
        </p>
      )}

      <div className="space-y-6">
        <OrderTimeline status={order.status} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detail Jasa</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/service/${order.service.slug}`}
              className="focus-ring group flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="min-w-0">
                <Badge variant="outline" className="mb-2">
                  {order.service.category.name}
                </Badge>
                <div className="font-semibold group-hover:text-primary-strong">
                  {order.service.title}
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4 shrink-0" aria-hidden />
                  {isProvider
                    ? `Pemesan: ${order.customer.name ?? "Customer"}`
                    : `Penyedia: ${order.service.provider.name ?? "Provider"}`}
                </div>
              </div>
              <div className="shrink-0 text-right text-lg font-extrabold text-primary-strong">
                {formatIDR(order.totalPrice)}
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4" aria-hidden /> Metode pembayaran
              </span>
              <span className="font-medium">
                {PAYMENT_LABEL[order.paymentMethod ?? ""] ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4" aria-hidden /> Tanggal pesanan
              </span>
              <span className="font-medium">
                {new Date(order.createdAt).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4 shrink-0" aria-hidden /> Catatan
              </span>
              <span className="max-w-[60%] text-right font-medium">
                {order.orderNotes || "Tidak ada catatan"}
              </span>
            </div>
          </CardContent>
        </Card>

        {isCustomer && order.status === "PENDING" && (
          <Card className="border-destructive/30">
            <CardContent className="flex flex-col items-start justify-between gap-3 p-6 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground">
                Masih menunggu konfirmasi provider? Anda bisa membatalkan pesanan.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-destructive/40 text-destructive-strong hover:bg-destructive/10"
                disabled={busy}
                onClick={() => updateStatus("CANCELLED")}
              >
                <XCircle /> Batalkan Pesanan
              </Button>
            </CardContent>
          </Card>
        )}

        {isProvider && order.status === "PENDING" && (
          <Button
            size="lg"
            className="w-full shadow-glow"
            disabled={busy}
            onClick={() => updateStatus("IN_PROGRESS")}
          >
            <Package /> Terima &amp; Mulai Kerjakan
          </Button>
        )}
        {isProvider && order.status === "IN_PROGRESS" && (
          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            disabled={busy}
            onClick={() => updateStatus("COMPLETED")}
          >
            <CheckCircle2 /> Tandai Selesai
          </Button>
        )}

        <MessageThread
          orderId={order.id}
          otherName={
            isProvider
              ? (order.customer.name ?? "Customer")
              : (order.service.provider.name ?? "Provider")
          }
        />

        {isCustomer && order.status === "COMPLETED" && !alreadyReviewed && (
          <ReviewForm busy={busy} onSubmit={submitReview} />
        )}

        {alreadyReviewed && (
          <ReviewSubmitted rating={order.reviews[0].rating} />
        )}
      </div>
    </PageShell>
  )
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <OrderDetailContent />
    </Suspense>
  )
}
