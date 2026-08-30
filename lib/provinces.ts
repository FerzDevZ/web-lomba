// Daftar 38 provinsi Indonesia (2023, pemekaran Papua)
// Sumber: Kemendagri. Dipakai untuk filter lokasi, autocomplete, dan hero pills.
// Disimpan lowercase untuk pencocokan `provider.city contains`.

export const PROVINCES = [
  "Aceh",
  "Bali",
  "Banten",
  "Bengkulu",
  "DI Yogyakarta",
  "DKI Jakarta",
  "Gorontalo",
  "Jambi",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "Kalimantan Barat",
  "Kalimantan Selatan",
  "Kalimantan Tengah",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Kepulauan Bangka Belitung",
  "Kepulauan Riau",
  "Lampung",
  "Maluku",
  "Maluku Utara",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Papua",
  "Papua Barat",
  "Papua Barat Daya",
  "Papua Pegunungan",
  "Papua Selatan",
  "Papua Tengah",
  "Riau",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tengah",
  "Sulawesi Tenggara",
  "Sulawesi Utara",
  "Sumatera Barat",
  "Sumatera Selatan",
  "Sumatera Utara",
] as const

export type Province = typeof PROVINCES[number]

// Kota besar per provinsi untuk seed & placeholder (tidak exhaustive, tapi cukup untuk UX)
export const PROVINCE_CAPITALS: Record<string, string[]> = {
  "Aceh": ["Banda Aceh"],
  "Bali": ["Denpasar"],
  "Banten": ["Serang"],
  "Bengkulu": ["Bengkulu"],
  "DI Yogyakarta": ["Yogyakarta"],
  "DKI Jakarta": ["Jakarta Selatan", "Jakarta Utara", "Jakarta Barat", "Jakarta Timur", "Jakarta Pusat"],
  "Gorontalo": ["Gorontalo"],
  "Jambi": ["Jambi"],
  "Jawa Barat": ["Bandung", "Bekasi", "Depok"],
  "Jawa Tengah": ["Semarang", "Solo"],
  "Jawa Timur": ["Surabaya", "Malang", "Sidoarjo"],
  "Kalimantan Barat": ["Pontianak"],
  "Kalimantan Timur": ["Balikpapan", "Samarinda"],
  "Kepulauan Bangka Belitung": ["Pangkal Pinang"],
  "Kepulauan Riau": ["Tanjung Pinang", "Batam"],
  "Lampung": ["Bandar Lampung"],
  "Maluku": ["Ambon"],
  "Nusa Tenggara Barat": ["Mataram"],
  "Nusa Tenggara Timur": ["Kupang"],
  "Papua": ["Jayapura"],
  "Sulawesi Selatan": ["Makassar"],
  "Sulawesi Tengah": ["Palu"],
  "Sulawesi Utara": ["Manado"],
  "Sumatera Utara": ["Medan"],
}

// Untuk autocomplete: gabung provinsi + kota besar jadi satu list datar
export const LOCATION_SUGGESTIONS: string[] = [
  ...PROVINCES,
  ...Object.values(PROVINCE_CAPITALS).flat(),
  // Kota tambahan yang sudah ada di seed
  "Jakarta Selatan", "Bandung", "Surabaya", "Medan", "Yogyakarta", "Makassar",
  "Pangkal Pinang", "Tanjung Pinang", "Bengkulu", "Jambi", "Pontianak", "Balikpapan",
  "Denpasar", "Mataram", "Kupang", "Manado", "Palu", "Ambon", "Jayapura", "Lampung", "Serang"
]

export function searchLocations(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase()
  if (!q || q.length < 1) return []
  return LOCATION_SUGGESTIONS.filter(l => l.toLowerCase().includes(q)).slice(0, limit)
}
