import type { Metadata } from "next"
import { PageShell } from "@/components/layout/page-shell"
import { MessageCircle } from "lucide-react"
import { FaqContent } from "@/components/layout/faq-content"

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
    title: "Cara Pesan",
    items: [
      { q: "Bagaimana cara memesan jasa di ServisLokal?", a: "" },
      { q: "Apakah saya perlu membuat akun untuk memesan?", a: "" },
      { q: "Bisakah saya membatalkan pesanan?", a: "" },
      { q: "Bagaimana saya tahu pesanan sudah selesai?", a: "" },
    ],
  },
  {
    id: "pembayaran",
    title: "Pembayaran",
    items: [
      { q: "Metode pembayaran apa saja yang tersedia?", a: "" },
      { q: "Apakah pembayaran saya aman?", a: "" },
      { q: "Apakah ada biaya tambahan?", a: "" },
    ],
  },
  {
    id: "penyedia",
    title: "Untuk Penyedia Jasa",
    items: [
      { q: "Bagaimana cara menjadi penyedia jasa?", a: "" },
      { q: "Berapa biaya untuk menjadi penyedia jasa?", a: "" },
      { q: "Bagaimana cara mendapat pesanan?", a: "" },
    ],
  },
  {
    id: "kebijakan",
    title: "Kebijakan",
    items: [
      { q: "Apakah data pribadi saya aman?", a: "" },
      { q: "Bagaimana jika jasa tidak sesuai harapan?", a: "" },
    ],
  },
  {
    id: "tentang",
    title: "Tentang ServisLokal",
    items: [
      { q: "Apa itu ServisLokal?", a: "" },
      { q: "Di kota mana saja ServisLokal tersedia?", a: "" },
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

      <FaqContent />
    </PageShell>
  )
}
