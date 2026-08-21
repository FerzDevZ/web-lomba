"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { DURATION, GSAP_EASE, prefersReducedMotion } from "@/lib/motion"

gsap.registerPlugin(ScrollTrigger, useGSAP)

export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  y?: number
}) {
  const ref = React.useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(
        ref.current,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: DURATION.reveal,
          delay,
          ease: GSAP_EASE.smooth,
          scrollTrigger: {
            trigger: ref.current,
            start: "top 88%",
            once: true,
          },
        }
      )
    },
    { scope: ref }
  )

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
