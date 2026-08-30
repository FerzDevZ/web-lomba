// @ts-nocheck
"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { cityFromLocation } from "@/lib/location"
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
  Clock,
  Landmark,
  Wallet,
  Banknote,
  SearchX,
  Loader2,
  ShieldCheck,
  MessageSquare,
  Star,
  Share2,
  CalendarDays,
  MapPin,
} from "lucide-react"
import { toast } from "sonner"
import { formatIDR } from "@/lib/utils"

type ServiceDetail = {
  id: string | number
  title: string
  slug: string
  price: number
  deliveryTimeDays: number
  imageUrl: string | null
  provider: { id: string | number; name: string | null }
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
    label: "Bayar di Tempat",
    description: "Bayar saat jasa selesai",
    icon: Banknote,
  },
] as const

type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"]

// Instruksi lanjutan per metode — tampil saat kartu dipilih agar pengguna
// tahu apa yang terjadi setelah konfirmasi, bukan hanya "pilih dan selesai".
const PAYMENT_DETAILS: Record<PaymentMethod, string> = {
  transfer:
    "Setelah konfirmasi, nomor virtual account akan muncul di halaman pesanan. Status pesanan otomatis terkonfirmasi setelah transfer diverifikasi.",
  ewallet:
    "Kamu akan diarahkan ke aplikasi dompet digital untuk menyetujui pembayaran. Pastikan saldo mencukupi sebelum melanjutkan.",
  cod: "Siapkan pembayaran tunai atau QRIS saat pekerjaan selesai. Provider akan mengonfirmasi penerimaan pembayaran di tempat.",
}

// Janji platform yang benar-benar dijalankan aplikasi ini — bukan klaim
// escrow palsu: pembatalan bebas selama PENDING memang diizinkan FSM.
const TRUST_POINTS = [
  { icon: ShieldCheck, text: "Bisa dibatalkan gratis selama belum dikerjakan" },
  { icon: MessageSquare, text: "Koordinasi jadwal & alamat via pesan" },
  { icon: Star, text: "Rating dan ulasan hanya dari pelanggan asli" },
] as const

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

/* Angka nomor pesanan naik dari 0 — momen "pesananmu sudah ada nomornya".
   rAF murni tanpa dependensi; reduced-motion dibiarkan karena ini animasi
   singkat berbasis angka, bukan gerakan besar. */
function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!Number.isFinite(target)) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setValue(target)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(eased * target))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, durationMs])

  return value
}

function CheckoutSuccess({ orderId }: { orderId: string | number }) {
  const displayId = useCountUp(orderId)

  // Konfeti hanya sekali saat mount. Warna diambil dari palet brand.
  // Dimatikan total bila pengguna memilih reduced-motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let cancelled = false
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return
      const colors = ["#F97316", "#FB7A23", "#FBBF24", "#FBFAF8"]
      confetti({
        particleCount: 90,
        spread: 75,
        startVelocity: 38,
        origin: { y: 0.35 },
        colors,
        disableForReducedMotion: true,
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const waText = encodeURIComponent(
    `Pesanan #${orderId} di ServisLokal berhasil dibuat! Menunggu konfirmasi provider.`
  )

  return (
    <PageShell width="prose" className="py-20">
      <Card className="overflow-hidden text-center">
        <div className="bg-brand-gradient h-1.5 w-full" aria-hidden />
        <CardContent className="space-y-5 p-10">
          <div className="animate-success-pop mx-auto" aria-hidden>
            <svg
              className="mx-auto h-20 w-20"
              viewBox="0 0 52 52"
              fill="none"
              role="img"
              aria-label="Pesanan berhasil"
            >
              <circle
                className="animate-check-circle"
                cx="26"
                cy="26"
                r="24"
                stroke="hsl(var(--success))"
                strokeWidth="2.5"
                fill="hsl(var(--success-soft))"
              />
              <path
                className="animate-check-mark"
                d="M15 27l7 7 15-16"
                stroke="hsl(var(--success))"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>

          <div className="animate-rise-in stagger-1">
            <h1 className="text-3xl font-bold">Pesanan Berhasil Dibuat</h1>
            <p className="mt-2 text-muted-foreground">
              Nomor pesanan Anda{" "}
              <span className="font-bold tabular-nums text-foreground">
                #{displayId}
              </span>{" "}
              sudah masuk. Provider akan segera mengonfirmasi — pantau
              progresnya lewat halaman pesanan atau pesan langsung.
            </p>
          </div>

          <div className="animate-rise-in stagger-2 flex flex-col justify-center gap-3 pt-2 sm:flex-row">
            <Link href={`/orders/${orderId}`}>
              <Button className="w-full shadow-glow sm:w-auto">
                Lihat Pesanan Ini
              </Button>
            </Link>
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <a
                href={`https://wa.me/?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Share2 className="h-4 w-4" aria-hidden />
                Bagikan via WhatsApp
              </a>
            </Button>
          </div>

          <div className="animate-rise-in stagger-3 pt-2">
            <Link
              href="/services"
              className="focus-ring text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              atau jelajahi jasa lain
            </Link>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const slug = searchParams.get("service")

  const [address, setAddress] = useState("")
  const [addressTouched, setAddressTouched] = useState(false)
  const [deadline, setDeadline] = useState("")
  const [notes, setNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transfer")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState<number | null>(null)

  const { data: session } = useSession()

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

  const isOwnService = Boolean(service && session?.user?.id && String(service.provider.id) === String(session.user.id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!service) return
    if (!address.trim()) {
      setError("Alamat pelaksanaan wajib diisi agar provider tahu lokasi kerja.")
      toast.error("Alamat belum diisi", {
        description: "Provider butuh alamat untuk datang ke lokasi.",
      })
      return
    }
    if (!cityFromLocation(address)) {
      setError("Sertakan kota & provinsi — contoh: Pangkal Pinang, Kepulauan Bangka Belitung")
      toast.error("Alamat belum lengkap", {
        description: "Sertakan kota & provinsi agar provider bisa datang (nasional 38 provinsi).",
      })
      setAddressTouched(true)
      return
    }
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          orderNotes: notes || undefined,
          address,
          deadline: deadline ? new Date(`${deadline}T09:00:00`) : undefined,
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

  if (success) return <CheckoutSuccess orderId={success} />

  if (isLoading) return <CheckoutSkeleton />
  if (!service) return <ServiceNotFound />

  if (isOwnService) {
    return (
      <PageShell width="prose" className="py-20">
        <EmptyState
          icon={SearchX}
          title="Tidak bisa memesan jasa sendiri"
          description="Anda adalah pemilik jasa ini. Silakan kelola jasa dari dashboard provider atau cari jasa lain."
          action={
            <div className="flex gap-3">
              <Link href="/dashboard/provider"><Button variant="outline">Ke Dashboard</Button></Link>
              <Link href="/services"><Button>Jelajahi Jasa</Button></Link>
            </div>
          }
        />
      </PageShell>
    )
  }

  // Tanggal minimal besok — jasa lokal tidak pernah dikerjakan "kemarin".
  const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]

  const submitButton = (className?: string, variant: "primary" | "secondary" = "primary") => (
    <Button
      type="submit"
      size="lg"
      variant={variant === "secondary" ? "outline" : "default"}
      className={className}
      disabled={submitting || isOwnService}
    >
      {submitting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Memproses...
        </>
      ) : (
        "Konfirmasi Pesanan"
      )}
    </Button>
  )

  return (
    <PageShell className="py-10 pb-28 lg:pb-10">
      <div className="mx-auto mb-6 h-1.5 w-full max-w-[min(28rem,calc(100vw-32px))] overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 rounded-full bg-primary transition-[width] duration-300 ease-smooth" aria-hidden />
      </div>
      {/* Stepper 2 langkah — nasional: jelas, tidak menipu */}
      <div className="mb-6 flex items-center justify-center gap-1.5 text-xs font-medium sm:gap-2" aria-label="Langkah checkout">
        <span className="flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-2xs">1</span> Detail Jasa
        </span>
        <span className="h-px w-8 max-w-8 flex-1 bg-border" aria-hidden />
        <span className="flex items-center gap-1.5 whitespace-nowrap text-primary-strong" aria-current="step">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-2xs font-bold text-primary-foreground">2</span> Alamat &amp; Bayar
        </span>
      </div>

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
                <div className="flex min-w-0 items-center gap-3">
                  {service.imageUrl && (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={service.imageUrl}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium">{service.title}</div>
                    <div className="text-sm text-muted-foreground">
                      Oleh {service.provider.name ?? "Provider"}
                    </div>
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
                <Label htmlFor="address">
                  Alamat Pelaksanaan <span aria-hidden>*</span>
                </Label>
                <textarea
                  id="address"
                  required
                  rows={3}
                  placeholder="Nama jalan, nomor rumah, kelurahan/kecamatan, kota, provinsi — mis. Jl. Depati Amir No.12, Pangkal Pinang, Kepulauan Bangka Belitung"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={() => setAddressTouched(true)}
                  maxLength={500}
                  aria-invalid={addressTouched && (!address.trim() || !cityFromLocation(address)) ? "true" : undefined}
                  aria-describedby={addressTouched && (!address.trim() || !cityFromLocation(address)) ? "address-error" : "address-hint"}
                  className={`focus-ring w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground ${addressTouched && (!address.trim() || !cityFromLocation(address)) ? "border-destructive" : "border-input"}`}
                />
                {addressTouched && !address.trim() ? (
                  <p id="address-error" role="alert" className="text-xs text-destructive-strong">Alamat lengkap wajib diisi — sertakan kota &amp; provinsi agar provider bisa datang (nasional: 38 provinsi).</p>
                ) : addressTouched && !cityFromLocation(address) ? (
                  <p id="address-error" role="alert" className="text-xs text-destructive-strong">Sertakan kota &amp; provinsi — contoh: “Pangkal Pinang, Kepulauan Bangka Belitung”. Tanpa kota, provider tidak bisa filter.</p>
                ) : (
                  <p id="address-hint" className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" aria-hidden />
                    Provider akan datang ke alamat ini. Contoh: “Pangkal Pinang, Kepulauan Bangka Belitung” atau “Denpasar, Bali”.
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {["Pangkal Pinang, Kepulauan Bangka Belitung", "Tanjung Pinang, Kepulauan Riau", "Denpasar, Bali", "Jayapura, Papua"].map((ex) => (
                    <button key={ex} type="button" onClick={() => setAddress(ex)} className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                      {ex.split(",").pop()?.trim()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Jadwal yang Diinginkan</Label>
                <Input
                  id="deadline"
                  type="date"
                  min={minDate}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full sm:w-64"
                />
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" aria-hidden />
                  Bisa disesuaikan lagi lewat pesan dengan provider.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notes">Catatan untuk Provider (opsional)</Label>
                  <span
                    className={`text-2xs tabular-nums ${
                      notes.length >= 480 ? "text-destructive-strong" : "text-muted-foreground"
                    }`}
                  >
                    {notes.length}/500
                  </span>
                </div>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Contoh: AC di kamar utama, akses lewat samping, mohon hubungi dulu sebelum datang"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  className="focus-ring w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metode Pembayaran</CardTitle>
              <CardDescription>
                Pilih cara bayar yang paling nyaman
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioCardGroup
                label="Metode pembayaran"
                options={[...PAYMENT_METHODS]}
                value={paymentMethod}
                onChange={setPaymentMethod}
              />
              {/* Detail berganti mengikuti pilihan — key memicu remount agar
                  animasi rise-in terulang setiap kali metode diganti. */}
              <p
                key={paymentMethod}
                className="animate-rise-in rounded-lg bg-muted/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground"
              >
                {PAYMENT_DETAILS[paymentMethod]}
              </p>
              <p className="text-2xs leading-relaxed text-muted-foreground/70">
                Demo: pembayaran disimulasikan, tidak ada dana yang benar-benar
                dipindahkan.
              </p>
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

              <ul className="space-y-2 border-t border-border pt-4">
                {TRUST_POINTS.map(({ icon: Icon, text }) => (
                  <li
                    key={text}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                    {text}
                  </li>
                ))}
              </ul>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive-strong"
                >
                  {error}
                </p>
              )}

              {/* Desktop: secondary — primary ada di bar mobile agar 1 aksi utama (P0) */}
              {submitButton("hidden w-full lg:flex", "secondary")}

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-success" aria-hidden />
                Data pesanan hanya dibagikan ke provider terkait
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action bar mobile — glass + safe-area */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/80 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-4">
            <div className="min-w-0">
              <div className="text-2xs uppercase tracking-wide text-muted-foreground">
                Total
              </div>
              <div className="truncate text-lg font-bold text-primary-strong">
                {formatIDR(service.price)}
              </div>
            </div>
            <div className="ml-auto flex-1">
              {submitButton("flex w-full shadow-glow")}
            </div>
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
