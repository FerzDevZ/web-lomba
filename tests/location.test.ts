import { describe, expect, it } from "vitest"
import { countUniqueCities, cityFromLocation } from "@/lib/location"

/**
 * Kontrak parsing lokasi.
 *
 * Aturan yang sama disalin di TIGA tempat karena keduanya harus berjalan tanpa
 * build step (Node polos):
 *   - lib/location.ts        (dipakai aplikasi & API register)
 *   - prisma/backfill-city.js
 *   - prisma/seed.js
 *
 * Test ini adalah pagarnya: kalau salah satu salinan menyimpang, kasus di sini
 * yang menangkapnya. Kalau aturan berubah, ubah di tiga tempat itu sekaligus.
 */

describe("cityFromLocation", () => {
  it("mengembalikan nama kota polos apa adanya", () => {
    expect(cityFromLocation("Bandung")).toBe("Bandung")
    expect(cityFromLocation("Jakarta Selatan")).toBe("Jakarta Selatan")
  })

  it("mengambil kota dari alamat lengkap (segmen setelah koma terakhir)", () => {
    expect(cityFromLocation("Jl. Braga No.45, Bandung")).toBe("Bandung")
    expect(cityFromLocation("Jl. Tebet Raya No.5, Jakarta Selatan")).toBe(
      "Jakarta Selatan"
    )
    expect(cityFromLocation("Jl. X No.1, Tebet, Jakarta Selatan")).toBe(
      "Jakarta Selatan"
    )
  })

  it("merapikan spasi berlebih", () => {
    expect(cityFromLocation("  Jl. A No.1 ,   Surabaya  ")).toBe("Surabaya")
  })

  it("mengembalikan null untuk input kosong", () => {
    expect(cityFromLocation(null)).toBeNull()
    expect(cityFromLocation(undefined)).toBeNull()
    expect(cityFromLocation("")).toBeNull()
    expect(cityFromLocation("   ")).toBeNull()
    expect(cityFromLocation(",,,")).toBeNull()
  })

  it("mengembalikan null bila segmen terakhir masih penggal jalan", () => {
    expect(cityFromLocation("Jl. Melati No.12")).toBeNull()
    expect(cityFromLocation("Perumahan Indah, Blok C2")).toBeNull()
    expect(cityFromLocation("RT 05")).toBeNull()
  })
})

describe("countUniqueCities", () => {
  it("menyatukan alamat lengkap dengan nama kota polos", () => {
    // Kasus nyata dari seed: 14 baris, hanya 7 kota.
    const locations = [
      "Jakarta Selatan",
      "Bandung",
      "Surabaya",
      "Medan",
      "Yogyakarta",
      "Makassar",
      "Semarang",
      "Jl. Melati No.12, Jakarta Selatan",
      "Jl. Braga No.45, Bandung",
      "Jl. Basuki Rahmat No.8, Surabaya",
      "Jl. Sudirman No.22, Medan",
      "Jl. Prawirotaman No.17, Yogyakarta",
      "Jl. Pettarani No.11, Makassar",
      "Jl. Tebet Raya No.5, Jakarta Selatan",
    ]
    expect(countUniqueCities(locations)).toBe(7)
  })

  it("tidak membedakan huruf besar-kecil", () => {
    expect(countUniqueCities(["bandung", "Bandung", "BANDUNG"])).toBe(1)
  })

  it("mengabaikan nilai kosong dan alamat tanpa kota", () => {
    expect(
      countUniqueCities([null, undefined, "", "Jl. Melati No.12", "Bandung"])
    ).toBe(1)
  })

  it("mengembalikan 0 untuk daftar kosong", () => {
    expect(countUniqueCities([])).toBe(0)
  })
})

describe("konsistensi filter katalog", () => {
  // Regresi yang diperbaiki oleh kolom `city`: filter dulu memakai
  // `location contains <query>`, sehingga penggal alamat mencocokkan semuanya.
  const SEED_LOCATIONS = [
    "Jl. Melati No.12, Jakarta Selatan",
    "Jl. Braga No.45, Bandung",
    "Jl. Basuki Rahmat No.8, Surabaya",
  ]

  const asCity = (location: string) =>
    (cityFromLocation(location) ?? "").toLowerCase()

  it('kueri "jl" tidak lagi mencocokkan kota mana pun', () => {
    const matches = SEED_LOCATIONS.filter((l) => asCity(l).includes("jl"))
    expect(matches).toEqual([])
  })

  it('kueri "no" tidak lagi mencocokkan kota mana pun', () => {
    const matches = SEED_LOCATIONS.filter((l) => asCity(l).includes("no"))
    expect(matches).toEqual([])
  })

  it("kueri nama kota tetap cocok tanpa peduli huruf besar-kecil", () => {
    for (const query of ["bandung", "Bandung", "BANDUNG"]) {
      const matches = SEED_LOCATIONS.filter((l) =>
        asCity(l).includes(query.toLowerCase())
      )
      expect(matches).toHaveLength(1)
    }
  })
})
