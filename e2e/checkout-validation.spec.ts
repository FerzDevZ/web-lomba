import { expect, test } from "@playwright/test"
import { ACCOUNTS, login } from "./helpers/auth"

/**
 * Validasi checkout: 5 kasus.
 * - Alamat kosong, alamat tanpa kota, deadline kemarin (min), own service, tanpa slug.
 * Semua diuji lewat UI agar validasi cityFromLocation + minDate benar-benar dieksekusi.
 */

async function getActiveServiceSlug(
  page: import("@playwright/test").Page,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _excludeProvider?: boolean
): Promise<string> {
  const slug = await page.evaluate(async (providerName: string) => {
    // cari jasa aktif umum (bukan milik provider uji)
    const res = await fetch("/api/services?take=12")
    const data = await res.json()
    const services: { slug: string; provider: { name: string | null } }[] = data.services ?? []
    const other = services.find((s) => s.provider?.name !== providerName)
    return other?.slug ?? services[0]?.slug ?? ""
  }, ACCOUNTS.provider.name)
  expect(slug, "harus ada slug aktif untuk uji checkout").toBeTruthy()
  return slug
}

async function getOwnServiceSlug(page: import("@playwright/test").Page): Promise<string> {
  const slug = await page.evaluate(async (providerName: string) => {
    const res = await fetch(`/api/services?search=${encodeURIComponent(providerName)}`)
    const data = await res.json()
    const services: { slug: string }[] = data.services ?? []
    return services[0]?.slug ?? ""
  }, ACCOUNTS.provider.name)
  expect(slug, "provider harus punya jasa aktif").toBeTruthy()
  return slug as string
}

test.describe("checkout validation", () => {
  test("alamat kosong → error 'Alamat pelaksanaan wajib diisi'", async ({ page }) => {
    await login(page, "customer", "/services")
    const slug = await getActiveServiceSlug(page)
    await page.goto(`/checkout?service=${slug}`)
    await expect(page.getByRole("heading", { name: /Detail Pesanan/i })).toBeVisible()

    // kosongkan alamat, langsung submit
    const address = page.getByLabel(/Alamat Pelaksanaan/i)
    await address.fill("")
    // blur untuk trigger touched state bila ada
    await address.blur()
    await page.getByRole("button", { name: /Konfirmasi Pesanan/i }).first().click()

    await expect(page.getByText(/Alamat pelaksanaan wajib diisi/i).first()).toBeVisible({ timeout: 10_000 })
    // tetap di halaman checkout, tidak berhasil
    await expect(page).toHaveURL(/\/checkout\?service=/)
  })

  test("alamat tanpa kota → error 'Sertakan kota & provinsi'", async ({ page }) => {
    await login(page, "customer", "/services")
    const slug = await getActiveServiceSlug(page)
    await page.goto(`/checkout?service=${slug}`)
    await expect(page.getByLabel(/Alamat Pelaksanaan/i)).toBeVisible()

    const address = page.getByLabel(/Alamat Pelaksanaan/i)
    await address.fill("Jl. Melati No.12 RT 03 RW 04")
    await address.blur()
    await page.getByRole("button", { name: /Konfirmasi Pesanan/i }).first().click()

    await expect(page.getByText(/Sertakan kota & provinsi/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test("deadline kemarin → input min besok (tidak bisa pilih kemarin) + API menolak jadwal masa lalu", async ({
    page,
    request,
  }) => {
    await login(page, "customer", "/services")
    const slug = await getActiveServiceSlug(page)
    await page.goto(`/checkout?service=${slug}`)

    const deadline = page.getByLabel(/Jadwal yang Diinginkan/i)
    await expect(deadline).toBeVisible()
    const min = await deadline.getAttribute("min")
    expect(min, "min harus besok (YYYY-MM-DD)").toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const minDate = new Date(min!)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    // toleransi zona: cukup pastikan min adalah besok, bukan hari ini/kemarin
    expect(minDate.toISOString().slice(0, 10)).toBe(tomorrow.toISOString().slice(0, 10))

    // coba bypass UI: kirim deadline kemarin via API — harus 400
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    // ambil serviceId via api
    const svcRes = await page.evaluate(async (s: string) => {
      const r = await fetch(`/api/services?slug=${s}`)
      const j = await r.json()
      return j.services?.[0]?.id ?? null
    }, slug)
    // pakai page.evaluate agar cookie sesi ikut
    const apiResult = await page.evaluate(
      async ({ serviceId, deadlineIso }: { serviceId: string; deadlineIso: string }) => {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId,
            address: "Jl. Sudirman No.1, Jakarta Selatan, DKI Jakarta",
            deadline: deadlineIso,
          }),
        })
        const body = await res.json().catch(() => ({}))
        return { status: res.status, body }
      },
      { serviceId: String(svcRes), deadlineIso: yesterday }
    )
    expect(apiResult.status).toBe(400)
    expect(apiResult.body.error).toMatch(/Jadwal harus di masa depan/i)
    void request // menjaga signature tetap konsisten dengan fixture
  })

  test("own service → empty state 'Tidak bisa memesan jasa sendiri'", async ({ page }) => {
    await login(page, "provider", "/services")
    const ownSlug = await getOwnServiceSlug(page)
    await page.goto(`/checkout?service=${ownSlug}`)
    await expect(page.getByText(/Tidak bisa memesan jasa sendiri/i)).toBeVisible({ timeout: 10_000 })
    // tombol konfirmasi harus disabled
    const confirm = page.getByRole("button", { name: /Konfirmasi Pesanan/i })
    if ((await confirm.count()) > 0) {
      await expect(confirm.first()).toBeDisabled()
    }
  })

  test("without slug → ServiceNotFound 'Jasa tidak ditemukan'", async ({ page }) => {
    await login(page, "customer", "/services")
    await page.goto("/checkout")
    await expect(page.getByRole("heading", { name: /Jasa tidak ditemukan/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /Jelajahi Jasa/i })).toBeVisible()
  })
})
