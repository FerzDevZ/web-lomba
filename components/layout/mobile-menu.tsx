"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { Menu, X, PlusCircle, LayoutDashboard, LogIn, UserPlus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MobileMenu({ session }: { session: boolean }) {
  const [open, setOpen] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const previousFocus = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement as HTMLElement | null
    // Gunakan position: fixed pada body + overscroll-behavior: contain
    // karena style.overflow = "hidden" tidak cukup di Android Chrome —
    // overscroll gesture tetap bisa menggerakkan background.
    const scrollY = window.scrollY
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = "100%"
    document.body.style.overflow = "hidden"
    const frame = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')?.focus()
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
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
      cancelAnimationFrame(frame)
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.width = ""
      document.body.style.overflow = ""
      window.scrollTo(0, scrollY)
      window.removeEventListener("keydown", onKey)
      previousFocus.current?.focus()
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-label="Buka menu"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          style={{ touchAction: 'none' }}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
          className="absolute right-0 top-0 h-full w-72 border-l border-border bg-background p-5 shadow-card-lg"
          style={{ overscrollBehavior: 'contain' }}
        >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-bold">
                Servis<span className="text-primary-strong">Lokal</span>
              </span>
              <button
                type="button"
                aria-label="Tutup menu"
                onClick={() => setOpen(false)}
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-border"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search bar — akses cepat tanpa harus buka /services */}
            <form
              action="/services"
              className="mb-4"
            >
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 focus-within:border-primary/50 focus-within:shadow-glow transition-[border-color,box-shadow]">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <input
                  name="search"
                  type="search"
                  placeholder="Cari jasa..."
                  aria-label="Cari jasa"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </form>

            <nav className="flex flex-col gap-2">
              <Link
                href="/services"
                onClick={() => setOpen(false)}
                className="focus-ring rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent"
              >
                Jelajahi Jasa
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="focus-ring flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              <Link
                href="/dashboard/provider/buka-jasa"
                onClick={() => setOpen(false)}
                className="focus-ring flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent"
              >
                <PlusCircle className="h-4 w-4" /> Buka Jasa
              </Link>
              <Link
                href="/faq"
                onClick={() => setOpen(false)}
                className="focus-ring rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent"
              >
                Pusat Bantuan
              </Link>
            </nav>

            <div className="mt-6 space-y-2 border-t border-border pt-6">
              {session ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Keluar
                </Button>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">
                      <LogIn /> Masuk
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)}>
                    <Button className="w-full shadow-glow">
                      <UserPlus /> Daftar
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
