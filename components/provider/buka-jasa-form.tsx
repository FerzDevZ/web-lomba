"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, PlusCircle, CheckCircle2, ImageIcon } from "lucide-react"
import { formatIDR } from "@/lib/utils"

type CategoryItem = { id: number; name: string; slug: string }

const DESCRIPTION_MAX = 500

const EMPTY_FORM = {
  title: "",
  categoryId: "",
  price: "",
  deliveryTimeDays: "",
  description: "",
  imageUrl: "",
}

type FormState = typeof EMPTY_FORM

/**
 * Formulir pembuatan jasa + pratinjau kartu langsung.
 *
 * Pratinjau memakai latar `bg-accent` yang sama dengan `ServiceTile` — dulu
 * memakai gradien berbeda, jadi pratinjau tidak mencerminkan kartu sungguhan
 * di katalog dan provider menebak-nebak hasil akhirnya.
 */
export function BukaJasaForm({ onCreated }: { onCreated: (id: number) => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState("")

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const { data: categories } = useQuery<CategoryItem[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories")
      if (!res.ok) throw new Error("Gagal memuat kategori")
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: FormState) => {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          categoryId: Number(payload.categoryId),
          price: Number(payload.price),
          deliveryTimeDays: Number(payload.deliveryTimeDays),
          description: payload.description,
          imageUrl: payload.imageUrl,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(
          data?.error ?? "Gagal membuat jasa. Periksa kembali data Anda."
        )
      }
      return data as { id: number }
    },
    onSuccess: (data) => {
      setForm(EMPTY_FORM)
      setError("")
      queryClient.invalidateQueries({ queryKey: ["my-services"] })
      toast.success("Jasa berhasil dibuat", {
        description: "Jasa Anda sekarang tayang di katalog.",
      })
      onCreated(data.id)
    },
    onError: (err: Error) => {
      setError(err.message)
      toast.error("Gagal membuat jasa", { description: err.message })
    },
  })

  const submitting = createMutation.isPending

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary-strong" aria-hidden />
            Detail Jasa Baru
          </CardTitle>
          <CardDescription>
            Semua kolom wajib diisi agar jasa tampil informatif.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setError("")
              createMutation.mutate(form)
            }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Judul Jasa</Label>
              <Input
                id="title"
                placeholder="Contoh: Instalasi AC Split 1/2 - 2 PK"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
                maxLength={120}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <select
                  id="category"
                  value={form.categoryId}
                  onChange={(e) => set("categoryId", e.target.value)}
                  required
                  className="focus-ring flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm transition-colors"
                >
                  <option value="">Pilih kategori...</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery">Estimasi Pengerjaan (hari)</Label>
                <Input
                  id="delivery"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={90}
                  placeholder="Contoh: 3"
                  value={form.deliveryTimeDays}
                  onChange={(e) => set("deliveryTimeDays", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Harga (Rp)</Label>
              <Input
                id="price"
                type="number"
                inputMode="numeric"
                min={10000}
                step={5000}
                placeholder="Contoh: 350000"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                required
              />
              {form.price && Number(form.price) > 0 && (
                <p className="text-xs text-muted-foreground">
                  Tampil sebagai{" "}
                  <span className="font-semibold text-foreground">
                    {formatIDR(Number(form.price))}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Jasa</Label>
              <textarea
                id="description"
                rows={5}
                placeholder="Jelaskan apa yang pelanggan dapatkan, termasuk detail pekerjaan dan apa saja yang termasuk..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                required
                minLength={20}
                maxLength={DESCRIPTION_MAX}
                className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                {form.description.length}/{DESCRIPTION_MAX} karakter — minimal 20
                karakter, deskripsi jelas meningkatkan peluang dipesan.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">
                URL Gambar Cover{" "}
                <span className="text-muted-foreground">(opsional)</span>
              </Label>
              <div className="relative">
                <ImageIcon
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://contoh.com/gambar.jpg"
                  value={form.imageUrl}
                  onChange={(e) => set("imageUrl", e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Tempel URL gambar untuk ditampilkan sebagai cover jasa. Biarkan
                kosong untuk memakai ikon kategori.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive-strong"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full shadow-glow"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Menyimpan...
                </>
              ) : (
                "Publikasikan Jasa"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <Card className="lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Pratinjau Kartu</CardTitle>
            <CardDescription>
              Beginilah jasa Anda tampil di katalog.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative flex h-28 items-center justify-center overflow-hidden bg-accent">
                {form.imageUrl ? (
                  <Image
                    src={form.imageUrl}
                    alt=""
                    fill
                    sizes="320px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-3xl font-extrabold text-primary/25">
                    {form.title ? form.title.charAt(0).toUpperCase() : "J"}
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="line-clamp-2 text-sm font-semibold leading-snug">
                  {form.title || "Judul jasa Anda"}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">
                    {form.deliveryTimeDays
                      ? `${form.deliveryTimeDays} hari`
                      : "— hari"}
                  </span>
                  <span className="text-base font-extrabold text-primary-strong">
                    {form.price ? formatIDR(Number(form.price)) : "Rp 0"}
                  </span>
                </div>
              </div>
            </div>

            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              {[
                "Langsung tayang setelah dibuat",
                "Bisa disembunyikan kapan saja",
                "Gratis, tanpa biaya bulanan",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
