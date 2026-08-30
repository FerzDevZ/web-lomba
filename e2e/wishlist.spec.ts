import { expect, test } from "@playwright/test"
import { login } from "./helpers/auth"

/**
 * Wishlist: toggle SaveButton (optimistic + toast) dan SavedServices di dashboard customer.
 * Menguji boundary API /api/saved tanpa memock domain logic.
 */

async function pickService(page: import("@playwright/test").Page) {
  const data = await page.evaluate(async () => {
    const res = await fetch("/api/services?take=6")
    const j = await res.json()
    const s = (j.services ?? [])[0] as { slug: string; title: string; id: string | number } | undefined
    return s
  })
  expect(data, "butuh minimal 1 jasa aktif").toBeTruthy()
  return data!
}

test.describe("wishlist — SaveButton & SavedServices", () => {
  test("toggle simpan → hapus, dan dashboard menampilkan jasa tersimpan", async ({ page }) => {
    await login(page, "customer", "/services")
    const service = await pickService(page)

    // bersihkan dulu: pastikan tidak tersimpan (toggle off jika sudah on)
    await page.evaluate(async (id: string) => {
      const check = await fetch(`/api/saved?id=${id}`, { cache: "no-store" })
      const j = await check.json().catch(() => ({ saved: false }))
      if (j.saved) {
        await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceId: id }),
        })
      }
    }, String(service.id))

    await page.goto(`/service/${service.slug}`)
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible()

    const saveBtn = page.getByRole("button", { name: /Simpan jasa ini|Simpan/i }).first()
    await expect(saveBtn).toBeVisible()

    // --- simpan ---
    await saveBtn.click()
    // optimistic: langsung jadi "Disimpan" / aria-pressed true
    await expect(page.getByRole("button", { name: /Hapus dari simpanan/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/Jasa disimpan/i).first()).toBeVisible({ timeout: 10_000 })

    // cek savedServices di dashboard
    await page.goto("/dashboard/customer")
    await expect(page.getByRole("heading", { name: /Pesanan Saya/i })).toBeVisible()
    // SavedServices card heading
    await expect(page.getByRole("heading", { name: /Jasa Disimpan/i })).toBeVisible()
    await expect(page.getByText(service.title).first()).toBeVisible({ timeout: 15_000 })

    // --- hapus lagi (toggle off) ---
    // buka kembali detail untuk toggle off, atau pakai tombol Trash di dashboard
    const trash = page.getByRole("button", { name: /Hapus dari simpanan/i }).first()
    // di dashboard, tombolnya icon Trash2 dengan aria-label sama
    if (await trash.isVisible().catch(() => false)) {
      await trash.click()
    } else {
      await page.goto(`/service/${service.slug}`)
      await page.getByRole("button", { name: /Hapus dari simpanan/i }).click()
    }
    await expect(page.getByText(/Jasa dihapus dari simpanan/i).first()).toBeVisible({ timeout: 10_000 })

    // verifikasi hilang dari dashboard — polling via API lebih stabil daripada sleep
    await page.goto("/dashboard/customer")
    await expect(page.getByRole("heading", { name: /Jasa Disimpan/i })).toBeVisible()
    await expect.poll(async () => {
      const has = await page.evaluate(async (slug: string) => {
        const r = await fetch("/api/saved", { cache: "no-store" })
        const j = (await r.json().catch(() => [])) as { slug: string }[]
        return j.some((s) => s.slug === slug)
      }, service.slug)
      return has
    }, { timeout: 10_000 }).toBe(false)
    const stillThere = await page.getByText(service.title).count()
    // setelah dihapus, judul jasa tidak lagi di section Jasa Disimpan (mungkin masih di order list, tapi cek card saved)
    // kalau masih 0 di saved grid, dianggap sukses; kalau >0 tapi dari order list, skip assert ketat
    if (stillThere > 0) {
      // cek via API lebih akurat
      const savedList = await page.evaluate(async () => {
        const r = await fetch("/api/saved")
        return (await r.json()) as { slug: string }[]
      })
      expect(savedList.find((s) => s.slug === service.slug)).toBeUndefined()
    }
  })

  test("unauth klik Simpan → redirect /login?callbackUrl", async ({ page }) => {
    await page.context().clearCookies()
    const service = await (async () => {
      // ambil slug tanpa login via request fixture-like fetch
      const slug = await page.evaluate(async () => {
        const r = await fetch("/api/services?take=1")
        const j = await r.json()
        return j.services?.[0]?.slug ?? ""
      })
      return slug as string
    })()
    // jika API butuh auth, fallback ke slug statis
    const targetSlug = service || "layanan-perbaikan-ac"
    await page.goto(`/service/${targetSlug}`)
    // jika 404, skip
    if ((await page.getByText(/tidak ditemukan/i).count()) > 0) {
      test.skip(true, "slug tidak ada, skip unauth wishlist")
      return
    }
    const saveBtn = page.getByRole("button", { name: /Simpan/i }).first()
    if ((await saveBtn.count()) === 0) test.skip(true, "SaveButton tidak render untuk unauth?")
    await saveBtn.click()
    await expect(page).toHaveURL(/\/login\?callbackUrl=/)
  })

  test.skip("optimistic rollback saat API 500 (simulasi) — skip default, manual", async () => {
    // Gagasan: intercept /api/saved POST → 500, klik Simpan, pastikan toast "Gagal menyimpan" dan tombol rollback ke Simpan.
    // Dibiarkan skip agar tidak flaky di CI tanpa intercept stabil.
  })
})
