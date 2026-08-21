// Seed data realistis untuk pengembangan
// Jalankan: node prisma/seed.js
const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1_000)
}

const STREET_PREFIX = /^(jl\.?|jalan|gg\.?|gang|no\.?|rt|rw|blok)\b/i

/**
 * Ambil nama kota dari alamat lengkap — mencerminkan lib/location.ts.
 *
 * Seed WAJIB mengisi `city`, bukan hanya `location`: filter katalog
 * mencocokkan `provider.city`, jadi database hasil seed tanpa kolom ini
 * membuat filter lokasi tidak menemukan apa pun.
 */
function cityFromLocation(location) {
  if (!location) return null
  const segments = location
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (segments.length === 0) return null
  const city = segments[segments.length - 1]
  if (STREET_PREFIX.test(city)) return null
  return city.toLowerCase()
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10)

  // ============ USERS ============
  const userData = [
    // Admin
    ["admin@servislokal.id", "Admin ServisLokal", "ADMIN", null],
    // Providers
    ["budi.santoso@email.com", "Budi Santoso", "PROVIDER", "Jl. Melati No.12, Jakarta Selatan"],
    ["siti.rahayu@email.com", "Siti Rahayu", "PROVIDER", "Jl. Braga No.45, Bandung"],
    ["agus.pratama@email.com", "Agus Pratama", "PROVIDER", "Jl. Basuki Rahmat No.8, Surabaya"],
    ["rina.marlina@email.com", "Rina Marlina", "PROVIDER", "Jl. Sudirman No.22, Medan"],
    ["yoga.permana@email.com", "Yoga Permana", "PROVIDER", "Jl. Prawirotaman No.17, Yogyakarta"],
    ["dewi.anggraini@email.com", "Dewi Anggraini", "PROVIDER", "Jl. Pettarani No.11, Makassar"],
    ["joko.wibowo@email.com", "Joko Widodo", "PROVIDER", "Jl. Tebet Raya No.5, Jakarta Selatan"],
    // Customers
    ["dewi.lestari@email.com", "Dewi Lestari", "CUSTOMER", "Jl. Kebayoran Baru, Jakarta"],
    ["ahmad.fauzi@email.com", "Ahmad Fauzi", "CUSTOMER", "Jl. Dago No.33, Bandung"],
    ["putri.ayu@email.com", "Putri Ayu", "CUSTOMER", "Jl. Rungkut No.19, Surabaya"],
    ["bambang.wijaya@email.com", "Bambang Wijaya", "CUSTOMER", "Jl. Setiabudi No.7, Medan"],
    ["sari.indah@email.com", "Sari Indah", "CUSTOMER", "Jl. Kaliurang No.14, Yogyakarta"],
    ["maya.sari@email.com", "Maya Sari", "CUSTOMER", "Jl. Tamalate No.6, Makassar"],
    ["doni.kurniawan@email.com", "Doni Kurniawan", "CUSTOMER", "Jl. Kelapa Gading, Jakarta Utara"],
    ["ani.wulandari@email.com", "Ani Wulandari", "CUSTOMER", "Jl. Suryo No.28, Sidoarjo"],
  ]

  const users = {}
  for (const [email, name, role, location] of userData) {
    const city = cityFromLocation(location)
    users[email] = await prisma.user.upsert({
      where: { email },
      // `city` disertakan di update agar database lama yang di-seed ulang ikut
      // terisi, bukan hanya baris yang baru dibuat.
      update: { city },
      create: {
        name,
        email,
        passwordHash,
        role,
        location,
        city,
        bio:
          role === "PROVIDER"
            ? `${name} — penyedia jasa profesional yang mengutamakan ketepatan waktu dan kualitas hasil. Melayani area ${location?.split(", ").pop() ?? "sekitar"}.`
            : null,
      },
    })
  }

  // ============ CATEGORIES ============
  const catData = [
    ["Perbaikan Rumah", "perbaikan-rumah", "Wrench", "Perbaikan AC, pipa, dan peralatan rumah tangga."],
    ["Kebersihan", "kebersihan", "Sparkles", "Jasa bersih-bersih rumah, kantor, dan pasca renovasi."],
    ["Listrik", "listrik", "Zap", "Instalasi dan perbaikan instalasi listrik."],
    ["Pengecatan", "pengecatan", "Paintbrush", "Cat tembok interior dan eksterior."],
    ["Pindahan", "pindahan", "Truck", "Jasa pindah rumah dan kantor."],
    ["Tukang", "tukang", "Home", "Tukang bangunan dan renovasi."],
  ]
  const categories = {}
  for (const [name, slug, icon, description] of catData) {
    categories[slug] = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, icon, description },
    })
  }

  // ============ CLEAN OLD DATA ============
  await prisma.review.deleteMany()
  await prisma.order.deleteMany()
  await prisma.service.deleteMany()

  // ============ SERVICES ============
  const serviceData = [
    // Perbaikan Rumah (budi, jakarta selatan)
    ["instalasi-ac-split-1-pk", "perbaikan-rumah", "budi.santoso@email.com", "Instalasi AC split 1 PK baru: bracket, pipa, vacuum, dan pengecekan tekanan freon. Garansi 1 bulan untuk kerjaan.", 350000, 1],
    ["servis-ac-bocor-tidak-dingin", "perbaikan-rumah", "budi.santoso@email.com", "Pengecekan menyeluruh, cuci evaporator dan kondensor, tambah freon R410A, perbaikan kebocoran. Dijamin dingin kembali atau uang kembali.", 150000, 1],
    ["perbaikan-mesin-cuci-1-2-tabung", "perbaikan-rumah", "budi.santoso@email.com", "Perbaikan mesin cuci 1 dan 2 tabung: tidak berputar, bocor, atau bunyi kasar. Termasuk penggantian sparepart standar.", 175000, 2],
    ["pembersihan-kulkas-steam", "perbaikan-rumah", "yoga.permana@email.com", "Pembersihan mendalam kulkas dengan steam, pengecekan kompresor, penggantian seal pintu bila perlu. Kulkas jadi lebih awet dan tidak bau.", 120000, 1],
    ["perbaikan-water-heater", "perbaikan-rumah", "budi.santoso@email.com", "Perbaikan water heater: tidak panas, bocor, atau error. Termasuk pengecekan elemen pemanas dan anoda.", 200000, 1],
    // Kebersihan (siti, bandung)
    ["bersih-rumah-reguler-per-m2", "kebersihan", "siti.rahayu@email.com", "Pembersihan menyeluruh: menyapu, mengepel, kamar mandi, dapur, dan kaca. Alat dan cairan pembersih disediakan vendor.", 50000, 1],
    ["deep-clean-pasca-renovasi", "kebersihan", "siti.rahayu@email.com", "Pembersihan mendalam pasca renovasi: debu semen, cat, dan keramic. Tim 2 orang dengan peralatan profesional.", 75000, 2],
    ["bersih-sofa-karpet-steam", "kebersihan", "siti.rahayu@email.com", "Cuci sofa dan karpet metode steam: hilangkan noda, debu, dan bau tidak sedap. Per kursi atau per meter persegi.", 90000, 1],
    ["jasa-bersih-kos-kontrakan", "kebersihan", "siti.rahayu@email.com", "Paket kebersihan bulanan: 2x seminggu, termasuk cuci sprei dan mengepel lantai. Minimal kontrak 1 bulan.", 3500000, 1],
    ["pembersihan-ducting-ac", "kebersihan", "siti.rahayu@email.com", "Pembersihan saluran AC ducting untuk rumah dan kantor. Membantu udara lebih bersih dan AC lebih efisien.", 450000, 1],
    // Listrik (agus, surabaya)
    ["instalasi-listrik-rumah-baru", "listrik", "agus.pratama@email.com", "Pemasangan instalasi listrik standar SNI: titik lampu, stop kontak, dan panel MCB. Termasuk gambar jalur dan konsultasi penempatan.", 25000000, 5],
    ["perbaikan-listrik-konslet", "listrik", "agus.pratama@email.com", "Pencarian gangguan listrik, perbaikan korsleting, dan penggantian komponen rusak. Ditarget selesai hari yang sama.", 200000, 1],
    ["pasang-lampu-saklar-titik", "listrik", "agus.pratama@email.com", "Pemasangan titik lampu, saklar, dan stop kontak baru. Material bisa disediakan atau dibawa sendiri oleh klien.", 100000, 1],
    ["perawatan-panel-mcb", "listrik", "yoga.permana@email.com", "Pengecekan panel listrik, pengencangan terminal, dan penggantian MCB yang sudah jelek. Penting untuk keamanan.", 150000, 1],
    ["pemasangan-lampu-led-downlight", "listrik", "agus.pratama@email.com", "Pasang downlight LED recessed 5-12 watt. Termasuk lubang dan wiring. Per titik.", 85000, 1],
    // Pengecatan (rina, medan)
    ["cat-tembok-interior-per-m2", "pengecatan", "rina.marlina@email.com", "Pengecatan tembok interior 2 lapis dengan cat dinding premium (Dulux/Nippon). Termasuk plamir dan finishing rapi.", 25000, 3],
    ["cat-tembok-eksterior-per-m2", "pengecatan", "rina.marlina@email.com", "Pengecatan eksterior tahan cuaca 2 lapis. Termasuk persiapan permukaan, primer, dan pembersihan area kerja.", 30000, 4],
    ["cat-ulangan-kusen-pagar-besi", "pengecatan", "rina.marlina@email.com", "Pengamplasan, pelapisan anti karat, dan cat finishing untuk kusen dan pagar besi. Hasil halus dan tahan lama.", 45000, 2],
    ["wallpaper-pasang-per-m2", "pengecatan", "rina.marlina@email.com", "Pemasangan wallpaper dinding motif minimalis. Termasuk lem dan finishing tepi. Min. 5 m2.", 85000, 2],
    // Pindahan (dewi, makassar)
    ["pindah-rumah-1-2-kamar", "pindahan", "dewi.anggraini@email.com", "Pindah rumah skala kecil: packing, angkut, bongkar, dan susun ulang. Termasuk truk dan 2 tenaga kerja.", 900000, 1],
    ["pindah-kantor-gudang", "pindahan", "dewi.anggraini@email.com", "Pindah kantor lengkap dengan packing khusus meja, komputer, dan arsip. Tim 4 orang profesional.", 2500000, 2],
    ["jasa-packing-saja", "pindahan", "dewi.anggraini@email.com", "Packing barang dengan bubble wrap dan kardus berkualitas. Siap angkut. Per jam atau per barang.", 75000, 1],
    ["penyimpanan-barang-kos", "pindahan", "dewi.anggraini@email.com", "Penyimpanan barang sementara di gudang aman. Per bulan per meter kubik. Termasuk asuransi.", 150000, 1],
    // Tukang (yoga, yogyakarta)
    ["renovasi-kamar-mandi", "tukang", "yoga.permana@email.com", "Renovasi kamar mandi: keramik baru, closet, kran, dan sanitair. Termasuk pembongkaran yang lama.", 35000000, 7],
    ["pasang-keramik-lantai-per-m2", "tukang", "yoga.permana@email.com", "Pemasangan keramik lantai dengan nat rapi. Termasuk persiapan acian dasar dan pengeringan.", 60000, 3],
    ["perbaikan-atap-bocor", "tukang", "yoga.permana@email.com", "Lokalisir kebocoran, ganti genteng atau nok yang rusak, dan aplikasi waterproofing. Garansi 6 bulan.", 300000, 1],
    ["plafon-gypsum-baru-per-m2", "tukang", "budi.santoso@email.com", "Pemasangan plafon gypsum rangka hollow galvanis. Termasuk finishing nat dan dempul halus. Rapih dan kuat.", 85000, 4],
    ["pemasangan-dinding-batako", "tukang", "yoga.permana@email.com", "Pemasangan dinding batako untuk perluasan atau pembatas ruangan. Termasuk adukan dan plesteran dasar.", 55000, 3],
    // DRAFT & ARCHIVED samples
    ["jasa-bangun-pagar-tembok", "tukang", "budi.santoso@email.com", "Pembangunan pagar tembok dengan pondasi dan finishing cat. Min. 3 meter lari. Free konsultasi desain.", 65000, 7],
    ["cuci-ac-rutin-paket-4-unit", "perbaikan-rumah", "budi.santoso@email.com", "Paket cuci 4 unit AC hemat: cuci indoor dan outdoor, cek freon, dan pembersihan filter.预约 lebih dulu.", 450000, 2],
  ]

  const services = []
  for (const [slug, catSlug, email, description, price, days] of serviceData) {
    const service = await prisma.service.create({
      data: {
        title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        slug: `${slug}-${Math.floor(Math.random() * 100000)}`,
        description,
        price,
        deliveryTimeDays: days,
        categoryId: categories[catSlug].id,
        providerId: users[email].id,
        status: slug === "jasa-bangun-pagar-tembok" ? "ARCHIVED" : slug === "cuci-ac-rutin-paket-4-unit" ? "DRAFT" : "ACTIVE",
        createdAt: daysAgo(Math.floor(Math.random() * 60) + 5),
      },
    })
    services.push(service)
  }

  // ============ ORDERS + REVIEWS ============
  const customers = [
    users["ahmad.fauzi@email.com"],
    users["putri.ayu@email.com"],
    users["bambang.wijaya@email.com"],
    users["sari.indah@email.com"],
    users["doni.kurniawan@email.com"],
    users["maya.sari@email.com"],
    users["dewi.lestari@email.com"],
    users["ani.wulandari@email.com"],
  ]

  const REVIEW_COMMENTS = [
    "Hasilnya rapi dan sesuai janji. Sangat direkomendasikan untuk yang butuh tukang cepat dan teliti.",
    "Cepat, bersih, dan harganya wajar. Pasti pakai lagi untuk service berkala.",
    "Komunikasi dari awal sampai selesai sangat jelas. Datang tepat waktu seperti yang dijanjikan.",
    "Datang tepat waktu, kerja profesional, hasil memuaskan. Kamar mandi baru kinclong!",
    "Sudah langganan dua kali, kualitasnya konsisten. Harga juga tidak kemahalan.",
    "Penjelasan detail sebelum kerja dimulai, tidak ada biaya tersembunyi. Profesional.",
    "Hasil melebihi ekspektasi, harganya juga masuk akal. AC sekarang adem banget.",
    "Tukangnya ramah dan sabar menjawab pertanyaan saya. Sangat puas dengan hasilnya.",
    "Pengecatan rumah selesai lebih cepat dari estimasi. Hasil cat rapi dan tidak ada cipratan di lantai.",
    "Proses pindah rumah lancar, barang aman sampai tujuan. Timnya kooperatif banget.",
    "Servis AC sekarang dingin kembali seperti baru. Charges wajar, tidak overpriced.",
    "Bersih banget, bahkan bagian yang saya tidak minta dibersihkan juga dirapikan.",
    "Sudah tiga kali pakai untuk perawatan AC. Konsisten baik pelayanannya.",
    "Respon cepat dari chat sampai datang. Masalah listrik di rumah solved dalam 2 jam.",
  ]

  for (const service of services) {
    const orderCount = service.status === "ACTIVE" ? 2 + Math.floor(Math.random() * 6) : 0
    let reviewCount = 0

    for (let i = 0; i < orderCount; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)]
      const isCompleted = Math.random() > 0.25
      const createdDaysAgo = Math.floor(Math.random() * 60) + 2

      const orderNotes = [
        "Mohon konfirmasi jadwal sebelum datang, terima kasih.",
        "Rumah kosong, bisa datang kapan saja.",
        "Tolong bawa alat lengkap ya, terima kasih.",
        "Saya ada di lokasi, hubungi dulu sebelum datang.",
        null,
        null,
      ][Math.floor(Math.random() * 6)]

      const order = await prisma.order.create({
        data: {
          customerId: customer.id,
          serviceId: service.id,
          totalPrice: service.price,
          status: isCompleted ? "COMPLETED" : Math.random() > 0.5 ? "PENDING" : "IN_PROGRESS",
          paymentMethod: ["transfer", "ewallet", "cod"][Math.floor(Math.random() * 3)],
          orderNotes,
          createdAt: daysAgo(createdDaysAgo),
          completedAt: isCompleted ? daysAgo(Math.floor(Math.random() * 30)) : null,
        },
      })

      if (isCompleted && Math.random() > 0.15) {
        reviewCount++
        const rating = Math.random() > 0.35 ? 5 : 4
        await prisma.review.create({
          data: {
            orderId: order.id,
            reviewerId: customer.id,
            rating,
            comment: REVIEW_COMMENTS[Math.floor(Math.random() * REVIEW_COMMENTS.length)],
            createdAt: new Date(order.completedAt.getTime() + 86400000),
          },
        })
      }
    }

    // Sinkronkan ratingAvg & totalReviews
    if (service.status === "ACTIVE") {
      const reviews = await prisma.review.findMany({
        where: { order: { serviceId: service.id } },
        select: { rating: true },
      })
      if (reviews.length > 0) {
        const ratingAvg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        await prisma.service.update({
          where: { id: service.id },
          data: { totalReviews: reviews.length, ratingAvg },
        })
      }
    }
  }

  console.log("Seed selesai!")
  console.log(`  ${services.length} jasa (${services.filter((s) => s.status === "ACTIVE").length} aktif)`)
  console.log("Akun demo (password: password123):")
  console.log("  admin@servislokal.id (ADMIN)")
  for (const email of userData.slice(1, 9).map((u) => u[0])) {
    console.log(`  ${email}`)
  }
  console.log("  + 8 akun customer")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())