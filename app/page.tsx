import Link from "next/link";
import {
  ArrowRight,
  Search,
  CreditCard,
  MessageSquareHeart,
  Store,
  Users,
  Truck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCategoryIcon } from "@/lib/category-icons"
import { Hero } from "@/components/landing/hero";
import { Reveal } from "@/components/landing/reveal";
import { Counter } from "@/components/landing/counter";
import { ServiceTile } from "@/components/services/service-tile";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ServisLokal — Cari Jasa Lokal Terpercaya di Sekitar Anda",
  description:
    "Bandingkan harga, rating, dan ulasan penyedia jasa lokal: service AC, kebersihan rumah, instalasi listrik, hingga pindahan. Pesan langsung, bayar setelah selesai.",
  alternates: { canonical: "/" },
};

export const revalidate = 60;

export default async function HomePage() {
  const [
    categories,
    services,
    providerCount,
    completedOrders,
    ratingAvg,
    cityCount,
    heroProviders,
  ] = await Promise.all([
    prisma.category.findMany({
      take: 6,
      include: { _count: { select: { services: true } } },
    }),
    prisma.service.findMany({
      where: { status: "ACTIVE" },
      include: {
        provider: { select: { name: true, avatarUrl: true } },
        category: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.user.count({ where: { role: "PROVIDER" } }),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.service
      .aggregate({
        where: { status: "ACTIVE" },
        _avg: { ratingAvg: true },
      })
      .then((r) => r._avg.ratingAvg ?? 0),
    // distinct city: aggregateRaw $group+$count → 1 doc tuntas di DB
    // vs findMany distinct yang transfer N baris. Index [role,city] tetap kepakai.
    (prisma.user.aggregateRaw({
      pipeline: [
        { $match: { role: "PROVIDER", city: { $ne: null } } },
        { $group: { _id: "$city" } },
        { $count: "count" },
      ],
    }) as unknown as Promise<Array<{ count: number }>>).then(
      (res) => (Array.isArray(res) ? res[0]?.count ?? 0 : (res as unknown as { count?: number })?.count ?? 0)
    ),
    // Penyedia untuk bukti sosial di hero — nama + foto asli dari DB, bukan
    // avatar stok. Hanya yang punya jasa aktif agar tidak memajang akun kosong.
    prisma.user.findMany({
      where: { role: "PROVIDER", services: { some: { status: "ACTIVE" } } },
      select: { name: true, location: true, avatarUrl: true },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
  ]);

  const stats = [
    { value: providerCount, suffix: "+", label: "Penyedia jasa aktif" },
    { value: completedOrders, suffix: "+", label: "Pesanan selesai" },
    { value: ratingAvg, decimals: 1, suffix: "/5", label: "Rating rata-rata" },
    { value: cityCount, suffix: "+", label: "Kota di Indonesia" },
  ];

  return (
    <div>
      <Hero
        categories={categories}
        providers={heroProviders}
        providerCount={providerCount}
        completedOrders={completedOrders}
        ratingAvg={ratingAvg}
        cityCount={cityCount}
      />

      {/* ===== KATEGORI POPULER ===== */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:py-24">
        <Reveal>
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-bold tracking-tight">
                Kategori populer
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Temukan keahlian yang paling sering dicari di sekitar Anda.
              </p>
            </div>
            <Link
              href="/services"
              className="group hidden items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary-strong sm:flex"
            >
              Lihat semua
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>

        <div className="grid auto-rows-fr grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat, i) => {
            const Icon = getCategoryIcon(cat.slug);
            const count = (cat as unknown as { _count: { services: number } })._count?.services ?? 0
            return (
              <Reveal key={cat.id} delay={i * 0.06} className="h-full">
                <Link
                  href={`/services?category=${cat.id}`}
                  className="group relative flex h-full min-h-[148px] flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 transition-[transform,box-shadow,border-color] duration-200 ease-smooth hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-lg focus-visible:-translate-y-0.5 focus-visible:border-primary/40 focus-visible:shadow-card-lg"
                >
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/0 blur-2xl transition-colors duration-300 group-hover:bg-primary/10" />
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-accent text-muted-foreground transition-[background,border-color,color,box-shadow] duration-200 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-auto w-full">
                    <div className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight">
                      {cat.name}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-2xs font-semibold tabular-nums">{count} jasa</span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
        <Link href="/services" className="mx-auto mt-6 flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-primary-strong sm:hidden">
          Lihat semua kategori <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* ===== JASA TERBARU ===== */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-24">
          <Reveal>
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="text-4xl font-bold tracking-tight">
                  Jasa yang sedang ramai
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pesanan terbaru yang dipercaya tetangga sekitar Anda.
                </p>
              </div>
              <Link
                href="/services"
                className="group hidden items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary-strong sm:flex"
              >
                Jelajahi semua
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <Reveal key={service.id} delay={(i % 3) * 0.08}>
                <ServiceTile service={service} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CARA KERJA (4 STEPS) ===== */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:py-24">
        <Reveal>
          <div className="mb-12 max-w-xl">
            <h2 className="text-4xl font-bold tracking-tight">
              Dari cari jasa sampai beres, semudah itu
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Empat langkah yang dipakai setiap hari — tanpa telepon berantai.
            </p>
          </div>
        </Reveal>

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
          {[
            {
              icon: Search,
              step: "01",
              title: "Cari & bandingkan",
              desc: "Jelajahi ribuan jasa di sekitar Anda. Bandingkan harga, rating, dan ulasan asli dari pelanggan sebelumnya.",
            },
            {
              icon: Users,
              step: "02",
              title: "Pilih penyedia",
              desc: "Pilih penyedia jasa yang terpercaya. Baca profil, lihat portofolio, dan chat langsung untuk klarifikasi.",
            },
            {
              icon: CreditCard,
              step: "03",
              title: "Booking & bayar",
              desc: "Konfirmasi pesanan, tambahkan catatan khusus, lalu bayar dengan aman melalui metode pilihan Anda.",
            },
            {
              icon: Truck,
              step: "04",
              title: "Jasa datang",
              desc: "Penyedia datang ke lokasi, selesaikan pekerjaan, dan beri rating serta ulasan setelahnya.",
            },
          ].map((s, i) => {
            const Icon = s.icon;
            const isLast = i === 3;
            return (
              <Reveal key={s.step} delay={i * 0.1} className="h-full">
                <div className="group relative flex h-full min-h-[240px] min-w-[260px] snap-start flex-col rounded-3xl border border-border bg-card p-8 transition-[transform,box-shadow,border-color] duration-200 ease-smooth hover:border-primary/30 hover:shadow-card-lg hover:-translate-y-0.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-strong">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold tracking-widest text-primary-strong/60">LANGKAH {s.step}</span>
                  </div>

                  <h3 className="mt-5 text-xl font-bold leading-tight">{s.title}</h3>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>

                  <div className={`mt-6 hidden items-center gap-2 text-xs font-medium md:flex ${isLast ? "invisible" : "text-muted-foreground/60"}`} aria-hidden>
                    <div className="h-px flex-1 bg-border" />
                    <span>→</span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
        {/* Mobile: scroll indicator dots */}
        <div className="mt-6 flex justify-center gap-1.5 md:hidden" aria-hidden>
          {[0,1,2,3].map((i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === 0 ? "w-6 bg-primary" : "w-1.5 bg-muted"}`} />
          ))}
        </div>
      </section>

      {/* ===== STATISTIK ===== */}
      <section className="relative overflow-hidden border-y border-border bg-background">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.06] blur-[80px]" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-10 px-4 py-16 md:grid-cols-4 md:py-20">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div className="text-center">
                <div className="text-5xl font-extrabold tracking-tight text-primary-strong">
                  <Counter
                    value={s.value}
                    decimals={s.decimals ?? 0}
                    suffix={s.suffix}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-primary p-10 text-primary-foreground md:p-16">
            <div className="absolute inset-0 bg-noise opacity-20" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-foreground/15 blur-3xl" />
            <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-lg">
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">
                  Untuk penyedia jasa
                </p>
                <h2 className="mt-3 text-4xl font-extrabold tracking-tight">
                  Punya keahlian? Ubah jadi penghasilan.
                </h2>
                <p className="mt-3 text-sm opacity-85 md:text-base">
                  Buka jasa gratis, terima pesanan dari pelanggan di sekitar
                  Anda, dan bangun reputasi lewat rating.
                </p>
              </div>
              {/* Tombol utama memakai bg-background + text-primary-strong
                  (5.0:1). Tidak boleh bg-primary-foreground: di light mode
                  token itu gelap, jadi teks oranye di atasnya tak terbaca.
                  Tautan /chat dihapus — rutenya tidak ada (404). */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-background px-7 py-3.5 text-sm font-bold text-primary-strong transition-transform duration-base hover:scale-[1.02] active:scale-[0.98]"
                >
                  Mulai Jualan <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/services"
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/40 px-7 py-3.5 text-sm font-bold transition-colors duration-base hover:bg-primary-foreground/10"
                >
                  <Store className="h-4 w-4" aria-hidden /> Cari Jasa
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
