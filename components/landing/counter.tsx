"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { DURATION, GSAP_EASE, prefersReducedMotion } from "@/lib/motion"

gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * Angka yang menghitung naik saat masuk viewport.
 *
 * Dua hal yang sebelumnya salah dan diperbaiki di sini:
 * 1. Angka dirender mentah, jadi `prefix="Rp"` pada KPI admin menghasilkan
 *    "Rp12500000". Sekarang selalu lewat Intl id-ID → "Rp12.500.000".
 * 2. Nilai awal SSR selalu "0", sehingga pengguna tanpa JS (atau sebelum
 *    hydration) melihat nol — bukan angka sebenarnya. Sekarang SSR menulis
 *    nilai final dan animasi baru menurunkannya ke 0 saat mulai.
 */
export function Counter({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
}: {
  value: number
  decimals?: number
  suffix?: string
  prefix?: string
}) {
  const ref = React.useRef<HTMLSpanElement>(null)

  const format = React.useCallback(
    (n: number) =>
      `${prefix}${n.toLocaleString("id-ID", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`,
    [prefix, suffix, decimals]
  )

  useGSAP(
    () => {
      if (!ref.current) return
      if (prefersReducedMotion()) {
        ref.current.textContent = format(value)
        return
      }

      const obj = { n: 0 }
      ref.current.textContent = format(0)
      gsap.to(obj, {
        n: value,
        duration: DURATION.reveal * 2,
        ease: GSAP_EASE.smooth,
        scrollTrigger: { trigger: ref.current, start: "top 90%", once: true },
        onUpdate: () => {
          if (ref.current) ref.current.textContent = format(obj.n)
        },
      })
    },
    { scope: ref, dependencies: [value, format] }
  )

  return <span ref={ref}>{format(value)}</span>
}
