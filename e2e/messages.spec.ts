import { expect, test } from "@playwright/test"
import { ACCOUNTS, login } from "./helpers/auth"

/**
 * Messages: customer kirim "Halo", provider lihat.
 * Menguji MessageThread polling 15s + optimistic bubble + persist via /api/orders/[id]/messages.
 * Prasyarat: ada pesanan antara customer dan provider uji. Jika belum ada, buat 1 via API.
 */

async function ensureOrderBetween(
  page: import("@playwright/test").Page
): Promise<string> {
  const orderId = await page.evaluate(async (providerName: string) => {
    // cek pesanan existing
    const listRes = await fetch("/api/orders")
    const list = (await listRes.json().catch(() => [])) as { id: string | number }[]
    if (list.length > 0) return String(list[0].id)

    // buat baru
    const svcRes = await fetch(`/api/services?search=${encodeURIComponent(providerName)}`)
    const svcData = await svcRes.json().catch(() => ({ services: [] }))
    const svc = svcData.services?.[0] as { id: string | number } | undefined
    if (!svc) return ""
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: svc.id,
        address: "Jl. Pesan Uji No.1, Denpasar, Bali",
        orderNotes: "Order untuk uji messages",
      }),
    })
    if (!res.ok) return ""
    const order = await res.json()
    return String(order.id)
  }, ACCOUNTS.provider.name)
  expect(orderId, "harus punya order untuk uji pesan").toBeTruthy()
  return orderId as string
}

test.describe("messages — percakapan pesanan", () => {
  test("customer kirim 'Halo', provider melihat pesan yang sama", async ({ page }) => {
    const messageText = `Halo provider — uji pesan ${Date.now()}`

    // --- sebagai customer: kirim pesan ---
    await login(page, "customer", "/dashboard/customer")
    const orderId = await ensureOrderBetween(page)
    await page.goto(`/orders/${orderId}`)
    await expect(page.getByRole("heading", { name: new RegExp(`Pesanan #${orderId}`) })).toBeVisible({
      timeout: 15_000,
    })

    // tunggu thread siap
    const thread = page.getByLabel(/Percakapan dengan/i).first()
    await expect(thread).toBeVisible({ timeout: 15_000 })
    const textarea = page.getByPlaceholder(/Tulis pesan ke/i).first()
    await expect(textarea).toBeVisible()

    await textarea.fill(messageText)
    // tombol kirim (icon Send)
    const sendBtn = page.getByRole("button", { name: /Kirim pesan/i }).first()
    await expect(sendBtn).toBeEnabled()
    await sendBtn.click()

    // optimistic bubble + terkirim
    await expect(page.getByText(messageText).first()).toBeVisible({ timeout: 15_000 })
    // ikon Check "Terkirim" muncul setelah sukses
    await expect(page.getByLabel("Terkirim").first()).toBeVisible({ timeout: 15_000 })

    // --- sebagai provider: lihat pesan yang sama ---
    await login(page, "provider", `/orders/${orderId}`)
    await expect(page.getByRole("heading", { name: new RegExp(`Pesanan #${orderId}`) })).toBeVisible({
      timeout: 15_000,
    })
    const providerThread = page.getByLabel(/Percakapan dengan/i).first()
    await expect(providerThread).toBeVisible({ timeout: 15_000 })
    // provider harus melihat teks yang dikirim customer
    await expect(page.getByText(messageText).first()).toBeVisible({ timeout: 20_000 })
  })

  test("validasi: pesan kosong tidak terkirim", async ({ page }) => {
    await login(page, "customer", "/dashboard/customer")
    const orderId = await ensureOrderBetween(page)
    await page.goto(`/orders/${orderId}`)
    const textarea = page.getByPlaceholder(/Tulis pesan ke/i).first()
    await expect(textarea).toBeVisible({ timeout: 15_000 })
    await textarea.fill("   ")
    const sendBtn = page.getByRole("button", { name: /Kirim pesan/i }).first()
    await expect(sendBtn).toBeDisabled()
  })

  test.skip("rate-limit pesan — skip default (butuh trigger 429), manual", async () => {
    // Gagasan: kirim > RATE_LIMITS.message dalam window singkat, pastikan toast 429.
    // Dibiarkan skip agar tidak memperlambat CI.
  })
})
