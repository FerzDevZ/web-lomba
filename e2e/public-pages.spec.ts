import { expect, test } from "@playwright/test"

/**
 * Smoke test halaman publik.
 *
 * Sengaja memeriksa hal yang tidak bisa dibuktikan unit test: bahwa server
 * produksi benar-benar merender halaman, judulnya satu dan tepat, dan rute
 * terproteksi mengarahkan ke login alih-alih membocorkan isi.
 */

test.describe("halaman publik", () => {
  test("landing page merender hero beserta bukti sosial", async ({ page }) => {
    await page.goto("/")

    await expect(
      page.getByRole("heading", { level: 1, name: /Jasa terbaik dari/i })
    ).toBeVisible()

    // Kartu statistik hero: angka diambil dari database, bukan hardcode.
    await expect(page.getByText(/Penyedia jasa aktif/i).first()).toBeVisible()
    await expect(page.getByText(/Bergabung bersama/i)).toBeVisible()
  })

  test("tepat satu h1 dan tidak ada lompatan level heading", async ({ page }) => {
    for (const path of ["/", "/services", "/faq", "/login", "/register"]) {
      await page.goto(path)

      const levels = await page.$$eval("h1,h2,h3,h4,h5,h6", (nodes) =>
        nodes.map((n) => Number(n.tagName.slice(1)))
      )

      expect(levels.filter((l) => l === 1), `${path}: jumlah h1`).toHaveLength(1)
      expect(levels[0], `${path}: heading pertama harus h1`).toBe(1)

      const jumps = levels
        .slice(1)
        .map((level, i) => [levels[i], level])
        .filter(([prev, next]) => next - prev > 1)
      expect(jumps, `${path}: lompatan level heading`).toEqual([])
    }
  })

  test("katalog menampilkan jasa dan jumlah totalnya", async ({ page }) => {
    await page.goto("/services")

    await expect(
      page.getByRole("heading", { level: 1, name: "Jelajahi Jasa" })
    ).toBeVisible()
    await expect(page.getByText(/\d+ jasa ditemukan/)).toBeVisible()
  })

  test("slug yang tidak ada menampilkan not-found dan noindex", async ({
    page,
  }) => {
    const response = await page.goto("/service/slug-yang-tidak-pernah-ada")

    // Status di sini 200, BUKAN 404 — dan itu bukan kelalaian test.
    // <Navbar /> adalah async server component di root layout, sehingga Next.js
    // sudah mulai men-stream respons (header terkirim) sebelum notFound() di
    // page.tsx dievaluasi. Status HTTP tidak bisa diubah setelah itu.
    //
    // Yang bisa dan harus dijamin: UI not-found tampil, dan halaman diberi
    // noindex supaya crawler tidak mengindeks soft 404 untuk slug ngawur.
    expect(response?.status()).toBe(200)
    await expect(page.getByText(/tidak ditemukan/i).first()).toBeVisible()
  })

  test("slug tidak ada dikirim dengan meta robots noindex", async ({
    request,
  }) => {
    // Diperiksa pada HTML mentah, bukan DOM: not-found boundary React menukar
    // isi <head> setelah hydration, sehingga tag yang dilihat crawler (yang
    // tidak menjalankan JS) hanya terlihat di respons server.
    const response = await request.get("/service/slug-yang-tidak-pernah-ada")
    const html = await response.text()

    const robotsTags = html.match(/<meta name="robots" content="[^"]*"/g) ?? []
    expect(robotsTags.length).toBeGreaterThan(0)
    for (const tag of robotsTags) {
      expect(tag).toMatch(/noindex/)
    }
  })

  test("rute tak terdaftar diarahkan ke login oleh middleware", async ({
    page,
  }) => {
    // middleware.ts memakai daftar-putih: apa pun di luar PUBLIC_PATHS
    // diarahkan ke /login sebelum routing Next.js sempat mengembalikan 404.
    // Ini keputusan sengaja (tidak membocorkan rute mana yang ada), jadi yang
    // diuji adalah redirect-nya — bukan 404.
    await page.goto("/rute-yang-tidak-pernah-ada")
    await expect(page).toHaveURL(/\/login/)
  })

  test("rute terproteksi mengarahkan ke login", async ({ page }) => {
    for (const path of ["/dashboard", "/checkout", "/orders/1"]) {
      await page.goto(path);
      await expect(page, `${path} harus redirect`).toHaveURL(/\/login/)
    }
  })
})

test.describe("filter lokasi katalog", () => {
  /**
   * Regresi yang diperbaiki kolom `city`: filter dulu memakai
   * `provider.location contains <query>` sehingga potongan alamat seperti "Jl"
   * mencocokkan seluruh katalog. Test ini membandingkan jumlah hasil lewat API
   * agar tidak bergantung pada paginasi UI.
   */
  test("penggal alamat tidak lagi mengembalikan seluruh katalog", async ({
    request,
  }) => {
    const all = await request.get("/api/services")
    expect(all.ok()).toBeTruthy()
    const total = (await all.json()).total as number
    expect(total).toBeGreaterThan(0)

    for (const query of ["Jl", "No"]) {
      const res = await request.get(`/api/services?location=${query}`)
      expect(res.ok()).toBeTruthy()
      const filtered = (await res.json()).total as number
      expect(filtered, `location=${query} tidak boleh mengembalikan semua`).toBeLessThan(
        total
      )
    }
  })

  test("nama kota cocok tanpa peduli huruf besar-kecil", async ({ request }) => {
    const counts: number[] = []

    for (const query of ["bandung", "Bandung", "BANDUNG"]) {
      const res = await request.get(`/api/services?location=${query}`)
      expect(res.ok()).toBeTruthy()
      counts.push((await res.json()).total as number)
    }

    expect(counts[0]).toBeGreaterThan(0)
    // Ketiganya harus identik. Sebelum normalisasi, ini akan pecah di
    // PostgreSQL karena `mode: "insensitive"` tidak dipakai.
    expect(new Set(counts).size, `hasil beda per kapitalisasi: ${counts}`).toBe(1)
  })
})
