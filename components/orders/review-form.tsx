"use client"

import { useState } from "react"
import { Star, Send, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

/**
 * Formulir ulasan. Bintang dirender sebagai radiogroup sungguhan agar bisa
 * dioperasikan dengan keyboard — sebelumnya hanya tombol tanpa state terpilih
 * yang terbaca screen reader.
 */
export function ReviewForm({
  busy,
  onSubmit,
}: {
  busy: boolean
  onSubmit: (rating: number, comment: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")

  if (!open) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Beri Ulasan</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setOpen(true)} className="shadow-glow">
            <Star /> Beri Rating &amp; Ulasan
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Beri Ulasan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div
            role="radiogroup"
            aria-label="Rating 1 sampai 5 bintang"
            className="flex items-center gap-1"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={star === rating}
                onClick={() => setRating(star)}
                aria-label={`${star} bintang`}
                className="focus-ring rounded-lg p-0.5 transition-transform duration-fast hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= rating
                      ? "fill-rating text-rating"
                      : "text-muted-foreground/40"
                  }`}
                  aria-hidden
                />
              </button>
            ))}
            <span className="ml-2 text-sm font-semibold">
              {rating > 0 ? `${rating}/5` : "Pilih rating"}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-comment">Komentar (opsional)</Label>
            <textarea
              id="review-comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              placeholder="Bagaimana hasil kerjanya?"
              className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-2xs text-muted-foreground">
              {comment.length}/500 karakter
            </p>
          </div>

          <div className="flex gap-2">
            <Button disabled={busy} onClick={() => onSubmit(rating, comment)}>
              <Send /> Kirim Ulasan
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Batal
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** Konfirmasi ulasan yang sudah terkirim. */
export function ReviewSubmitted({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success-soft p-4 text-sm">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden />
      <p>
        Ulasan Anda sudah terkirim (
        <span className="font-semibold">{rating}/5</span>). Terima kasih!
      </p>
    </div>
  )
}
