"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Search, ShieldCheck, Star, ArrowRight } from "lucide-react";
import { DURATION, GSAP_EASE, prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const HeroOrb = dynamic(() => import("@/components/three/hero-orb"), {
  ssr: false,
});

/** Inisial dari nama penyedia: "Budi Santoso" -> "BS". */
function initials(name: string | null) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function Hero({
  categories,
  providers = [],
  providerCount = 0,
  completedOrders = 0,
  ratingAvg = 0,
  cityCount = 0,
}: {
  categories: { slug: string; name: string; id: number }[];
  providers?: { name: string | null; location: string | null }[];
  providerCount?: number;
  completedOrders?: number;
  ratingAvg?: number;
  cityCount?: number;
}) {
  const root = React.useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const tl = gsap.timeline({ defaults: { ease: GSAP_EASE.smooth } });
      tl.fromTo(
        "[data-hero-fade]",
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: DURATION.reveal, stagger: 0.12 },
        0.15,
      );
      tl.fromTo(
        "[data-hero-orb]",
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: DURATION.reveal * 1.6,
          ease: GSAP_EASE.crisp,
        },
        0.4,
      );

      // Parallax halus saat scroll
      gsap.to("[data-hero-orb]", {
        y: 60,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      gsap.to("[data-hero-copy]", {
        y: 30,
        opacity: 0.5,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative overflow-hidden border-b border-border bg-background"
    >
      {/* Latar: grid + noise + glow oranye */}
      <div className="absolute inset-0 bg-grid mask-fade-b" />
      <div className="absolute inset-0 bg-noise opacity-[0.35]" />
      <div className="pointer-events-none absolute -left-40 top-[-20%] h-[480px] w-[480px] rounded-full bg-primary/20 blur-[140px]" />
      <div className="pointer-events-none absolute right-[-10%] top-[30%] h-[420px] w-[420px] rounded-full bg-secondary/15 blur-[120px]" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 md:py-28 lg:grid-cols-12 lg:items-center">
        {/* Kiri — copy */}
        <div data-hero-copy className="lg:col-span-7">
          <div
            data-hero-fade
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary-strong"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Penyedia terverifikasi di kota Anda
          </div>

          {/* text-6xl kini clamp() di tailwind.config, jadi satu kelas
              menggantikan tiga breakpoint + nilai arbitrary 2.6rem. */}
          <h1 data-hero-fade className="text-6xl font-extrabold tracking-tight">
            Jasa terbaik dari{" "}
            <span className="font-serif italic text-primary-strong">
              tetangga terpercaya
            </span>{" "}
            di sekitarmu
          </h1>

          <p
            data-hero-fade
            className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Dari perbaikan AC, kebersihan, instalasi listrik, sampai pindahan —
            bandingkan harga, lihat rating asli, dan pesan langsung dengan
            penyedia jasa profesional.
          </p>

          {/* Search */}
          <form
            data-hero-fade
            action="/services"
            className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-card transition-all focus-within:border-primary/50 focus-within:shadow-glow"
          >
            <Search
              className="ml-3 h-5 w-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <input
              name="search"
              aria-label="Cari jasa"
              placeholder="Cari jasa di daerah Anda..."
              className="w-full bg-transparent px-2 py-3 text-sm outline-none placeholder:text-muted-foreground sm:text-base"
            />
            <button
              type="submit"
              className="focus-ring flex shrink-0 items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-all duration-base hover:brightness-110 active:scale-[0.98]"
            >
              Cari <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </form>

          {/* Pills kategori */}
          <div data-hero-fade className="mt-6 flex max-w-xl flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/services?category=${cat.id}`}
                className="focus-ring rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-base hover:border-primary/40 hover:text-primary-strong"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Kanan — visual.
            Sebelumnya kolom ini hanya <HeroOrb /> tanpa tinggi sama sekali:
            Canvas height:100% dari parent yang auto-height ikut collapse, jadi
            yang tampil hanya bidang pipih dan kedua kartu melayang di ruang
            hitam kosong. Sekarang wrapper punya aspect-square eksplisit,
            cincin konsentris sebagai jangkar visual, dan kartu ditempel ke
            tepi cincin — bukan ke ruang kosong. */}
        <div className="relative lg:col-span-5">
          <div
            data-hero-orb
            className="relative mx-auto aspect-square w-full max-w-md"
          >
            {/* Cincin konsentris: memberi bentuk pada area kanan bahkan sebelum
                WebGL selesai memuat (atau kalau device tidak mendukungnya). */}
            <div
              aria-hidden
              className="absolute inset-0 rounded-full border border-primary/15"
            />
            <div
              aria-hidden
              className="absolute inset-[12%] rounded-full border border-primary/10"
            />
            <div
              aria-hidden
              className="absolute inset-[26%] rounded-full bg-primary/5 blur-2xl"
            />

            <HeroOrb />

            {/* Kartu rating — ditempel ke tepi kiri cincin */}
            <div className="glass absolute -left-4 top-[14%] hidden w-44 rounded-2xl p-4 shadow-card-lg sm:block">
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-rating text-rating" aria-hidden />
                <span className="text-lg font-extrabold">
                  {ratingAvg.toFixed(1)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Rating rata-rata dari {completedOrders.toLocaleString("id-ID")}+
                pesanan
              </p>
            </div>

            {/* Kartu jumlah penyedia — ditempel ke tepi kanan-bawah cincin */}
            <div className="glass absolute -right-4 bottom-[14%] hidden w-44 rounded-2xl p-4 shadow-card-lg sm:block">
              <div className="text-lg font-extrabold text-primary-strong">
                {providerCount.toLocaleString("id-ID")}+
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Penyedia jasa aktif
                {cityCount > 0 && ` di ${cityCount} kota`}
              </p>
            </div>
          </div>

          {/* Bukti sosial: inisial penyedia asli, bukan avatar stok. Mengisi
              ruang di bawah cincin yang sebelumnya kosong sepenuhnya. */}
          {providers.length > 0 && (
            <div
              data-hero-fade
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            >
              <ul className="flex items-center">
                {providers.slice(0, 5).map((provider, i) => (
                  <li
                    key={provider.name}
                    className="-ml-2 first:ml-0"
                    style={{ zIndex: providers.length - i }}
                  >
                    <span
                      title={`${provider.name}${provider.location ? ` — ${provider.location}` : ""}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-secondary text-xs font-bold text-secondary-foreground"
                    >
                      {initials(provider.name)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-center text-xs text-muted-foreground sm:text-left">
                Bergabung bersama{" "}
                <span className="font-semibold text-foreground">
                  {providerCount.toLocaleString("id-ID")} penyedia jasa
                </span>{" "}
                yang sudah menerima pesanan
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
