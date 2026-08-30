// Helper untuk menangani ID yang bisa Int (SQLite/Postgres) atau String ObjectId (MongoDB)
export function isObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

export function toPrismaId(id: string): string | number {
  if (!id) return id as unknown as number
  const trimmed = String(id).trim()
  if (!trimmed) return id as unknown as number
  // Jika 24 hex => Mongo ObjectId, biarkan string
  if (isObjectId(trimmed)) return trimmed
  // Hanya parse jika murni digit (hindari "123abc" -> 123)
  if (/^\d+$/.test(trimmed)) {
    const n = parseInt(trimmed, 10)
    return Number.isNaN(n) ? trimmed : n
  }
  return trimmed
}

// Untuk where clause yang butuh id
export function whereId(id: string): string | number {
  return toPrismaId(id)
}

// Bandingkan dua ID (bisa string atau number) sebagai string
export function sameId(a: unknown, b: unknown): boolean {
  return String(a) === String(b)
}
