"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { RadioCardGroup } from "@/components/ui/radio-card-group"
import { PageShell } from "@/components/layout/page-shell"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Landmark,
  Wallet,
  Banknote,
  SearchX,
} from "lucide-react"
import { toast } from "sonner"
import { formatIDR } from "@/lib/utils"

type ServiceDetail = {
  id: number
  title: string
  slug: string
  price: number
  deliveryTimeDays: number
  provider: { name: string | null }
}

const PAYMENT_METHODS = [
  {
    value: "transfer",
    label: "Bank Transfer",
    description: "BCA, Mandiri, BRI, Permata",
    icon: Landmark,
  },
  {
    value: "ewallet",
    label: "E-Wallet",
    description: "Dana • OVO • GoPay",
    icon: Wallet,
  },
  {
    value: "cod",
    label: "Cash on Delivery",
    description: "Bayar saat jasa selesai",
    icon: Banknote,
  },
] as const

type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"]

function CheckoutSkeleton() {
  return (
    <PageShell className="space-y-6 py-10">
      <Skeleton className="h-6 w-48" />
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </PageShell>
  )
}

function ServiceNotFound() {
  return (
    <PageShell width="prose" className="py-20">
      <EmptyState
        icon={SearchX}
        title="Jasa tidak ditemukan"
        description="Tautan checkout tidak menyertakan jasa yang valid, atau jasa sudah tidak tayang."
        action={
          <Link href="/services">
            <Button className="shadow-glow">Jelajahi Jasa</Button>
          </Link>
        }
      />
    </PageShell>
  )
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const slug = searchParams.get("service")

  const [notes, setNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transfer")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState<number | null>(null)

  const { data: service, isLoading } = useQuery<ServiceDetail>({
    queryKey: ["checkout-service", slug],
    queryFn: async () => {
      if (!slug) throw new Error("Jasa tidak ditemukan")
      const res = await fetch(`/api/services?slug=${slug}`)
      const data = await res.json()
      return data.services?.[0]
    },
    enabled: Boolean(slug),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!service) return
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          orderNotes: notes,
          paymentMethod,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        const msg =
          data?.error === "Unauthorized"
            ? "Silakan masuk terlebih dahulu."
            : data?.error ?? "Gagal membuat pesanan."
        setError(msg)
        toast.error("Gagal membuat pesanan", { description: msg })
        setSubmitting(false)
        return
      }

      setSuccess(data.id)
      toast.success("Pesanan berhasil dibuat!", {
        description: `Pesanan #${data.id} telah dibuat. Provider akan mengonfirmasi segera.`,
      })
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setError("Terjadi kesalahan. Coba lagi.")
      toast.error("Terjadi kesalahan", { description: "Coba lagi nanti." })
    }
    setSubmitting(false)
  }

  if (!slug) return <ServiceNotFound />

  if (success) {
    return (
      <PageShell width="prose" className="py-20">
        <Card className="text-center">
          <CardContent className="space-y-4 p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
              <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
            </div>
            <h1 className="text-3xl font-bold">Pesanan Berhasil Dibuat</h1>
            <p className="text-muted-foreground">
              Pesanan #{success} sudah masuk. Provider akan segera mengonfirmasi
              dan Anda bisa memantau progresnya di halaman pesanan.
            </p>
            <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
              <Link href={`/orders/${success}`}>
                <Button className="w-full shadow-glow sm:w-auto">
                  Lihat Pesanan Ini
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="outline" className="w-full sm:w-auto">
                  Jelajahi Lagi
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  if (isLoading) return <CheckoutSkeleton />
  if (!service) return <ServiceNotFound />

  return (
    <PageShell className="py-10 pb-28 lg:pb-10">
      <Link
        href={`/service/${service.slug}`}
        className="focus-ring mb-6 inline-flex items-center gap-1 rounded text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Kembali ke detail jasa
      </Link>

      <form
        onSubmit={handleSubmit}
        className="grid gap-8 lg:grid-cols-[1fr_380px]"
      >
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detail Pesanan</CardTitle>
              <CardDescription>
                Anda memesan jasa: {service.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-4 rounded-lg bg-muted/60 p-4">
                <div className="min-w-0">
                  <div className="font-medium">{service.title}</div>
                  <div className="text-sm text-muted-foreground">
                    Oleh {service.provider.name ?? "Provider"}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xl font-bold text-primary-strong">
                    {formatIDR(service.price)}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" aria-hidden />
                    Estimasi {service.deliveryTimeDays} hari
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan Tambahan (opsional)</Label>
                <Input
                  id="notes"
                  placeholder="Contoh: butuh jasa secepatnya, alamat lengkap..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  Beritahu provider detail kebutuhan Anda.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metode Pembayaran</CardTitle>
              <CardDescription>
                Simulasi — pembayaran asli akan diintegrasikan nanti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioCardGroup
                label="Metode pembayaran"
                options={[...PAYMENT_METHODS]}
                value={paymentMethod}
                onChange={setPaymentMethod}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle>Ringkasan Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Harga Jasa</span>
                <span className="font-medium">{formatIDR(service.price)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Biaya Layanan</span>
                <Badge variant="success">GRATIS</Badge>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary-strong">
                  {formatIDR(service.price)}
                </span>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive-strong"
                >
                  {error}
                </p>
              )}

              {/* Tombol utama disembunyikan di mobile: di layar kecil aksinya
                  ada di action bar sticky agar tidak jatuh di bawah lipatan. */}
              <Button
                type="submit"
                size="lg"
                className="hidden w-full lg:flex"
                disabled={submitting}
              >
                {submitting ? "Memproses..." : "Konfirmasi Pesanan"}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                Pembayaran diproses melalui kanal terenkripsi
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action bar mobile */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-4">
            <div className="min-w-0">
              <div className="text-2xs uppercase tracking-wide text-muted-foreground">
                Total
              </div>
              <div className="truncate text-lg font-bold text-primary-strong">
                {formatIDR(service.price)}
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              className="ml-auto flex-1 shadow-glow"
              disabled={submitting}
            >
              {submitting ? "Memproses..." : "Konfirmasi Pesanan"}
            </Button>
          </div>
        </div>
      </form>
    </PageShell>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutContent />
    </Suspense>
  )
}
