"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Send, MessageSquare, Loader2, Check } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type MessageItem = {
  id: number
  content: string
  createdAt: string
  sender: { id: number; name: string | null }
}

const MAX_LENGTH = 500

export function MessageThread({
  orderId,
  otherName,
}: {
  orderId: number
  otherName: string
}) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [draft, setDraft] = React.useState("")
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const { data: messages, isLoading } = useQuery<MessageItem[]>({
    queryKey: ["messages", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/messages`)
      if (!res.ok) throw new Error("Gagal memuat pesan")
      return res.json()
    },
    refetchInterval: 8000,
  })

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages?.length])

  // Sebelumnya kegagalan POST diabaikan sepenuhnya: draft tetap terhapus dan
  // pengguna yakin pesannya terkirim. Sekarang draft dipulihkan saat gagal.
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? "Pesan gagal terkirim")
      }
      return res.json()
    },
    onSuccess: () => {
      setDraft("")
      queryClient.invalidateQueries({ queryKey: ["messages", orderId] })
    },
    onError: (error: Error, content) => {
      setDraft(content)
      toast.error("Pesan gagal terkirim", { description: error.message })
    },
  })

  const send = () => {
    const content = draft.trim()
    if (!content || sendMutation.isPending) return
    sendMutation.mutate(content)
  }

  const myId = Number(session?.user?.id)
  const remaining = MAX_LENGTH - draft.length

  return (
    <section
      aria-label={`Percakapan dengan ${otherName}`}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="border-b border-border bg-muted/40 px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="h-4 w-4 text-primary-strong" aria-hidden />
          Komunikasi dengan {otherName}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Koordinasikan jadwal, alamat, dan detail pekerjaan di sini.
        </p>
      </div>

      <div
        ref={scrollRef}
        aria-live="polite"
        className="max-h-80 space-y-4 overflow-y-auto p-5"
      >
        {isLoading ? (
          // Skeleton berbentuk gelembung chat, bukan spinner di tengah:
          // bentuknya memberi tahu apa yang sedang dimuat.
          <div className="space-y-4">
            <Skeleton className="h-14 w-3/5 rounded-2xl" />
            <Skeleton className="ml-auto h-14 w-2/5 rounded-2xl" />
            <Skeleton className="h-14 w-1/2 rounded-2xl" />
          </div>
        ) : messages && messages.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare
              className="mx-auto h-8 w-8 text-muted-foreground/40"
              aria-hidden
            />
            <p className="mt-3 text-sm font-medium">Belum ada pesan</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mulai percakapan untuk mengoordinasikan jadwal kerja.
            </p>
          </div>
        ) : (
          messages?.map((msg) => {
            const mine = msg.sender.id === myId
            return (
              <div
                key={msg.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[82%] rounded-2xl px-4 py-2.5",
                    mine ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  {!mine && (
                    <div className="mb-1 text-2xs font-semibold text-muted-foreground">
                      {msg.sender.name ?? "Pengguna"}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {msg.content}
                  </p>

                  <div
                    className={cn(
                      "mt-1.5 flex items-center justify-end gap-1.5 text-2xs",
                      mine
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    <time dateTime={msg.createdAt}>
                      {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                    {mine && <Check className="h-3 w-3" aria-label="Terkirim" />}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="border-t border-border p-4">
        <div className="flex items-end gap-3">
          <label htmlFor={`message-${orderId}`} className="sr-only">
            Tulis pesan ke {otherName}
          </label>
          <textarea
            id={`message-${orderId}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            rows={2}
            maxLength={MAX_LENGTH}
            placeholder={`Tulis pesan ke ${otherName}...`}
            className="w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          <button
            type="button"
            onClick={send}
            disabled={sendMutation.isPending || !draft.trim()}
            aria-label="Kirim pesan"
            className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow transition-transform duration-fast hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-2xs text-muted-foreground">
          <span>Enter untuk kirim • Shift+Enter untuk baris baru</span>
          {remaining < 100 && <span>{remaining} karakter tersisa</span>}
        </div>
      </div>
    </section>
  )
}
