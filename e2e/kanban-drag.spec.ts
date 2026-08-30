import { expect, test } from "@playwright/test"
import { ACCOUNTS, login } from "./helpers/auth"

/**
 * Kanban drag — GripVertical dari PENDING ke IN_PROGRESS + invalid target toast.
 * Kanban ada di /dashboard/provider, memakai dnd-kit dengan PointerSensor distance 6px.
 */

// helper: buat 1 pesanan PENDING via API (customer → provider)
async function ensurePendingOrder(page: import("@playwright/test").Page): Promise<string | null> {
  return page.evaluate(async (providerName: string) => {
    // cari jasa aktif milik provider uji
    const svcRes = await fetch(`/api/services?search=${encodeURIComponent(providerName)}`)
    const svcData = await svcRes.json().catch(() => ({ services: [] }))
    const service = svcData.services?.[0] as { id: string | number; slug: string } | undefined
    if (!service) return null
    // buat pesanan sebagai customer yang sedang login (page harus sudah login customer)
    const orderRes = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: service.id,
        address: "Jl. Uji Kanban No.1, Denpasar, Bali",
        orderNotes: "Pesanan uji kanban drag",
      }),
    })
    if (!orderRes.ok) return null
    const order = await orderRes.json()
    return String(order.id)
  }, ACCOUNTS.provider.name)
}

test.describe("kanban drag — provider", () => {
  test("grip handle GripVertical terlihat dan bisa drag PENDING → IN_PROGRESS", async ({ page }) => {
    // pastikan ada pesanan: login customer buat 1 order PENDING
    await login(page, "customer", "/services")
    const orderId = await ensurePendingOrder(page)
    if (!orderId) test.skip(true, "gagal buat pesanan uji (mungkin rate-limit)")

    // login sebagai provider untuk menguji kanban
    await login(page, "provider", "/dashboard/provider")
    await expect(page.getByRole("heading", { level: 2, name: /Pesanan Masuk/i })).toBeVisible()

    const card = page.locator("article").filter({ hasText: `Pesanan #${orderId}` })
    await expect(card).toBeVisible({ timeout: 20_000 })

    // kolom tujuan: label diambil dari statusShortLabel — "Dikerjakan" untuk IN_PROGRESS
    const targetColumn = page.locator("section", { hasText: "Dikerjakan" }).first()
    // fallback: cari droppable dengan id IN_PROGRESS (dnd-kit Droppable id = OrderStatus)
    const droppable = page.locator('[aria-label="Dikerjakan"]').first()
    const dropTarget = (await droppable.count()) > 0 ? droppable : targetColumn

    const handle = card.getByRole("button", { name: new RegExp(`Geser pesanan #${orderId}`) })
    // ada juga case grip tanpa order id? fallback ke ikon GripVertical
    const grip = (await handle.count()) > 0 ? handle : card.locator("button").filter({ has: page.locator("svg.lucide-grip-vertical") }).first()
    await expect(grip).toBeVisible({ timeout: 10_000 })

    // pastikan target terlihat sebelum drag
    await expect(dropTarget).toBeVisible({ timeout: 10_000 })

    // Lakukan drag manual via mouse — distance >6px untuk aktivasi PointerSensor
    const box = await grip.boundingBox()
    const targetBox = await dropTarget.boundingBox()
    if (!box || !targetBox) {
      test.skip(true, "boundingBox tidak tersedia (layout mobile?)")
      return
    }

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    // gerak kecil dulu untuk lewat threshold 6px
    await page.mouse.move(box.x + box.width / 2 + 12, box.y + box.height / 2, { steps: 6 })
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2 + 20, { steps: 12 })
    await page.mouse.up()

    // setelah drop, tombol harus berganti jadi "Tandai Selesai" (IN_PROGRESS)
    await expect(card.getByRole("button", { name: /Tandai Selesai/i })).toBeVisible({ timeout: 20_000 })

    // juga validasi via API: order status sekarang IN_PROGRESS
    const status = await page.evaluate(async (id: string) => {
      const r = await fetch(`/api/orders/${id}`)
      const j = await r.json().catch(() => null)
      return j?.status ?? null
    }, orderId!)
    expect(status).toBe("IN_PROGRESS")
  })

  test("invalid target (IN_PROGRESS → PENDING) → toast 'Transisi tidak diizinkan'", async ({ page }) => {
    await login(page, "provider", "/dashboard/provider")
    await expect(page.getByRole("heading", { level: 2, name: /Pesanan Masuk/i })).toBeVisible({ timeout: 15_000 })

    // ambil kartu pertama yang sudah IN_PROGRESS (kalau tidak ada, skip)
    const inProgressCard = page.locator("article").filter({ has: page.getByRole("button", { name: /Tandai Selesai/i }) }).first()
    if ((await inProgressCard.count()) === 0) {
      test.skip(true, "tidak ada kartu IN_PROGRESS untuk uji invalid drag")
      return
    }
    const idText = await inProgressCard.textContent()
    const match = idText?.match(/Pesanan #(\S+)/)
    const orderId = match?.[1] ?? ""
    const handle = inProgressCard.getByRole("button", { name: new RegExp(`Geser pesanan #${orderId}`) })
    const grip = (await handle.count()) > 0 ? handle : inProgressCard.locator("button").first()
    const pendingColumn = page.locator("section").filter({ hasText: /^Menunggu/ }).first()
    await expect(pendingColumn).toBeVisible()

    const box = await grip.boundingBox()
    const targetBox = await pendingColumn.boundingBox()
    if (!box || !targetBox) {
      test.skip(true, "boundingBox unavailable")
      return
    }

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + 12, box.y + 2, { steps: 4 })
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 40, { steps: 10 })
    await page.mouse.up()

    // toast error dari canTransition check
    await expect(page.getByText(/Transisi tidak diizinkan/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test.skip("keyboard fallback — tombolTerima membuka IN_PROGRESS (a11y) — manual, skip CI", async () => {
    // Kanban juga punya tombol "Terima & Kerjakan" untuk aksesibilitas.
    // Drag bukan satu-satunya jalur; test ini memverifikasi tombol tetap bekerja tanpa pointer.
  })
})
