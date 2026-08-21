import { expect, type Page } from "@playwright/test"

/**
 * Akun dari prisma/seed.js. Password seragam untuk semua akun seed.
 * Ini kredensial pengembangan, bukan rahasia produksi.
 */
export const ACCOUNTS = {
  customer: {
    email: "dewi.lestari@email.com",
    password: "password123",
    name: "Dewi Lestari",
  },
  provider: {
    email: "budi.santoso@email.com",
    password: "password123",
    name: "Budi Santoso",
  },
  admin: {
    email: "admin@servislokal.id",
    password: "password123",
    name: "Admin ServisLokal",
  },
} as const

/**
 * Masuk lewat form login sungguhan, bukan menyuntik cookie sesi.
 *
 * Alasannya: alur kredensial NextAuth (signIn → set cookie → router.refresh)
 * adalah bagian yang ingin diuji. Menyuntik cookie akan melewati justru bagian
 * yang paling mungkin rusak saat konfigurasi auth berubah.
 */
export async function login(
  page: Page,
  account: keyof typeof ACCOUNTS,
  callbackUrl = "/dashboard"
) {
  const { email, password } = ACCOUNTS[account]

  // Cookie WAJIB dibersihkan dulu. Kalau sesi lama masih ada, middleware
  // me-redirect /login ke /dashboard sebelum form tampil — login() lolos tanpa
  // benar-benar berganti akun, dan test berikutnya berjalan sebagai user yang
  // salah. Ini yang membuat langkah customer sebelumnya tereksekusi dengan
  // sesi provider.
  await page.context().clearCookies()

  await page.goto(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)

  // Selector di-scope ke <form>, bukan ke seluruh halaman: navbar punya tombol
  // "Masuk" sendiri dan footer punya tautan ber-aria-label "Kirim email ke
  // ServisLokal", jadi getByLabel("Email") maupun getByRole("button",
  // { name: "Masuk" }) sama-sama ambigu di level page.
  const form = page.locator("form").filter({ has: page.locator("input#email") })

  await form.locator("input#email").fill(email)
  await form.locator("input#password").fill(password)
  await form.getByRole("button", { name: "Masuk" }).click()

  // Login berhasil bila kita meninggalkan /login. Menunggu URL, bukan elemen,
  // karena halaman tujuan berbeda per role.
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 })
}

export async function logout(page: Page) {
  await page.goto("/dashboard")
  const signOut = page.getByRole("button", { name: /Keluar dari Akun/i })
  if (await signOut.isVisible().catch(() => false)) {
    await signOut.click()
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 })
  } else {
    // Drawer mobile / layout berbeda: bersihkan cookie sebagai cadangan.
    await page.context().clearCookies()
  }
}
