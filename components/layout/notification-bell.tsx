"use client"

import * as React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Bell } from "lucide-react"

type NotificationItem = {
  orderId: string | number
  message: string
  time: string
}

export function NotificationBell() {
  const { data: session } = useSession()
  const [count, setCount] = React.useState(0)
  const [items, setItems] = React.useState<NotificationItem[]>([])
  const [open, setOpen] = React.useState(false)

  const load = React.useCallback(async () => {
    if (!session?.user) return
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      setCount(data.count ?? 0)
      setItems(data.items ?? [])
    } catch {
      // polling gagal — abaikan, coba lagi di interval berikutnya
    }
  }, [session])

  React.useEffect(() => {
    load()
    // Polling ringan setiap 30 detik, jeda saat tab hidden (P2)
    const interval = setInterval(() => {
      if (document.hidden) return
      load()
    }, 30_000)
    const onVis = () => { if (!document.hidden) load() }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [load])

  if (!session?.user) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={count > 0 ? `${count} notifikasi baru` : "Notifikasi"}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="focus-ring relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:border-primary/40 hover:text-primary-strong"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span aria-hidden className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-2xs font-bold text-destructive-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            aria-hidden
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-border bg-card p-2 shadow-card-lg">
            <div className="px-3 py-2 text-sm font-semibold">Notifikasi</div>
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Tidak ada notifikasi baru
              </p>
            ) : (
              <div className="max-h-80 space-y-1 overflow-y-auto">
                {items.map((item) => (
                  <Link
                    key={item.orderId}
                    href={`/orders/${item.orderId}`}
                    onClick={() => setOpen(false)}
                    className="focus-ring block rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
                  >
                    <p className="text-sm">{item.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.time}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
