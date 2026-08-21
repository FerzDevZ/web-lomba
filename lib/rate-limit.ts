// Rate limiter Token Bucket in-memory.
//
// Cakupan: melindungi endpoint tulis & endpoint pencarian dari burst/abuse
// pada satu instance Node (dev, VPS single-node, atau Vercel per-lambda).
// CATATAN PRODUKSI: state ini per-proses, jadi pada deployment multi-instance
// kuota efektif = limit × jumlah instance. Untuk penegakan global, ganti
// implementasi `consume()` dengan Redis (INCR + EXPIRE) atau Upstash Ratelimit
// tanpa mengubah pemanggil — kontrak fungsinya sengaja dibuat sinkron-agnostik.

type Bucket = {
  tokens: number
  updatedAt: number
}

export type RateLimitRule = {
  /** Jumlah permintaan yang diizinkan dalam satu jendela. */
  limit: number
  /** Panjang jendela dalam milidetik. */
  windowMs: number
}

export type RateLimitResult = {
  ok: boolean
  limit: number
  remaining: number
  /** Detik hingga kuota terisi cukup untuk satu permintaan lagi. */
  retryAfterSeconds: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Ambang pembersihan: cegah Map tumbuh tanpa batas pada trafik dengan
// banyak IP unik. Dibersihkan secara oportunistik saat ada permintaan baru.
const MAX_TRACKED_KEYS = 10_000
let lastSweep = 0

function sweep(now: number, windowMs: number) {
  // Sapu maksimal sekali per jendela agar tidak jadi beban di jalur panas.
  if (now - lastSweep < windowMs) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (now - bucket.updatedAt > windowMs * 2) {
      buckets.delete(key)
    }
  }
}

export function consume(key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now()
  const { limit, windowMs } = rule
  const refillPerMs = limit / windowMs

  if (buckets.size > MAX_TRACKED_KEYS) sweep(now, windowMs)

  const existing = buckets.get(key)
  const bucket: Bucket = existing ?? { tokens: limit, updatedAt: now }

  if (existing) {
    const elapsed = now - existing.updatedAt
    bucket.tokens = Math.min(limit, existing.tokens + elapsed * refillPerMs)
    bucket.updatedAt = now
  }

  if (bucket.tokens < 1) {
    const msUntilOneToken = (1 - bucket.tokens) / refillPerMs
    buckets.set(key, bucket)
    return {
      ok: false,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(msUntilOneToken / 1000)),
      resetAt: now + msUntilOneToken,
    }
  }

  bucket.tokens -= 1
  buckets.set(key, bucket)

  return {
    ok: true,
    limit,
    remaining: Math.floor(bucket.tokens),
    retryAfterSeconds: 0,
    resetAt: now + (limit - bucket.tokens) / refillPerMs,
  }
}

// Identitas pemanggil: utamakan user id (lebih adil di belakang NAT/CGNAT),
// jatuh ke IP dari header proxy bila anonim.
export function clientKey(request: Request, userId?: string | number | null) {
  if (userId != null) return `u:${userId}`

  const forwarded = request.headers.get("x-forwarded-for")
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"

  return `ip:${ip}`
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: Record<string, string> = {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
  }
  if (!result.ok) {
    headers["Retry-After"] = String(result.retryAfterSeconds)
  }
  return headers
}

// Aturan per jenis endpoint. Angka dipilih agar pemakaian normal manusia
// tidak pernah tersentuh, tetapi skrip/bot langsung tertahan.
export const RATE_LIMITS = {
  /** Pendaftaran akun: mahal (bcrypt) dan target utama spam. */
  register: { limit: 5, windowMs: 60 * 60 * 1000 },
  /** Pembuatan pesanan. */
  orderCreate: { limit: 10, windowMs: 10 * 60 * 1000 },
  /** Perubahan status pesanan. */
  orderMutate: { limit: 30, windowMs: 5 * 60 * 1000 },
  /** Kirim ulasan. */
  review: { limit: 10, windowMs: 60 * 60 * 1000 },
  /** Chat pada pesanan. */
  message: { limit: 40, windowMs: 60 * 1000 },
  /** Simpan/hapus wishlist. */
  save: { limit: 60, windowMs: 60 * 1000 },
  /** Autocomplete pencarian — dipanggil per ketukan tombol. */
  search: { limit: 60, windowMs: 60 * 1000 },
  /** Endpoint baca umum (katalog, daftar milik sendiri, ulasan). */
  read: { limit: 120, windowMs: 60 * 1000 },
  /** Polling notifikasi dari navbar (interval ~60s per tab). */
  notifications: { limit: 120, windowMs: 60 * 1000 },
  /** Agregasi admin: query berat, hanya dipakai dashboard admin. */
  adminRead: { limit: 60, windowMs: 60 * 1000 },
  /** Ekspor CSV: memuat seluruh tabel order. */
  adminExport: { limit: 5, windowMs: 5 * 60 * 1000 },
  /** Pembuatan / perubahan jasa oleh provider. */
  serviceWrite: { limit: 20, windowMs: 10 * 60 * 1000 },
  /** Impersonasi admin: sangat sensitif. */
  impersonate: { limit: 10, windowMs: 60 * 60 * 1000 },
} as const satisfies Record<string, RateLimitRule>

// Hanya untuk pengujian: kosongkan state antar test case.
export function __resetRateLimiter() {
  buckets.clear()
  lastSweep = 0
}
