"use client"

import * as React from "react"
import { Search, X } from "lucide-react"

export function SearchBar() {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const mobileInputRef = React.useRef<HTMLInputElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const previousFocus = React.useRef<HTMLElement | null>(null)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // Shortcut "/" untuk fokus search aktif (desktop)
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      if (e.key === "/" && !isTyping) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // Fokus, trap & Escape untuk overlay mobile
  React.useEffect(() => {
    if (!mobileOpen) return
    previousFocus.current = document.activeElement as HTMLElement | null
    document.body.style.overflow = "hidden"
    const t = setTimeout(() => mobileInputRef.current?.focus(), 100)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false)
      if (e.key !== "Tab" || !panelRef.current) return
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      clearTimeout(t)
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
      previousFocus.current?.focus()
    }
  }, [mobileOpen])

  return (
    <>
      {/* ── Desktop (md ke atas): search bar inline ── */}
      <form
        action="/services"
        className="mx-auto hidden w-full max-w-xl flex-1 md:block"
      >
        <div className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 transition-all focus-within:border-primary/50 focus-within:shadow-glow">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            name="search"
            aria-label="Cari jasa"
            placeholder="Cari jasa: AC, listrik, kebersihan..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden shrink-0 rounded-md border border-input bg-background px-1.5 py-0.5 text-2xs font-semibold text-foreground lg:block">
            /
          </kbd>
        </div>
      </form>

      {/* ── Mobile (< md): tombol ikon yang membuka overlay search ── */}
      <button
        type="button"
        aria-label="Cari jasa"
        onClick={() => setMobileOpen(true)}
        className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Overlay search mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel search slide-down dari atas */}
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Pencarian"
            className="absolute inset-x-0 top-0 border-b border-border bg-background p-3 shadow-card-lg animate-in slide-in-from-top-4 duration-200"
          >
            <form
              action="/services"
              className="flex items-center gap-2"
            >
              <div className="group flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 transition-all focus-within:border-primary/50 focus-within:shadow-glow">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  ref={mobileInputRef}
                  name="search"
                  placeholder="Cari jasa: AC, listrik, kebersihan..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <button
                type="button"
                aria-label="Tutup pencarian"
                onClick={() => setMobileOpen(false)}
                className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
