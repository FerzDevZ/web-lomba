"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Search,
  CreditCard,
  ShieldCheck,
  Users,
  MessageCircle,
  ChevronDown,
  X,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"

type FaqItem = { q: string; a: string }
type FaqSection = {
  id: string
  icon: typeof Search
  title: string
  items: FaqItem[]
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    id: "cara-pesan",
    icon: Search,
    title: "Cara Pesan",
    items: [
      {
        q: "Bagaimana cara memesan jasa di ServisLokal?",
        a: "Cari jasa yang Anda butuhkan melalui kolom pencarian atau jelajahi kategori. Bandingkan harga, rating, dan ulasan. Klik 'Pesan Sekarang' di halaman detail jasa, isi catatan tambahan, pilih metode pembayaran, lalu konfirmasi pesanan.",
      },
      {
        q: "Apakah saya perlu membuat akun untuk memesan?",
        a: "Ya, Anda perlu mendaftar sebagai Customer untuk memesan jasa. Pendaftaran gratis dan hanya butuh email serta password. Login dengan email dan password terdaftar.",
      },
      {
        q: "Bisakah saya membatalkan pesanan?",
        a: "Pesanan dengan status PENDING (sebelum dikonfirmasi provider) bisa dibatalkan. Setelah provider mengonfirmasi dan pesanan berstatus IN_PROGRESS, hubungi provider langsung melalui fitur chat di dashboard.",
      },
      {
        q: "Bagaimana saya tahu pesanan sudah selesai?",
        a: "Anda akan mendapat notifikasi di dashboard saat provider menandai pesanan selesai. Setelah itu, Anda bisa memberikan rating dan ulasan untuk penyedia jasa tersebut.",
      },
    ],
  },
  {
    id: "pembayaran",
    icon: CreditCard,
    title: "Pembayaran",
    items: [
      {
        q: "Metode pembayaran apa saja yang tersedia?",
        a: "Saat ini kami mendukung Bank Transfer (BCA, Mandiri, BRI, Permata), E-Wallet (DANA, OVO, GoPay), dan Cash on Delivery (bayar tunai saat jasa selesai). Metode pembayaran akan terus bertambah.",
      },
      {
        q: "Apakah pembayaran saya aman?",
        a: "Ya. Semua pembayaran diproses melalui gateway terenkripsi. Data kartu/kredensial tidak pernah disimpan di server kami. Pembayaran COD aman karena Anda hanya membayar setelah jasa selesai.",
      },
      {
        q: "Apakah ada biaya tambahan?",
        a: "Tidak ada biaya layanan untuk pelanggan. Harga yang tertera di halaman jasa adalah harga final yang Anda bayar.",
      },
    ],
  },
  {
    id: "penyedia",
    icon: Users,
    title: "Untuk Penyedia Jasa",
    items: [
      {
        q: "Bagaimana cara menjadi penyedia jasa?",
        a: "Daftar akun, lalu ubah role Anda menjadi PROVIDER di halaman dashboard. Setelah itu, Anda bisa membuka jasa melalui menu 'Buka Jasa'. Jasa langsung tayang setelah dipublikasikan.",
      },
      {
        q: "Berapa biaya untuk menjadi penyedia jasa?",
        a: "Gratis. Tidak ada biaya pendaftaran, biaya bulanan, atau biaya transaksi. Anda menerima 100% dari harga jasa yang Anda tetapkan.",
      },
      {
        q: "Bagaimana cara mendapat pesanan?",
        a: "Pastikan jasa Anda memiliki deskripsi jelas, harga kompetitif, dan gambar yang menarik. Profil lengkap dengan lokasi yang akurat membantu pelanggan menemukan Anda. Minta ulasan dari pelanggan untuk membangun reputasi.",
      },
    ],
  },
  {
    id: "kebijakan",
    icon: ShieldCheck,
    title: "Kebijakan",
    items: [
      {
        q: "Apakah data pribadi saya aman?",
        a: "Data Anda disimpan dengan enkripsi dan tidak dibagikan ke pihak ketiga. Lihat detail di bagian Kebijakan Privasi di bawah.",
      },
      {
        q: "Bagaimana jika jasa tidak sesuai harapan?",
        a: "Hubungi penyedia jasa langsung melalui fitur chat di halaman pesanan. Jika tidak ada resolusi, laporkan pesanan ke admin melalui dashboard. Berikan ulasan jujur agar pelanggan lain punya gambaran yang tepat.",
      },
    ],
  },
  {
    id: "tentang",
    icon: MessageCircle,
    title: "Tentang ServisLokal",
    items: [
      {
        q: "Apa itu ServisLokal?",
        a: "ServisLokal adalah marketplace jasa lokal yang menghubungkan pelanggan dengan penyedia jasa profesional di sekitar mereka. Dari perbaikan AC, kebersihan, instalasi listrik, hingga pindahan — semua dalam satu platform.",
      },
      {
        q: "Di kota mana saja ServisLokal tersedia?",
        a: "Saat ini ServisLokal tersedia di seluruh Indonesia. Anda bisa mencari jasa berdasarkan kota/lokasi untuk menemukan penyedia terdekat.",
      },
    ],
  },
]

function FaqFeedback({ q }: { q: string }) {
  const [voted, setVoted] = useState<"up" | "down" | null>(null)
  const [count, setCount] = useState({ up: 0, down: 0 })

  const vote = useCallback((dir: "up" | "down") => {
    if (voted) return
    setVoted(dir)
    setCount((c) => ({ ...c, [dir]: c[dir] + 1 }))
  }, [voted])

  return (
    <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
      <span className="text-2xs text-muted-foreground">Membantu?</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => vote("up")}
          disabled={!!voted}
          aria-label="Ya, membantu"
          className={`focus-ring flex h-7 items-center gap-1 rounded-lg border px-2 text-2xs transition-colors ${
            voted === "up"
              ? "border-success bg-success/10 text-success"
              : "border-border bg-card text-muted-foreground hover:border-primary/40"
          } ${voted && voted !== "up" ? "opacity-50" : ""}`}
        >
          <ThumbsUp className="h-3 w-3" aria-hidden />
          {count.up > 0 && count.up}
        </button>
        <button
          type="button"
          onClick={() => vote("down")}
          disabled={!!voted}
          aria-label="Tidak membantu"
          className={`focus-ring flex h-7 items-center gap-1 rounded-lg border px-2 text-2xs transition-colors ${
            voted === "down"
              ? "border-destructive bg-destructive/10 text-destructive-strong"
              : "border-border bg-card text-muted-foreground hover:border-primary/40"
          } ${voted && voted !== "down" ? "opacity-50" : ""}`}
        >
          <ThumbsDown className="h-3 w-3" aria-hidden />
          {count.down > 0 && count.down}
        </button>
      </div>
      {voted && (
        <span className="text-2xs text-success">Terima kasih!</span>
      )}
    </div>
  )
}

export function FaqContent() {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    if (!query.trim()) return FAQ_SECTIONS
    const q = query.toLowerCase()
    return FAQ_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q)
      ),
    })).filter((section) => section.items.length > 0)
  }, [query])

  const totalResults = filtered.reduce((sum, s) => sum + s.items.length, 0)

  return (
    <>
      {/* Search */}
      <div className="relative mx-auto mt-8 max-w-xl">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          placeholder="Cari pertanyaan..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Cari pertanyaan FAQ"
          className="focus-ring w-full rounded-xl border border-border bg-card py-3 pl-12 pr-10 text-sm placeholder:text-muted-foreground transition-[border-color,box-shadow] focus:border-primary/50 focus:shadow-glow"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Hapus pencarian"
            className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {FAQ_SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary-strong"
          >
            <section.icon className="h-3.5 w-3.5" />
            {section.title}
          </a>
        ))}
      </div>

      {/* Results count when searching */}
      {query && (
        <p className="mt-6 text-center text-sm text-muted-foreground" aria-live="polite">
          {totalResults === 0
            ? `Tidak ada hasil untuk "${query}"`
            : `${totalResults} hasil untuk "${query}"`}
        </p>
      )}

      {/* Sections */}
      <div className="mt-10 space-y-12">
        {filtered.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary-strong">
                <section.icon className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                {section.title}
              </h2>
            </div>

            <div className="space-y-3">
              {section.items.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
                >
                  <summary className="focus-ring flex cursor-pointer items-center justify-between gap-3 rounded font-semibold marker:content-none">
                    <span className="min-w-0 flex-1 break-words text-left [overflow-wrap:anywhere]">
                      {item.q}
                    </span>
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                  <FaqFeedback q={item.q} />
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* No results */}
      {query && totalResults === 0 && (
        <div className="mt-12 rounded-3xl border border-border bg-card p-8 text-center">
          <Search className="mx-auto h-10 w-10 text-muted-foreground/40" aria-hidden />
          <p className="mt-3 font-semibold">Tidak ada pertanyaan yang cocok</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Coba kata kunci lain atau hubungi kami langsung.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => setQuery("")}>
            Hapus Pencarian
          </Button>
        </div>
      )}

      {/* CTA */}
      <div className="mt-16 rounded-3xl border border-border bg-card p-8 text-center">
        <h2 className="text-xl font-semibold tracking-tight">
          Masih ada pertanyaan?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tim kami siap membantu. Kirim email atau jelajahi jasa sekarang.
        </p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <a href="mailto:halo@servislokal.id">
            <Button variant="outline">Kontak Kami</Button>
          </a>
          <Link href="/services">
            <Button className="shadow-glow">Jelajahi Jasa</Button>
          </Link>
        </div>
      </div>
    </>
  )
}
