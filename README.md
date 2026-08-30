# ServisLokal

Marketplace jasa lokal untuk pasar Indonesia — pertemukan pelanggan dengan penyedia jasa di sekitarnya: servis AC, kebersihan rumah, instalasi listrik, pengecatan, pindahan, dan tukang.

Dibangun dengan Next.js 15 App Router, React 19, Prisma, dan Tailwind CSS. Mencakup tiga peran (customer, provider, admin) dengan alur pesanan penuh dari pemesanan hingga ulasan.

```
Katalog  →  Checkout  →  Provider terima  →  Dikerjakan  →  Selesai  →  Ulasan
```

---

## Isi Dokumen

1. [Fitur](#fitur)
2. [Teknologi](#teknologi)
3. [Mulai Cepat](#mulai-cepat)
4. [Variabel Lingkungan](#variabel-lingkungan)
5. [Perintah npm](#perintah-npm)
6. [Struktur Proyek](#struktur-proyek)
7. [Model Data](#model-data)
8. [Rute Halaman](#rute-halaman)
9. [Rute API](#rute-api)
10. [Autentikasi & Otorisasi](#autentikasi--otorisasi)
11. [Rate Limiting](#rate-limiting)
12. [Sistem Desain](#sistem-desain)
13. [Pengujian](#pengujian)
14. [CI](#ci)
15. [Deployment](#deployment)
16. [Keputusan Teknis](#keputusan-teknis)
17. [Batasan yang Diketahui](#batasan-yang-diketahui)

---

## Fitur

### Untuk Pelanggan

- **Katalog dengan filter** — kategori, rentang harga, rating minimum, dan kota. Pencarian multi-kata mencocokkan judul, deskripsi, dan nama penyedia.
- **Detail jasa** — harga, estimasi pengerjaan, profil penyedia, ulasan asli, dan jasa serupa dari kategori yang sama.
- **Checkout** — catatan pesanan, pilihan metode pembayaran (simulasi), ringkasan harga.
- **Dashboard** — KPI ringkas, riwayat pesanan dengan status, dan daftar jasa yang disimpan.
- **Simpan jasa** — bookmark untuk dibandingkan nanti.
- **Ulasan** — rating 1–5 bintang plus komentar, hanya setelah pesanan selesai.
- **Pesan** — koordinasi jadwal dan alamat langsung dengan penyedia di halaman pesanan.

### Untuk Penyedia Jasa

- **Kanban pesanan** — tiga kolom (Menunggu → Dikerjakan → Selesai) dengan tombol kontekstual per kartu, tanpa perlu membuka halaman detail.
- **Kelola jasa** — buat jasa baru dengan pratinjau kartu langsung, tayangkan atau sembunyikan kapan saja.
- **Ringkasan pendapatan** — total dari pesanan yang selesai, jumlah pesanan menunggu tindakan, rating rata-rata.
- **Tabel riwayat** — tabel di desktop, kartu di mobile.

### Untuk Admin

- **Ringkasan platform** — KPI, grafik pesanan 14 hari, pendapatan per kategori, provider teratas.
- **Moderasi jasa** — tinjau jasa berstatus draf sebelum tayang ke publik.
- **Kelola pengguna** — cari akun, lihat statistik per pengguna.
- **Impersonasi** — masuk sebagai pengguna tertentu untuk melihat pengalaman mereka, dengan bar peringatan yang selalu tampak.
- **Ekspor CSV** — unduh data platform.

---

## Teknologi

| Lapisan | Pilihan |
|---|---|
| Framework | Next.js 15.1 (App Router, Server Components) |
| UI | React 19, Tailwind CSS 3.4, Radix UI primitives |
| Bahasa | TypeScript (strict) |
| Database | Prisma 5.20 + SQLite (dev), PostgreSQL (produksi) |
| Auth | NextAuth v5 beta — Credentials provider, sesi JWT |
| State server | TanStack Query v5 |
| Form | react-hook-form + Zod |
| Animasi | GSAP + ScrollTrigger |
| 3D | React Three Fiber (hero, lazy-loaded) |
| Grafik | Recharts (dynamic import) |
| Notifikasi | Sonner |
| Unit test | Vitest |
| E2E test | Playwright |

---

## Mulai Cepat

Prasyarat: Node.js 20+ dan npm.

```bash
git clone https://github.com/FerzDevZ/web-lomba.git
cd web-lomba
npm install
```

Buat berkas `.env` di root (lihat [Variabel Lingkungan](#variabel-lingkungan)):

```bash
DATABASE_URL="file:./dev.db"
AUTH_SECRET="ganti-dengan-hasil-openssl-rand-base64-32"
AUTH_TRUST_HOST=true
NEXTAUTH_URL="http://localhost:3000"
```

Siapkan database dan jalankan:

```bash
npx prisma generate
npm run db:migrate      # terapkan migrasi
npm run db:seed         # isi data contoh
npm run dev
```

Buka <http://localhost:3000>.

### Akun Contoh

Semua akun hasil seed memakai password `password123`.

| Peran | Email |
|---|---|
| Admin | `admin@servislokal.id` |
| Provider | `budi.santoso@email.com` |
| Customer | `dewi.lestari@email.com` |

Seed menghasilkan 30 pengguna (1 admin, 14 provider, 15 customer), 6 kategori, 30 jasa, 133 pesanan, dan 86 ulasan.

---

## Variabel Lingkungan

Berkas `.env` tidak di-commit — ia berisi rahasia. Buat sendiri berdasarkan tabel ini.

| Variabel | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | Ya | `file:./dev.db` untuk SQLite lokal, atau connection string PostgreSQL. |
| `AUTH_SECRET` | Ya | Kunci penandatangan JWT. Hasilkan dengan `openssl rand -base64 32`. |
| `AUTH_TRUST_HOST` | Ya | Setel `true`. NextAuth v5 beta menolak start tanpa ini. |
| `NEXTAUTH_URL` | Dev | URL callback OAuth. Di produksi, gunakan `NEXT_PUBLIC_SITE_URL`. |
| `NEXT_PUBLIC_SITE_URL` | Produksi | URL kanonik publik, dipakai metadata, Open Graph, JSON-LD, sitemap, dan robots.txt. |

**Penting:** Di Vercel, setel `NEXT_PUBLIC_SITE_URL` ke `https://weblomba-rouge.vercel.app` untuk produksi dan preview. Tanpa variabel ini, seluruh metadata (Open Graph, JSON-LD, sitemap, robots.txt) menunjuk `http://localhost:3000` dan crawler tidak bisa mengambil preview. Aplikasi mencetak peringatan ke log bila ini terjadi — akibatnya tidak terlihat di UI, jadi jangan mengandalkan tampilan untuk mendeteksinya. Variabel ini di-Vercel disetel sebagai sensitive di environment vars prod+preview, bukan di `.env` (karena `.env` gitignored).

---

## Perintah npm

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Dev server dengan hot reload. |
| `npm run build` | Build produksi. |
| `npm start` | Jalankan hasil build. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Unit test Vitest (sekali jalan). |
| `npm run test:watch` | Vitest mode watch. |
| `npm run test:e2e` | Playwright — build harus sudah ada. |
| `npm run test:e2e:ui` | Playwright dengan UI interaktif. |
| `npm run db:migrate` | `prisma migrate deploy`. |
| `npm run db:seed` | Isi database dengan data contoh. |
| `npm run db:backfill-city` | Turunkan `User.city` dari `User.location`. Idempoten; `--dry-run` untuk pratinjau. |

---

## Struktur Proyek

```
app/
├── (auth)/login, register       Halaman auth (route group, layout terpisah)
├── api/                         20 route handler
├── checkout/                    Alur pemesanan
├── dashboard/
│   ├── admin/                   Ringkasan, moderasi, pengguna
│   ├── customer/                Pesanan & jasa tersimpan
│   └── provider/                Kanban, kelola jasa
├── orders/[id]/                 Detail pesanan, timeline, pesan, ulasan
├── provider/[id]/               Profil penyedia publik
├── service/[slug]/              Detail jasa publik
├── services/                    Katalog dengan filter
├── faq/                         Pusat bantuan
├── layout.tsx                   Root layout, metadata, JSON-LD, footer
├── sitemap.ts, robots.ts        SEO
└── loading.tsx, error.tsx       Boundary per rute (semua rute punya)

components/
├── dashboard/                   Shell, skeleton, kartu statistik, grafik
├── landing/                     Hero, reveal, counter
├── layout/                      Navbar, footer bits, page shell, error panel
├── orders/                      Timeline, badge status, thread pesan, form ulasan
├── provider/                    Form buka jasa, daftar jasa, kanban
├── services/                    Kartu jasa, filter, tombol simpan, rating
├── three/                       Hero orb (WebGL)
└── ui/                          Primitives: button, card, input, dialog, dll.

lib/
├── api-guard.ts                 Pembungkus rate limit untuk route handler
├── auth.ts                      Konfigurasi NextAuth
├── location.ts                  Normalisasi alamat → nama kota
├── motion.ts                    Token durasi & easing animasi
├── order-status.ts              Mesin status pesanan (FSM)
├── prisma.ts                    Prisma client singleton
├── rate-limit.ts                Token bucket in-memory
└── site-url.ts                  Resolusi URL kanonik

prisma/
├── schema.prisma                Model data
├── migrations/                  Riwayat migrasi
├── postgresql/                  Panduan & script migrasi ke PostgreSQL
├── seed.js                      Data contoh
└── backfill-city.js             Backfill kolom city

tests/                           Unit test Vitest (7 berkas, 108 test)
e2e/                             Playwright (2 berkas, 16 test)
docs/                            PLANNING.md, PLANNING-UIUX.md
```

---

## Model Data

Tujuh model. `schema.prisma` adalah sumber kebenarannya.

```
User ──┬── Service (provider)
       ├── Order (customer)
       ├── Review
       ├── Message
       └── SavedService

Category ── Service

Service ──┬── Order
          └── SavedService

Order ──┬── Review
        └── Message
```

**User** — `role` bernilai `CUSTOMER`, `PROVIDER`, atau `ADMIN`. Dua kolom lokasi yang berbeda peran:

- `location` menyimpan alamat lengkap seperti yang ditulis penyedia (`"Jl. Braga No.45, Bandung"`) dan hanya untuk ditampilkan.
- `city` menyimpan nama kota yang sudah dinormalkan dan di-lowercase (`"bandung"`), dan inilah yang difilter.

Pemisahan ini bukan kerapian belaka. Filter katalog memakai `contains`, jadi mencocokkannya ke `location` membuat kueri `"Jl"` — atau bahkan satu huruf `"a"` — mengembalikan seluruh katalog. Nilai lowercase juga menghindari ketergantungan pada `mode: "insensitive"`, yang tidak didukung Prisma di SQLite dan akan membuat filter jadi case-sensitive begitu pindah ke PostgreSQL.

**Service** — `status` bernilai `ACTIVE`, `DRAFT`, atau `ARCHIVED`. Hanya `ACTIVE` yang tampil publik; `slug` unik dan dipakai di URL.

**Order** — `status` bernilai `PENDING`, `IN_PROGRESS`, `COMPLETED`, atau `CANCELLED`. Transisi dijaga FSM di `lib/order-status.ts`.

**Review** — satu ulasan per pesanan, hanya boleh dibuat pada status `COMPLETED`. Menulis ulasan memperbarui `ratingAvg` dan `totalReviews` pada jasa terkait.

---

## Rute Halaman

### Publik

| Rute | Isi |
|---|---|
| `/` | Landing: hero, kategori, jasa terbaru, statistik, CTA penyedia. |
| `/services` | Katalog dengan filter dan paginasi. |
| `/service/[slug]` | Detail jasa, ulasan, jasa serupa, JSON-LD. |
| `/provider/[id]` | Profil penyedia dan jasa yang ditawarkan. |
| `/faq` | Pusat bantuan dengan anchor per bagian. |
| `/login`, `/register` | Autentikasi. |

### Perlu Login

| Rute | Peran |
|---|---|
| `/dashboard` | Semua — mengalihkan sesuai peran. |
| `/dashboard/customer` | Customer |
| `/dashboard/provider` | Provider, Admin |
| `/dashboard/provider/buka-jasa` | Provider, Admin |
| `/dashboard/admin` | Admin |
| `/dashboard/admin/moderasi` | Admin |
| `/dashboard/admin/users` | Admin |
| `/checkout?service=<slug>` | Customer |
| `/orders/[id]` | Pihak yang terlibat saja |

Setiap rute punya `loading.tsx` dan `error.tsx` sendiri.

---

## Rute API

Semua route handler kecuali `[...nextauth]` dilindungi rate limit.

### Publik

| Metode | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/services` | Daftar jasa. Query: `search`, `slug`, `category`, `minPrice`, `maxPrice`, `rating`, `location`, `sort`, `page`. |
| `GET` | `/api/services/[id]` | Satu jasa. |
| `GET` | `/api/services/[id]/reviews` | Ulasan sebuah jasa. |
| `GET` | `/api/categories` | Semua kategori. |
| `GET` | `/api/search-suggestions` | Autocomplete pencarian. |
| `POST` | `/api/auth/register` | Buat akun. Menurunkan `city` dari `location`. |

### Perlu Login

| Metode | Endpoint | Fungsi |
|---|---|---|
| `GET`/`POST` | `/api/orders` | Daftar / buat pesanan. |
| `GET`/`PATCH` | `/api/orders/[id]` | Detail / ubah status (lewat FSM). |
| `GET`/`POST` | `/api/orders/[id]/messages` | Thread pesan. |
| `POST` | `/api/reviews` | Kirim ulasan. |
| `GET`/`POST`/`DELETE` | `/api/saved` | Jasa tersimpan. |
| `GET` | `/api/notifications` | Notifikasi pengguna. |
| `POST` | `/api/services` | Buat jasa (provider). |
| `PATCH` | `/api/services/[id]` | Ubah jasa / status tayang. |
| `GET` | `/api/provider/orders` | Pesanan masuk (kanban). |
| `GET` | `/api/provider/services` | Jasa milik sendiri. |

### Admin

| Metode | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/admin/stats` | KPI platform & jasa draf. |
| `GET` | `/api/admin/users` | Daftar pengguna. |
| `GET` | `/api/admin/export` | Ekspor CSV. |
| `POST` | `/api/admin/users/[id]/impersonate` | Mulai impersonasi. |
| `POST` | `/api/auth/unimpersonate` | Kembali ke akun admin. |

---

## Autentikasi & Otorisasi

NextAuth v5 dengan Credentials provider dan sesi JWT. Password di-hash bcrypt (10 round).

Otorisasi berlapis dua, dan keduanya diperlukan:

**`middleware.ts`** memakai daftar-putih. Apa pun di luar `PUBLIC_PATHS` dialihkan ke `/login`, termasuk rute yang tidak ada — jadi struktur rute internal tidak terekspos. Middleware juga menegakkan peran: `/dashboard/provider` hanya untuk provider dan admin, `/dashboard/admin` hanya untuk admin.

**Route handler** memeriksa ulang kepemilikan di level data. Middleware tidak tahu bahwa pesanan #42 milik pengguna tertentu; hanya handler yang bisa memastikannya. Contoh: hanya provider pemilik jasa yang boleh mengubah status pesanan, dan hanya customer pemesan yang boleh menulis ulasan.

### Impersonasi

Admin bisa masuk sebagai pengguna lain untuk mendiagnosis masalah. Sesi asli disimpan di dalam token, dan bar peringatan berwarna selalu tampil selama mode ini aktif. Tombol kembali memeriksa respons server sebelum mengalihkan — tanpa itu, kegagalan akan membuat admin mendarat di halaman pengguna sambil masih menyandang sesi orang lain tanpa tahu.

---

## Rate Limiting

Token bucket in-memory di `lib/rate-limit.ts`, dipasang lewat `lib/api-guard.ts`. Batasnya disesuaikan per jenis operasi:

| Operasi | Batas |
|---|---|
| Registrasi | 5 / jam |
| Buat pesanan | 10 / 10 menit |
| Ubah pesanan | 30 / 5 menit |
| Ulasan | 10 / jam |
| Pesan | 40 / menit |
| Baca (katalog, dll.) | 120 / menit |
| Ekspor admin | 5 / 5 menit |
| Impersonasi | 10 / jam |

Respons `429` menyertakan header `X-RateLimit-*` dan `Retry-After`.

Penyimpanan in-memory berarti batas ini berlaku per instance. Pada deployment serverless dengan banyak instance, gunakan penyimpanan bersama seperti Redis atau Upstash.

---

## Sistem Desain

Prinsip lengkapnya ada di `docs/PLANNING.md` dan `docs/PLANNING-UIUX.md`. Ringkasnya:

**Token warna semantik** di `app/globals.css` sebagai HSL, dipetakan ke Tailwind. Beberapa token punya varian `-strong` khusus untuk teks:

- `text-primary-strong` untuk teks oranye, bukan `text-primary`. Yang terakhir hanya 2.68:1 di light mode — gagal WCAG AA sebagai teks, dan hanya layak untuk isian solid berpasangan dengan `text-primary-foreground`.
- `text-destructive-strong` untuk teks merah, terutama di atas `bg-destructive/10`. Kombinasi dengan `text-destructive` hanya 4.11:1 di light dan 3.34:1 di dark.

`tests/color-contrast.test.ts` menghitung rasio kontras langsung dari `globals.css`, sehingga regresi token menggagalkan CI alih-alih diam-diam lolos ke produksi.

**Tipografi fluid** — skala `fontSize` di `tailwind.config.ts` memakai `clamp()`, jadi satu kelas mencakup mobile hingga desktop tanpa breakpoint manual. Menambahkan `md:text-4xl` di atas token yang sudah `clamp()` justru menimpanya dan mengembalikan dua ukuran diskrit.

**Aksesibilitas** — satu `h1` per halaman tanpa lompatan level, `CardTitle` merender heading sungguhan (default `h2`, dapat diubah lewat prop `as`), utility `.focus-ring` konsisten, `RadioCardGroup` dengan roving tabindex dan navigasi panah, serta dukungan `prefers-reduced-motion`. Struktur heading diverifikasi di E2E, bukan diasumsikan.

**Motion** — durasi dan easing terpusat di `lib/motion.ts`.

---

## Pengujian

### Unit — Vitest

```bash
npm test
```

7 berkas, 108 test. Fokus pada logika murni:

| Berkas | Cakupan |
|---|---|
| `color-contrast.test.ts` | Rasio kontras semua pasangan token, light & dark. |
| `order-status.test.ts` | FSM transisi status pesanan. |
| `rate-limit.test.ts` | Token bucket, jendela waktu, header. |
| `location.test.ts` | Parsing alamat → kota, hitung kota unik. |
| `rating.test.ts` | Agregasi rating. |
| `csv-escape.test.ts` | Escaping ekspor CSV. |
| `utils.test.ts` | Format mata uang dan helper. |

### E2E — Playwright

```bash
npm run build
npm run test:e2e
```

16 test terhadap build produksi, bukan dev server — perilaku caching dan streaming keduanya berbeda, sehingga bug khas produksi bisa lolos kalau diuji lewat dev.

`e2e/order-lifecycle.spec.ts` menjalankan siklus penuh: ambil jasa aktif milik provider uji, customer memesan, pesanan tampil sebagai PENDING, customer terbukti tidak bisa memajukan status sendiri, provider menerima dari kanban, provider menandai selesai, customer memberi ulasan.

`e2e/public-pages.spec.ts` memeriksa hal yang tidak bisa dibuktikan unit test: hero merender data dari database, struktur heading tanpa lompatan level, rute terproteksi mengalihkan, dan filter kota tidak lagi cocok pada penggal alamat.

E2E menambah data nyata (pesanan dan ulasan) setiap kali dijalankan. Jalankan `npm run db:seed` bila ingin keadaan bersih.

---

## CI

`.github/workflows/ci.yml` berjalan pada setiap push ke `main` dan setiap pull request, dengan dua job:

**`verify`** — `npm ci`, generate Prisma, migrasi, seed, typecheck, unit test, build, lalu smoke test HTTP terhadap server produksi. Langkah terakhir ini penting: build yang berhasil belum membuktikan halaman benar-benar bisa dirender. Kesalahan yang hanya muncul saat render — misalnya kueri Prisma di server component — hanya tertangkap dengan benar-benar meminta halamannya.

**`e2e`** — build lalu jalankan Playwright. Browser di-cache berdasarkan hash `package-lock.json`; tanpa itu setiap run menghabiskan menit hanya untuk mengunduh ulang ~130 MB. Trace dan laporan diunggah sebagai artifact bila ada kegagalan.

---

## Deployment

### Vercel + PostgreSQL

1. Siapkan PostgreSQL (Neon, Supabase, atau Vercel Postgres).
2. Ubah `datasource` di `prisma/schema.prisma` dari `sqlite` ke `postgresql`.
3. Setel environment variables di Vercel:
   - `DATABASE_URL` — connection string PostgreSQL
   - `AUTH_SECRET` — hasil `openssl rand -base64 32`
   - `AUTH_TRUST_HOST` — `true`
   - `NEXT_PUBLIC_SITE_URL` — domain produksi, misalnya `https://servislokal.id`
4. Jalankan migrasi: `npx prisma migrate deploy`.
5. Backfill kolom kota bila memigrasikan data lama: `npm run db:backfill-city`.

Gunakan `NEXT_PUBLIC_SITE_URL`, bukan `VERCEL_URL`. Nilai `VERCEL_URL` berubah setiap deployment preview, sehingga URL kanonik dan tag Open Graph ikut berubah-ubah.

### Migrasi SQLite → PostgreSQL

`prisma/postgresql/` berisi perangkat lengkapnya:

| Berkas | Fungsi |
|---|---|
| `MIGRASI_POSTGRESQL.md` | Panduan langkah demi langkah, pemetaan tipe data, troubleshooting. |
| `schema.sql` | Schema PostgreSQL (TEXT-based). |
| `schema_enums.sql` | Alternatif dengan ENUM dan trigger `updatedAt`. |
| `migrate_data.js` / `.py` | Script migrasi data, mendukung `--dry-run`. |
| `verify.sql` | Kueri verifikasi integritas pasca-migrasi. |
| `rollback.sql` | Kembalikan keadaan. |

---

## Keputusan Teknis

**Next.js 15, bukan 16.** Binary SWC Next.js 16 crash (SIGBUS) pada CPU Intel Skylake generasi ke-6, yang dipakai untuk pengembangan proyek ini.

**Prisma 5 dengan `new PrismaClient()` biasa.** Prisma 7 mewajibkan driver adapter untuk SQLite, yang menambah dua dependensi native tanpa manfaat untuk proyek ini.

**`city` sebagai kolom sendiri, bukan dihitung saat membaca.** Menormalkan alamat pada setiap request berarti menghitung ulang untuk ribuan baris hanya untuk memfilter. Kolom terpisah bisa diindeks (`@@index([role, city])`); nilai turunan diisi saat penulisan di API register dan seed.

**Aturan parsing lokasi tersalin di tiga tempat.** `lib/location.ts`, `prisma/backfill-city.js`, dan `prisma/seed.js` memuat logika yang sama karena dua yang terakhir berjalan sebagai Node polos tanpa build step dan tidak bisa mengimpor TypeScript. `tests/location.test.ts` adalah kontrak yang menjaga ketiganya sinkron — kalau aturannya berubah, ubah di tiga tempat itu sekaligus.

**Hero WebGL lazy-loaded.** Bundle three.js sekitar 227 KB gzip, tapi tidak ada di manifest awal — dimuat lewat `next/dynamic` setelah halaman interaktif, sehingga tidak menyentuh Core Web Vitals. Cincin konsentris CSS memberi bentuk pada area itu bahkan sebelum WebGL memuat atau kalau perangkat tidak mendukungnya.

**Ekstraksi komponen dipicu bug, bukan estetika.** Halaman `buka-jasa` dipecah dari 464 baris ke 81 karena saat memisahkannya ditemukan bahwa `toggleStatus` mengabaikan `res.ok` sepenuhnya — kegagalan server tampak seperti sukses. Kanban provider diekstrak karena komponen aslinya tidak pernah diimpor oleh siapa pun sehingga fiturnya tidak pernah tampil.

---

## Batasan yang Diketahui

**Status 404 untuk slug jasa yang tidak ada sebenarnya 200.** `<Navbar />` adalah async server component di root layout, jadi Next.js sudah mulai men-stream respons sebelum `notFound()` dievaluasi — status HTTP terkunci sebelum kode itu berjalan. UI not-found tampil dengan benar, dan halamannya diberi `robots: noindex` supaya crawler tidak mengindeks soft 404. Memperbaiki status sungguhan memerlukan perombakan cara layout memuat sesi.

**Rate limit per instance.** Penyimpanan in-memory tidak dibagi antar instance serverless. Perlu Redis atau Upstash untuk produksi berskala.

**Pembayaran masih simulasi.** Pilihan metode pembayaran tersimpan di pesanan, tapi tidak ada integrasi payment gateway.

**Notifikasi memakai polling.** Notification bell melakukan polling 60s dan thread pesan polling 15s (polling 15s (messages) / 60s (notifications)), belum WebSocket.

**Filter kota memakai `contains`, bukan kecocokan tepat.** Artinya `"jakarta"` juga mencocokkan `"jakarta selatan"`. Ini disengaja agar pencarian sebagian tetap berguna, tapi bukan pencocokan wilayah administratif yang presisi.

**E2E mengubah data.** Setiap kali dijalankan, siklus pesanan menambah pesanan dan ulasan baru ke database.

---

## Lisensi

Belum ditentukan.
