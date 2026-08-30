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
  const city = segments[segments.length - 1].trim()
  if (STREET_PREFIX.test(city)) return null
  return city.trim().toLowerCase()
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10)

  // ============ USERS ============
  // avatarUrl memakai pravatar (foto manusia nyata, cache CDN) — setiap email
  // mendapat img deterministik agar reseed tidak ganti wajah acak.
  const userData = [
    // email, name, role, location, avatarUrl
    // Admin
    ["admin@servislokal.id", "Admin ServisLokal", "ADMIN", null, "https://i.pravatar.cc/300?img=1"],
    // Providers — cakupan nasional 38 provinsi
    ["budi.santoso@email.com", "Budi Santoso", "PROVIDER", "Jl. Melati No.12, Jakarta Selatan", "https://i.pravatar.cc/300?img=12"],
    ["siti.rahayu@email.com", "Siti Rahayu", "PROVIDER", "Jl. Braga No.45, Bandung", "https://i.pravatar.cc/300?img=5"],
    ["agus.pratama@email.com", "Agus Pratama", "PROVIDER", "Jl. Basuki Rahmat No.8, Surabaya", "https://i.pravatar.cc/300?img=15"],
    ["rina.marlina@email.com", "Rina Marlina", "PROVIDER", "Jl. Sudirman No.22, Medan", "https://i.pravatar.cc/300?img=9"],
    ["yoga.permana@email.com", "Yoga Permana", "PROVIDER", "Jl. Prawirotaman No.17, Yogyakarta", "https://i.pravatar.cc/300?img=18"],
    ["dewi.anggraini@email.com", "Dewi Anggraini", "PROVIDER", "Jl. Pettarani No.11, Makassar", "https://i.pravatar.cc/300?img=32"],
    ["joko.wibowo@email.com", "Joko Widodo", "PROVIDER", "Jl. Tebet Raya No.5, Jakarta Selatan", "https://i.pravatar.cc/300?img=14"],
    // Kepulauan & Sumatera
    ["hendri.bangka@email.com", "Hendri Bangka", "PROVIDER", "Jl. Jendral Sudirman No.10, Pangkal Pinang, Kepulauan Bangka Belitung", "https://i.pravatar.cc/300?img=20"],
    ["lina.natuna@email.com", "Lina Natuna", "PROVIDER", "Jl. Hang Tuah No.8, Tanjung Pinang, Kepulauan Riau", "https://i.pravatar.cc/300?img=29"],
    ["eko.bengkulu@email.com", "Eko Bengkulu", "PROVIDER", "Jl. Merdeka No.15, Bengkulu", "https://i.pravatar.cc/300?img=11"],
    ["jambi.teknik@email.com", "Jambi Teknik", "PROVIDER", "Jl. Sultan Thaha No.20, Jambi", "https://i.pravatar.cc/300?img=16"],
    ["lampung.jaya@email.com", "Lampung Jaya Servis", "PROVIDER", "Jl. Teuku Umar No.22, Bandar Lampung", "https://i.pravatar.cc/300?img=25"],
    // Jawa & Banten
    ["banten.maju@email.com", "Banten Maju", "PROVIDER", "Jl. Raya Serang No.5, Serang, Banten", "https://i.pravatar.cc/300?img=13"],
    // Kalimantan
    ["ponti.servis@email.com", "Ponti Servis", "PROVIDER", "Jl. Gajah Mada No.3, Pontianak, Kalimantan Barat", "https://i.pravatar.cc/300?img=17"],
    ["balikpapan.pro@email.com", "Balikpapan Pro", "PROVIDER", "Jl. Sudirman No.88, Balikpapan, Kalimantan Timur", "https://i.pravatar.cc/300?img=19"],
    // Bali Nusra
    ["bali.prime@email.com", "Bali Prime", "PROVIDER", "Jl. Teuku Umar No.45, Denpasar, Bali", "https://i.pravatar.cc/300?img=21"],
    ["lombok.jaya@email.com", "Lombok Jaya", "PROVIDER", "Jl. Pejanggik No.12, Mataram, Nusa Tenggara Barat", "https://i.pravatar.cc/300?img=24"],
    ["kupang.solid@email.com", "Kupang Solid", "PROVIDER", "Jl. El Tari No.30, Kupang, Nusa Tenggara Timur", "https://i.pravatar.cc/300?img=27"],
    // Sulawesi & Timur
    ["manado.ahli@email.com", "Manado Ahli", "PROVIDER", "Jl. Sam Ratulangi No.18, Manado, Sulawesi Utara", "https://i.pravatar.cc/300?img=28"],
    ["palu.teknik@email.com", "Palu Teknik", "PROVIDER", "Jl. Dewi Sartika No.9, Palu, Sulawesi Tengah", "https://i.pravatar.cc/300?img=30"],
    ["ambon.servis@email.com", "Ambon Servis", "PROVIDER", "Jl. Pattimura No.14, Ambon, Maluku", "https://i.pravatar.cc/300?img=34"],
    ["jayapura.tangguh@email.com", "Jayapura Tangguh", "PROVIDER", "Jl. Ahmad Yani No.7, Jayapura, Papua", "https://i.pravatar.cc/300?img=35"],
    // Customers
    ["dewi.lestari@email.com", "Dewi Lestari", "CUSTOMER", "Jl. Kebayoran Baru, Jakarta", "https://i.pravatar.cc/300?img=33"],
    ["ahmad.fauzi@email.com", "Ahmad Fauzi", "CUSTOMER", "Jl. Dago No.33, Bandung", "https://i.pravatar.cc/300?img=68"],
    ["putri.ayu@email.com", "Putri Ayu", "CUSTOMER", "Jl. Rungkut No.19, Surabaya", "https://i.pravatar.cc/300?img=26"],
    ["bambang.wijaya@email.com", "Bambang Wijaya", "CUSTOMER", "Jl. Setiabudi No.7, Medan", "https://i.pravatar.cc/300?img=22"],
    ["sari.indah@email.com", "Sari Indah", "CUSTOMER", "Jl. Kaliurang No.14, Yogyakarta", "https://i.pravatar.cc/300?img=31"],
    ["maya.sari@email.com", "Maya Sari", "CUSTOMER", "Jl. Tamalate No.6, Makassar", "https://i.pravatar.cc/300?img=45"],
    ["doni.kurniawan@email.com", "Doni Kurniawan", "CUSTOMER", "Jl. Kelapa Gading, Jakarta Utara", "https://i.pravatar.cc/300?img=48"],
    ["ani.wulandari@email.com", "Ani Wulandari", "CUSTOMER", "Jl. Suryo No.28, Sidoarjo", "https://i.pravatar.cc/300?img=65"],
    ["citra.bangka@email.com", "Citra Bangka", "CUSTOMER", "Jl. Depati Amir No.12, Pangkal Pinang, Kepulauan Bangka Belitung", "https://i.pravatar.cc/300?img=36"],
    ["rio.lampung@email.com", "Rio Lampung", "CUSTOMER", "Jl. Kartini No.9, Bandar Lampung", "https://i.pravatar.cc/300?img=37"],
    ["sinta.bali@email.com", "Sinta Bali", "CUSTOMER", "Jl. Sunset Road No.88, Denpasar, Bali", "https://i.pravatar.cc/300?img=38"],
    ["yusuf.papua@email.com", "Yusuf Papua", "CUSTOMER", "Jl. Yos Sudarso No.5, Jayapura, Papua", "https://i.pravatar.cc/300?img=39"],
  ]

  const users = {}
  for (const [email, name, role, location, avatarUrl] of userData) {
    const city = cityFromLocation(location)
    users[email] = await prisma.user.upsert({
      where: { email },
      // `city` & `avatarUrl` disertakan di update agar reseed mengisi database
      // lama yang sebelumnya null, bukan hanya baris yang baru dibuat.
      update: { city, avatarUrl },
      create: {
        name,
        email,
        passwordHash,
        role,
        location,
        city,
        avatarUrl,
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
  // Foto dari Unsplash (lisensi bebas). URL memakai parameter crop agar
  // rasio seragam untuk kartu katalog maupun galeri detail.
  const img = (id) =>
    `https://images.unsplash.com/${id}?q=80&w=1200&auto=format&fit=crop`

  const serviceData = [
    // slug, kategori, provider email, deskripsi, harga, hari, foto
    // Perbaikan Rumah (budi, jakarta selatan)
    ["instalasi-ac-split-1-pk", "perbaikan-rumah", "budi.santoso@email.com", "Instalasi AC split 1 PK baru: bracket, pipa, vacuum, dan pengecekan tekanan freon. Garansi 1 bulan untuk kerjaan.", 350000, 1, img("photo-1753826477307-82c71f3d9537")],
    ["servis-ac-bocor-tidak-dingin", "perbaikan-rumah", "budi.santoso@email.com", "Pengecekan menyeluruh, cuci evaporator dan kondensor, tambah freon R410A, perbaikan kebocoran. Dijamin dingin kembali atau uang kembali.", 150000, 1, img("photo-1754665099555-dea88285e4ec")],
    ["perbaikan-mesin-cuci-1-2-tabung", "perbaikan-rumah", "budi.santoso@email.com", "Perbaikan mesin cuci 1 dan 2 tabung: tidak berputar, bocor, atau bunyi kasar. Termasuk penggantian sparepart standar.", 175000, 2, img("photo-1626806787461-102c1bfaaea1")],
    ["pembersihan-kulkas-steam", "perbaikan-rumah", "yoga.permana@email.com", "Pembersihan mendalam kulkas dengan steam, pengecekan kompresor, penggantian seal pintu bila perlu. Kulkas jadi lebih awet dan tidak bau.", 120000, 1, img("photo-1584568694244-14fbdf83bd30")],
    ["perbaikan-water-heater", "perbaikan-rumah", "budi.santoso@email.com", "Perbaikan water heater: tidak panas, bocor, atau error. Termasuk pengecekan elemen pemanas dan anoda.", 200000, 1, img("photo-1585704032915-c3400ca199e7")],
    // Kebersihan (siti, bandung)
    ["bersih-rumah-reguler-per-m2", "kebersihan", "siti.rahayu@email.com", "Pembersihan menyeluruh: menyapu, mengepel, kamar mandi, dapur, dan kaca. Alat dan cairan pembersih disediakan vendor.", 50000, 1, img("photo-1581578731548-c64695cc6952")],
    ["deep-clean-pasca-renovasi", "kebersihan", "siti.rahayu@email.com", "Pembersihan mendalam pasca renovasi: debu semen, cat, dan keramic. Tim 2 orang dengan peralatan profesional.", 75000, 2, img("photo-1527515637462-cff94eecc1ac")],
    ["bersih-sofa-karpet-steam", "kebersihan", "siti.rahayu@email.com", "Cuci sofa dan karpet metode steam: hilangkan noda, debu, dan bau tidak sedap. Per kursi atau per meter persegi.", 90000, 1, img("photo-1563453392212-326f5e854473")],
    ["jasa-bersih-kos-kontrakan", "kebersihan", "siti.rahayu@email.com", "Paket kebersihan bulanan: 2x seminggu, termasuk cuci sprei dan mengepel lantai. Minimal kontrak 1 bulan.", 3500000, 1, img("photo-1615875605825-5eb9bb5d52ac")],
    ["pembersihan-ducting-ac", "kebersihan", "siti.rahayu@email.com", "Pembersihan saluran AC ducting untuk rumah dan kantor. Membantu udara lebih bersih dan AC lebih efisien.", 450000, 1, img("photo-1711696488222-3a5af2a3dd72")],
    // Listrik (agus, surabaya)
    ["instalasi-listrik-rumah-baru", "listrik", "agus.pratama@email.com", "Pemasangan instalasi listrik standar SNI: titik lampu, stop kontak, dan panel MCB. Termasuk gambar jalur dan konsultasi penempatan.", 25000000, 5, img("photo-1621905251189-08b45d6a269e")],
    ["perbaikan-listrik-konslet", "listrik", "agus.pratama@email.com", "Pencarian gangguan listrik, perbaikan korsleting, dan penggantian komponen rusak. Ditarget selesai hari yang sama.", 200000, 1, img("photo-1621905252507-b35492cc74b4")],
    ["pasang-lampu-saklar-titik", "listrik", "agus.pratama@email.com", "Pemasangan titik lampu, saklar, dan stop kontak baru. Material bisa disediakan atau dibawa sendiri oleh klien.", 100000, 1, img("photo-1581858726788-75bc0f6a952d")],
    ["perawatan-panel-mcb", "listrik", "yoga.permana@email.com", "Pengecekan panel listrik, pengencangan terminal, dan penggantian MCB yang sudah jelek. Penting untuk keamanan.", 150000, 1, img("photo-1509391366360-2e959784a276")],
    ["pemasangan-lampu-led-downlight", "listrik", "agus.pratama@email.com", "Pasang downlight LED recessed 5-12 watt. Termasuk lubang dan wiring. Per titik.", 85000, 1, img("photo-1600585152220-90363fe7e115")],
    // Pengecatan (rina, medan)
    ["cat-tembok-interior-per-m2", "pengecatan", "rina.marlina@email.com", "Pengecatan tembok interior 2 lapis dengan cat dinding premium (Dulux/Nippon). Termasuk plamir dan finishing rapi.", 25000, 3, img("photo-1615873968403-89e068629265")],
    ["cat-tembok-eksterior-per-m2", "pengecatan", "rina.marlina@email.com", "Pengecatan eksterior tahan cuaca 2 lapis. Termasuk persiapan permukaan, primer, dan pembersihan area kerja.", 30000, 4, img("photo-1560184897-ae75f418493e")],
    ["cat-ulangan-kusen-pagar-besi", "pengecatan", "rina.marlina@email.com", "Pengamplasan, pelapisan anti karat, dan cat finishing untuk kusen dan pagar besi. Hasil halus dan tahan lama.", 45000, 2, img("photo-1562259949-e8e7689d7828")],
    ["wallpaper-pasang-per-m2", "pengecatan", "rina.marlina@email.com", "Pemasangan wallpaper dinding motif minimalis. Termasuk lem dan finishing tepi. Min. 5 m2.", 85000, 2, img("photo-1616464916356-3a777b2b60b1")],
    // Pindahan (dewi, makassar)
    ["pindah-rumah-1-2-kamar", "pindahan", "dewi.anggraini@email.com", "Pindah rumah skala kecil: packing, angkut, bongkar, dan susun ulang. Termasuk truk dan 2 tenaga kerja.", 900000, 1, img("photo-1714647211902-bb711d643a17")],
    ["pindah-kantor-gudang", "pindahan", "dewi.anggraini@email.com", "Pindah kantor lengkap dengan packing khusus meja, komputer, dan arsip. Tim 4 orang profesional.", 2500000, 2, img("photo-1585129777188-94600bc7b4b3")],
    ["jasa-packing-saja", "pindahan", "dewi.anggraini@email.com", "Packing barang dengan bubble wrap dan kardus berkualitas. Siap angkut. Per jam atau per barang.", 75000, 1, img("photo-1611145367651-6303b46e4040")],
    ["penyimpanan-barang-kos", "pindahan", "dewi.anggraini@email.com", "Penyimpanan barang sementara di gudang aman. Per bulan per meter kubik. Termasuk asuransi.", 150000, 1, img("photo-1600518464441-9154a4dea21b")],
    // Tukang (yoga, yogyakarta)
    ["renovasi-kamar-mandi", "tukang", "yoga.permana@email.com", "Renovasi kamar mandi: keramik baru, closet, kran, dan sanitair. Termasuk pembongkaran yang lama.", 35000000, 7, img("photo-1595515106969-1ce29566ff1c")],
    ["pasang-keramik-lantai-per-m2", "tukang", "yoga.permana@email.com", "Pemasangan keramik lantai dengan nat rapi. Termasuk persiapan acian dasar dan pengeringan.", 60000, 3, img("photo-1504148455328-c376907d081c")],
    ["perbaikan-atap-bocor", "tukang", "yoga.permana@email.com", "Lokalisir kebocoran, ganti genteng atau nok yang rusak, dan aplikasi waterproofing. Garansi 6 bulan.", 300000, 1, img("photo-1541888946425-d81bb19240f5")],
    ["plafon-gypsum-baru-per-m2", "tukang", "budi.santoso@email.com", "Pemasangan plafon gypsum rangka hollow galvanis. Termasuk finishing nat dan dempul halus. Rapih dan kuat.", 85000, 4, img("photo-1581092160562-40aa08e78837")],
    ["pemasangan-dinding-batako", "tukang", "yoga.permana@email.com", "Pemasangan dinding batako untuk perluasan atau pembatas ruangan. Termasuk adukan dan plesteran dasar.", 55000, 3, img("photo-1504307651254-35680f356dfd")],
    // Nasional — Bangka Belitung & Kepri
    ["servis-ac-pangkal-piniong", "perbaikan-rumah", "hendri.bangka@email.com", "Servis AC wilayah Pangkal Pinang & Bangka: cuci, tambah freon, perbaikan bocor. Garansi 1 bulan.", 175000, 1, img("photo-1753826477307-82c71f3d9537")],
    ["bersih-rumah-bangka-belitung", "kebersihan", "hendri.bangka@email.com", "Jasa kebersihan rumah & kos di Bangka Belitung: harian & mingguan. Alat lengkap.", 60000, 1, img("photo-1581578731548-c64695cc6952")],
    ["instalasi-listrik-tanjung-pinang", "listrik", "lina.natuna@email.com", "Instalasi & perbaikan listrik di Tanjung Pinang, Kepulauan Riau. SNI, bergaransi.", 180000, 2, img("photo-1621905251189-08b45d6a269e")],
    ["cat-rumah-bengkulu", "pengecatan", "eko.bengkulu@email.com", "Pengecatan interior & eksterior Bengkulu: 2 lapis, cat premium.", 28000, 3, img("photo-1615873968403-89e068629265")],
    ["pindahan-jambi-lokal", "pindahan", "jambi.teknik@email.com", "Pindahan lokal Jambi: packing, angkut, bongkar. Truk + 2 crew.", 850000, 1, img("photo-1714647211902-bb711d643a17")],
    ["servis-ac-lampung", "perbaikan-rumah", "lampung.jaya@email.com", "Cuci AC & servis kulkas Lampung: cepat, bersih, bergaransi.", 140000, 1, img("photo-1584568694244-14fbdf83bd30")],
    ["renovasi-banten-ringan", "tukang", "banten.maju@email.com", "Renovasi ringan Serang-Banten: plafon, keramik, cat. Survey gratis.", 75000, 4, img("photo-1595515106969-1ce29566ff1c")],
    ["listrik-pontianak-24jam", "listrik", "ponti.servis@email.com", "Emergency listrik Pontianak 24 jam: konslet, MCB trip, tambah daya.", 200000, 1, img("photo-1621905252507-b35492cc74b4")],
    ["tukang-balikpapan-terpercaya", "tukang", "balikpapan.pro@email.com", "Tukang Balikpapan: bangun, renovasi, atap bocor. Garansi 6 bulan.", 70000, 3, img("photo-1504307651254-35680f356dfd")],
    ["kebersihan-villa-bali", "kebersihan", "bali.prime@email.com", "Daily cleaning villa & homestay Bali: daily, weekly, deep clean.", 85000, 1, img("photo-1563453392212-326f5e854473")],
    ["pindahan-mataram-lombok", "pindahan", "lombok.jaya@email.com", "Pindahan Mataram-Lombok: dalam & luar pulau. Packing aman.", 1200000, 2, img("photo-1585129777188-94600bc7b4b3")],
    ["servis-elektronik-kupang", "perbaikan-rumah", "kupang.solid@email.com", "Servis elektronik Kupang NTT: AC, kulkas, mesin cuci. Sparepart ready.", 160000, 2, img("photo-1626806787461-102c1bfaaea1")],
    ["cat-dekor-manado", "pengecatan", "manado.ahli@email.com", "Cat dekoratif Manado Sulawesi Utara: wallpaper, coating, interior.", 35000, 3, img("photo-1562259949-e8e7689d7828")],
    ["tukang-palu-cepat", "tukang", "palu.teknik@email.com", "Tukang Palu Sulteng: renovasi, plafon gypsum, pasang keramik.", 65000, 3, img("photo-1581092160562-40aa08e78837")],
    ["listrik-ambon-island", "listrik", "ambon.servis@email.com", "Jasa listrik Ambon Maluku: instalasi rumah, perbaikan genset.", 190000, 2, img("photo-1509391366360-2e959784a276")],
    ["pindahan-jayapura-papua", "pindahan", "jayapura.tangguh@email.com", "Pindahan Jayapura Papua: logistik dalam kota & antar kabupaten.", 2500000, 3, img("photo-1600518464441-9154a4dea21b")],
    // DRAFT & ARCHIVED samples
    ["jasa-bangun-pagar-tembok", "tukang", "budi.santoso@email.com", "Pembangunan pagar tembok dengan pondasi dan finishing cat. Min. 3 meter lari. Free konsultasi desain.", 65000, 7, img("photo-1530124566582-a618bc2615dc")],
    ["cuci-ac-rutin-paket-4-unit", "perbaikan-rumah", "budi.santoso@email.com", "Paket cuci 4 unit AC hemat: cuci indoor dan outdoor, cek freon, dan pembersihan filter. Pesan lebih dulu.", 450000, 2, img("photo-1759772238012-9d5ad59ae637")],
  ]

  // Pool galeri per kategori — 2 foto tambahan selain foto utama, agar detail
  // jasa punya carousel 3 gambar tanpa harus cari foto baru per jasa.
  const galleryPool = {
    "perbaikan-rumah": [
      img("photo-1753826477307-82c71f3d9537"),
      img("photo-1754665099555-dea88285e4ec"),
      img("photo-1626806787461-102c1bfaaea1"),
      img("photo-1584568694244-14fbdf83bd30"),
    ],
    kebersihan: [
      img("photo-1581578731548-c64695cc6952"),
      img("photo-1527515637462-cff94eecc1ac"),
      img("photo-1563453392212-326f5e854473"),
      img("photo-1615875605825-5eb9bb5d52ac"),
    ],
    listrik: [
      img("photo-1621905251189-08b45d6a269e"),
      img("photo-1621905252507-b35492cc74b4"),
      img("photo-1581858726788-75bc0f6a952d"),
      img("photo-1509391366360-2e959784a276"),
    ],
    pengecatan: [
      img("photo-1615873968403-89e068629265"),
      img("photo-1560184897-ae75f418493e"),
      img("photo-1562259949-e8e7689d7828"),
      img("photo-1616464916356-3a777b2b60b1"),
    ],
    pindahan: [
      img("photo-1714647211902-bb711d643a17"),
      img("photo-1585129777188-94600bc7b4b3"),
      img("photo-1611145367651-6303b46e4040"),
      img("photo-1600518464441-9154a4dea21b"),
    ],
    tukang: [
      img("photo-1595515106969-1ce29566ff1c"),
      img("photo-1504148455328-c376907d081c"),
      img("photo-1541888946425-d81bb19240f5"),
      img("photo-1581092160562-40aa08e78837"),
    ],
  }

  const services = []
  for (const [slug, catSlug, email, description, price, days, imageUrl] of serviceData) {
    const pool = galleryPool[catSlug] || []
    const extras = pool.filter((u) => u !== imageUrl).slice(0, 2)
    const service = await prisma.service.create({
      data: {
        title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        slug: `${slug}-${Math.floor(Math.random() * 100000)}`,
        description,
        price,
        deliveryTimeDays: days,
        imageUrl,
        images: extras.length ? JSON.stringify(extras) : null,
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

      const addressSamples = [
        "Jl. Melati No.12, Jakarta Selatan",
        "Jl. Braga No.45, Bandung",
        "Jl. Basuki Rahmat No.8, Surabaya",
        "Jl. Sudirman No.22, Medan",
        "Jl. Prawirotaman No.17, Yogyakarta",
        "Jl. Pettarani No.11, Makassar",
        "Jl. Kebayoran Baru No.5, Jakarta",
        "Jl. Jendral Sudirman No.10, Pangkal Pinang, Kepulauan Bangka Belitung",
        "Jl. Hang Tuah No.8, Tanjung Pinang, Kepulauan Riau",
        "Jl. Merdeka No.15, Bengkulu",
        "Jl. Sultan Thaha No.20, Jambi",
        "Jl. Teuku Umar No.22, Bandar Lampung",
        "Jl. Gajah Mada No.3, Pontianak, Kalimantan Barat",
        "Jl. Sudirman No.88, Balikpapan, Kalimantan Timur",
        "Jl. Teuku Umar No.45, Denpasar, Bali",
        "Jl. Pejanggik No.12, Mataram, Nusa Tenggara Barat",
        "Jl. El Tari No.30, Kupang, Nusa Tenggara Timur",
        "Jl. Sam Ratulangi No.18, Manado, Sulawesi Utara",
        "Jl. Pattimura No.14, Ambon, Maluku",
        "Jl. Ahmad Yani No.7, Jayapura, Papua",
      ]
      const address = addressSamples[Math.floor(Math.random() * addressSamples.length)]
      const deadline = Math.random() > 0.5 ? daysAgo(-Math.floor(Math.random() * 7) - 1) : null
      const order = await prisma.order.create({
        data: {
          customerId: customer.id,
          serviceId: service.id,
          totalPrice: service.price,
          status: isCompleted ? "COMPLETED" : Math.random() > 0.5 ? "PENDING" : "IN_PROGRESS",
          paymentMethod: ["transfer", "ewallet", "cod"][Math.floor(Math.random() * 3)],
          orderNotes,
          address,
          deadline,
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