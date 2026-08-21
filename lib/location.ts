/**
 * Normalisasi lokasi penyedia jasa.
 *
 * Kolom `User.location` di database bercampur dua bentuk: nama kota polos
 * ("Bandung") dan alamat lengkap ("Jl. Braga No.45, Bandung"). Menghitung kota
 * unik dengan `new Set(locations)` mentah karena itu menghasilkan 14 padahal
 * kota sebenarnya hanya 7 — angka "14+ Kota di Indonesia" di landing page dan
 * "di 14 kota" di hero sama-sama membesar dua kali lipat.
 *
 * Aturan: ambil segmen setelah koma TERAKHIR sebagai nama kota, karena format
 * alamat Indonesia menaruh kota di akhir ("Jl. X No.1, Kelurahan, Bandung").
 */
export function cityFromLocation(location: string | null | undefined): string | null {
  if (!location) return null

  const segments = location
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  if (segments.length === 0) return null

  const city = segments[segments.length - 1]

  // Segmen yang masih berupa penggal jalan bukan nama kota. Kalau seluruh
  // string hanya alamat tanpa kota, lebih baik null daripada mencemari hitungan.
  if (/^(jl\.?|jalan|gg\.?|gang|no\.?|rt|rw|blok)\b/i.test(city)) return null

  return city
}

/** Jumlah kota unik dari daftar lokasi mentah, case-insensitive. */
export function countUniqueCities(
  locations: (string | null | undefined)[]
): number {
  const cities = new Set<string>()

  for (const location of locations) {
    const city = cityFromLocation(location)
    if (city) cities.add(city.toLowerCase())
  }

  return cities.size
}
