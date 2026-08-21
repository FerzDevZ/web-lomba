import type { Metadata } from "next"
import ServicesPageClient from "./page.client"

export const metadata: Metadata = {
  title: "Jelajahi Jasa — ServisLokal",
  description:
    "Cari dan bandingkan ribuan jasa profesional di sekitar Anda. Filter berdasarkan kategori, lokasi, dan rating.",
  openGraph: {
    title: "Jelajahi Jasa — ServisLokal",
    description:
      "Cari dan bandingkan ribuan jasa profesional di sekitar Anda.",
    type: "website",
  },
}

export default function ServicesPage() {
  return <ServicesPageClient />
}