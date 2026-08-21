import { defineConfig, devices } from "@playwright/test"

/**
 * Konfigurasi E2E.
 *
 * Menjalankan build produksi (`npm run start`), bukan `next dev`: dev server
 * punya perilaku berbeda soal caching, streaming, dan error overlay, sehingga
 * bug yang hanya muncul di produksi bisa lolos kalau diuji lewat dev.
 */
const PORT = Number(process.env.E2E_PORT ?? 3130)
const BASE_URL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: "./e2e",
  // Alur pesanan mengubah data bersama (status order, review). Menjalankannya
  // paralel membuat test saling menimpa, jadi dijalankan berurutan.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "id-ID",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      AUTH_TRUST_HOST: "true",
      NEXTAUTH_URL: BASE_URL,
    },
  },
})
