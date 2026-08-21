"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X, PlusCircle, LayoutDashboard, LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MobileMenu({ session }: { session: boolean }) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
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
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            className="absolute right-0 top-0 h-full w-72 border-l border-border bg-background p-5 shadow-card-lg"
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
            </nav>

            <div className="mt-6 space-y-2 border-t border-border pt-6">
              {session ? (
                <form
                  action="/api/auth/signout"
                  method="post"
                  className="space-y-2"
                >
                  <Button type="submit" variant="outline" className="w-full">
                    Keluar
                  </Button>
                </form>
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
