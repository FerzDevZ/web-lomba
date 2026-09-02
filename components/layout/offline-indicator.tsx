"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Offline indicator banner.
 * Menampilkan peringatan saat pengguna kehilangan koneksi internet.
 */
export function OfflineIndicator({ className }: { className?: string }) {
  const [isOnline, setIsOnline] = React.useState(true)
  const [showBanner, setShowBanner] = React.useState(false)

  React.useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)
      if (!online) {
        setShowBanner(true)
      } else {
        // Delay hide banner to show reconnection
        setTimeout(() => setShowBanner(false), 2000)
      }
    }

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  if (!showBanner) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t px-4 py-3 transition-all duration-300",
        isOnline
          ? "border-success/30 bg-success-soft text-success"
          : "border-warning/30 bg-warning-soft text-warning",
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
        {isOnline ? (
          <>
            <RefreshCw className="h-4 w-4" aria-hidden />
            <span className="text-sm font-medium">Koneksi tersambung kembali</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" aria-hidden />
            <span className="text-sm font-medium">
              Anda sedang offline — beberapa fitur mungkin tidak tersedia
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              className="ml-2 h-7 text-xs"
            >
              Muat Ulang
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
