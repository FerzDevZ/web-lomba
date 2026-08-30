import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/layout/page-shell"
import {
  Search,
  CreditCard,
  ShieldCheck,
  Users,
  MessageCircle,
  ChevronDown,
} from "lucide-react"

export const metadata: Metadata = {
  title: "FAQ & Bantuan — ServisLokal",
  description:
    "Pertanyaan yang sering diajukan tentang ServisLokal: cara memesan jasa, metode pembayaran, kebijakan, dan lainnya.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ & Bantuan — ServisLokal",
    description:
      "Temukan jawaban atas pertanyaan umum tentang ServisLokal.",
    type: "website",
    url: "/faq",
  },
}

const FAQ_SECTIONS = [
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

export default function FAQPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_SECTIONS.flatMap((section) =>
      section.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      }))
    ),
  }

  return (
    <PageShell width="prose" className="py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary-strong">
          <MessageCircle className="h-7 w-7" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Pertanyaan Umum
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Temukan jawaban atas pertanyaan yang sering diajukan. Tidak menemukan
          yang Anda cari? Hubungi kami di{" "}
          <a
            href="mailto:halo@servislokal.id"
            className="font-medium text-primary-strong hover:underline"
          >
            halo@servislokal.id
          </a>
        </p>
      </div>

      {/* Quick links */}
      <div className="mt-10 flex flex-wrap justify-center gap-2">
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

      {/* Sections */}
      <div className="mt-12 space-y-12">
        {FAQ_SECTIONS.map((section) => (
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
                  <summary className="focus-ring flex cursor-pointer items-center justify-between gap-4 rounded font-semibold marker:content-none">
                    {item.q}
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

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
    </PageShell>
  )
}
