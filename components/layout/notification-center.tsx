"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Bell,
  Check,
  CheckCheck,
  Package,
  MessageSquare,
  Star,
  Settings,
  X,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

type Notification = {
  id: string | number
  type: "order" | "message" | "review" | "system"
  title: string
  description: string
  href: string
  read: boolean
  createdAt: string
}

type NotificationGroup = {
  type: Notification["type"]
  label: string
  icon: React.ComponentType<{ className?: string }>
  items: Notification[]
}

const NOTIFICATION_ICONS: Record<
  Notification["type"],
  React.ComponentType<{ className?: string }>
> = {
  order: Package,
  message: MessageSquare,
  review: Star,
  system: Bell,
}

const NOTIFICATION_LABELS: Record<Notification["type"], string> = {
  order: "Pesanan",
  message: "Pesan",
  review: "Ulasan",
  system: "Sistem",
}

/**
 * Notification center dengan grouping dan mark-as-read.
 */
export function NotificationCenter({
  notifications = [],
  isLoading,
  onMarkAllRead,
  onMarkRead,
}: {
  notifications?: Notification[]
  isLoading?: boolean
  onMarkAllRead?: () => void
  onMarkRead?: (id: string | number) => void
}) {
  const [open, setOpen] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const previousFocus = React.useRef<HTMLElement | null>(null)

  // Group notifications by type
  const groups = React.useMemo(() => {
    const grouped = new Map<Notification["type"], Notification[]>()
    for (const n of notifications) {
      const items = grouped.get(n.type) ?? []
      items.push(n)
      grouped.set(n.type, items)
    }
    return Array.from(grouped.entries()).map(([type, items]) => ({
      type,
      label: NOTIFICATION_LABELS[type],
      icon: NOTIFICATION_ICONS[type],
      items,
    }))
  }, [notifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  // Focus trap and keyboard handling
  React.useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        return
      }
      if (e.key !== "Tab" || !panelRef.current) return

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      previousFocus.current?.focus()
    }
  }, [open])

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Notifikasi${unreadCount > 0 ? `, ${unreadCount} belum dibaca` : ""}`}
      >
        <Bell className="h-4 w-4" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-2xs font-bold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Pusat notifikasi"
            className="fixed right-4 top-16 z-50 w-80 max-h-[70vh] overflow-hidden rounded-2xl border border-border bg-card shadow-card-lg sm:right-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="font-semibold">Notifikasi</h2>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAllRead}
                    className="h-7 text-xs"
                  >
                    <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                    Tandai semua dibaca
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="focus-ring rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
                  aria-label="Tutup notifikasi"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(70vh-56px)]">
              {isLoading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : groups.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell
                    className="mx-auto h-8 w-8 text-muted-foreground/40"
                    aria-hidden
                  />
                  <p className="mt-3 text-sm font-medium">Belum ada notifikasi</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Notifikasi akan muncul di sini
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {groups.map((group) => {
                    const Icon = group.icon
                    return (
                      <div key={group.type}>
                        <div className="flex items-center gap-2 px-4 py-2 bg-muted/40">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                          <span className="text-xs font-medium text-muted-foreground">
                            {group.label}
                          </span>
                          <Badge variant="outline" className="ml-auto h-5 min-w-5 text-2xs">
                            {group.items.length}
                          </Badge>
                        </div>
                        {group.items.map((notification) => (
                          <Link
                            key={notification.id}
                            href={notification.href}
                            onClick={() => {
                              onMarkRead?.(notification.id)
                              setOpen(false)
                            }}
                            className={cn(
                              "flex gap-3 px-4 py-3 transition-colors hover:bg-accent/50",
                              !notification.read && "bg-primary/5"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                !notification.read
                                  ? "bg-primary/10 text-primary-strong"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              <Icon className="h-4 w-4" aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className={cn(
                                  "text-sm",
                                  !notification.read && "font-medium"
                                )}
                              >
                                {notification.title}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                {notification.description}
                              </p>
                              <time
                                dateTime={notification.createdAt}
                                className="mt-1 block text-2xs text-muted-foreground/70"
                              >
                                {new Date(
                                  notification.createdAt
                                ).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </time>
                            </div>
                            {!notification.read && (
                              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                            )}
                          </Link>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-2">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Lihat semua notifikasi
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
