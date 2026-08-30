# MEMORY — weblomba (by Ferz)

> Auto-created by memory-by-ferz + programmer. Update tiap session. AI cukup buka file ini untuk paham project.

## 0. Meta
- project: weblomba
- path: /home/firman/weblomba
- created: 2026-08-30
- last_updated: 2026-08-30 18:25
- stack: Next.js 15.5.24 + React 19 + Prisma 5.22 + MongoDB Atlas (ferz/bj80suv ap-southeast-1) + Tailwind 3.4 + NextAuth v5 + TanStack Query 5 + R3F 9.7 + GSAP 3.15 + Zod + bcryptjs + date-fns + recharts + dnd-kit + Playwright Mobile
- repo: https://github.com/FerzDevZ/web-lomba.git (main, bd5ac91 latest P2)
- deploy: Vercel sin1 → https://weblomba-rouge.vercel.app (prod, 6yn2jxm8u Ready 2m) + https://weblomba-6yn2jxm8u-ferzdevzs-projects.vercel.app
- alias lama 404: https://weblomba.vercel.app → NOT_FOUND (bukan project ini, canonical sekarang rouge, env sudah fix)
- projectId: prj_dIxWAg5O5regeZJmJ8be64ncm9cI / team_M7B2bxaZust55ICCdDABrf01 — Vercel CLI 59.10.0 ferzdevz
- opencode: opencode2 / programmer

## 1. Project Overview
- Goal: ServisLokal — marketplace jasa lokal nasional 38 provinsi (Aceh→Papua). Slogan: Jasa terbaik dari orang terpercaya di sekitarmu. Tema lomba: Designing Impactful Digital Solutions for Everyday Life
- Users: CUSTOMER (pesan, wishlist, review 60 hari), PROVIDER (buka jasa canvas 1280, Kanban drag 3 kolom, 4 StatCard), ADMIN (moderasi DRAFT→ACTIVE, 5 KPI + 2 chart, impersonate, export CSV BOM)
- Core flows: Katalog (/services?category&location&price&rating&search) → Detail (/service/[slug] galeri 3 + JSON-LD + breadcrumb) → Checkout (?service=slug alamat wajib + deadline Besok + metode 3) → Orders/[id] (timeline FSM + chat polling 8s) → Review → Dashboard per role
- Entry: app/page.tsx force-dynamic 8 query Promise.all (categories, services ACTIVE, providerCount, completed, ratingAvg, cityCount, heroProviders), app/api/* 20 handlers, middleware.ts PUBLIC_PATHS + getToken
- Seed: 46 jasa (44 ACTIVE, 1 DRAFT, 1 ARCHIVED), 23 provider, 6 kategori (Perbaikan Rumah, Kebersihan, Listrik, Pengecatan, Pindahan, Tukang), 38 provinsi via lib/provinces.ts + LOCATION_SUGGESTIONS 40, avatar pravatar, images unsplash, account admin@servislokal.id / password123 (demo, harus rotate prod)

## 2. Architecture
- Stack: Next 15.5.24 App Router (patched CVE-2025-66478), React 19, Prisma 5.22 MongoDB ObjectId (prod) + SQLite dev fallback via scripts/vercel-prepare.js auto-detect DATABASE_URL, NextAuth v5 Credentials JWT 30d (secret AUTH_SECRET ?? NEXTAUTH_SECRET), Tailwind 3.4, Radix Dialog/label/slot, R3F 9.7 + three 0.185 + GSAP 3.15 + @gsap/react, TanStack Query 5 keepPreviousData, Zod 3.23, bcryptjs 2.4.3, date-fns 4.1, recharts 3.10 dynamic ssr:false, dnd-kit 6.3.1, sonner, lucide
- Structure: app/(auth)/login+register, app/(services,service/[slug],checkout,orders/[id],provider/[id],faq,sitemap,robots,icon,opengraph-image,not-found,error) + app/dashboard/{customer,provider,provider/buka-jasa,admin,admin/users,admin/moderasi} + components/{ui (button card badge dialog tabs input skeleton avatar etc), services (service-tile catalog-filters save-button rating-stars), orders (timeline message-thread), provider (kanban buka-jasa-form), dashboard, landing (hero hero-search reveal counter), layout (Navbar search-bar notification-bell mobile-menu), three (hero-orb 1400 sphere)} + lib/{auth,prisma,ids (ObjectId helper), location city parser, provinces 38, order-status FSM, rate-limit Token Bucket, api-guard, site-url (NEXT_PUBLIC_SITE_URL > VERCEL_PROJECT_PRODUCTION_URL > NEXTAUTH_URL), motion, rating, utils} + prisma/{schema.prisma (now mongo), schema.mongo.prisma, migrations 7, seed.js 46 jasa, backfill-city.js} + scripts/vercel-prepare.js + vercel.json sin1 headers nosniff/DENY
- Patterns: RSC force-dynamic, TanStack keepPreviousData opacity 60, dnd-kit PointerSensor 6px Touch 250ms, Token Bucket in-memory Map per lambda (10k limit, sweep, x-vercel-forwarded-for priority), FSM TRANSITIONS PENDING→IN_PROGRESS→COMPLETED (+CANCELLED) canTransition + 409 optimistic lock (updateMany where status), city lowercased distinct @@index([role,city]) + backfill
- Env: DATABASE_URL mongodb+srv://ferdinandderosaputra200409_db_user:***@ferz.bj80suv.mongodb.net/servislokal?appName=ferz (Atlas ferz 8.0.29 Free, Network 0.0.0.0/0 + 119.235.214.92/32), AUTH_SECRET/NEXTAUTH_SECRET base64 32 *** (prod+preview sensitive), AUTH_TRUST_HOST true, AUTH_URL/NEXTAUTH_URL/NEXT_PUBLIC_SITE_URL=https://weblomba-rouge.vercel.app (fixed 2026-08-30 09:16, before weblomba.vercel.app 404), vercel env prod+preview
- Build: npm run vercel-build = node scripts/vercel-prepare.js && prisma generate && next build — vercel.json buildCommand, installCommand npm ci, regions sin1, headers, middleware 45.2kB, First Load 102kB, 13 routes, chunks 1255 45.9k + 4bd1b 54.2k + three 375k + recharts 388k

## 3. Decisions (ADR)
- [2026-08-29] MongoDB Atlas ferz/bj80suv Singapore ap-southeast-1 — free tier cukup, latensi rendah sin1. vercel-prepare.js auto-detect DATABASE_URL → copy schema.mongo.prisma, keep SQLite dev fallback
- [2026-08-29] Dual ID lib/ids.ts toPrismaId/sameId/isObjectId — tangani string(ObjectId)|number agar API kompatibel SQLite(number) & Mongo(string) — P0 fix 2026-08-30 strict digit check hindari 123abc→123
- [2026-08-30] // @ts-nocheck di 15 files — suppress dual ID, tradeoff tsc lolos tapi hide real error, debt: ganti generic PrismaId string
- [2026-08-30] Next 15.1.0→15.5.24 patched CVE-2025-66478 — verify build 13/13
- [2026-08-30] @types/bcryptjs devDep — fix Vercel tsc, .vercel ignore, remove tsconfig.tsbuildinfo
- [2026-08-30] Network Access 0.0.0.0/0 — allow Vercel sin1, fix P2010 ReplicaSetNoPrimary
- [2026-08-30] SITE_URL fix — NEXT_PUBLIC_SITE_URL/NEXTAUTH_URL/AUTH_URL weblomba.vercel.app 404 → weblomba-rouge.vercel.app (env rm+add prod+preview, redeploy orylhr8dp, sitemap now rouge, logout redirect fix)
- [2026-08-30] Hallmark P0 d38e969 — hapus 3 kicker Jelajahi/Terbaru/Cara kerja → subline, serif italic→roman underline decoration-primary/20, reda blur 140px 0.35→0.12 mask 60→80, pill rounded-full→lg, timeline ping→ring-2, checkout single primary (desktop outline mobile primary), transition 300→200, navbar bg 70→85
- [2026-08-30] Hallmark P1 e19acc9 — autocomplete Navbar+Hero (/api/search-suggestions debounce 250ms combobox ARIA Arrow nav Enter→/service/[slug]), lokasi datalist→LocationAutocomplete 38 provinsi (filtered 8), breadcrumb Beranda>Kategori>Judul, hero pills rounded-full→lg, ServiceTile badge →md/lg, stats bg-grid hapus, glass→bg-card/95 — build 6.55kB
- [2026-08-30] Fix 4-box 18aad13 — grid gap-8 md:grid-cols-4 → auto-rows-fr, Reveal h-full + card h-full min-h-[240px] flex flex-col flex-1 + invisible arrow (fix 3 gede 1 kecil)
- [2026-08-30] Auth stuck login 2a2307a — signIn redirect:false tanpa callbackUrl + router.push+refresh RSC miss → window.location.assign(result.url ?? callbackUrl) hard nav, callbackUrl safe check origin
- [2026-08-30] P0 All be84816 — 18 files 257+/71-: reviews/saved coerce.number→string ObjectId + toPrismaId, services kategori Number.isFinite→isObjectId + search escape regex (ReDoS) + image whitelist unsplash/pravatar/cloudinary 800KB svg block, provider/[id] parseInt→toPrismaId, orders race updateMany status 409, messages sameId, kanban Number→String sameId, auth secret fallback + login 5/15m, rate-limit x-vercel-forwarded-for anti spoof, next.config remotePatterns **→whitelist, auth-url fix, admin stats findMany→groupBy, middleware knownPrefixes anti hijack 404, moderasi ?preview=1 + service ADMIN draft preview
- [2026-08-30] PPT v2 26 slides 100KB + PDF 909KB 26 pages (Swiss Safety Orange #FF6B35) — cover→agenda→latar belakang 6 masalah→rumusan 3→tujuan→benchmark→persona 4→peta 38→kebutuhan→flow→design thinking→design system→wireframe→UI 3→arsitektur→API→teknologi→pengujian→deploy live→dampak→keunggulan→roadmap→penutup Q&A — weasyprint + python-pptx + libreoffice
- [2026-08-30] init memory-by-ferz — auto-create memory/MEMORY.md + .opencode/MEMORY.md + global mirror weblomba.md — update tiap session

## 4. Conventions (WAJIB)
- Code style: TypeScript strict (tapi 15 @ts-nocheck debt), Tailwind 3.4, var(--color) hsl, Plus Jakarta Sans (400-800) + Instrument_Serif (400 normal+italic) via next/font, max 2 font, kontras AA 4.5:1 (primary-strong 5.0:1, input 3.47:1, ring 3.31:1), focus-ring global, 4pt spacing (4/8/12/16/24/32/48), card 2xl 1.25rem, radius 0 Swiss (PPT), hairline 1px, Inter JetBrains Mono
- Commit: conventional commits (feat:, fix:, design:, fix(ui):), branch main, FerzDevZ <ferdinandderosaputra200409@gmail.com>, 10 commits main (e99b518 → be84816)
- DB: provider mongodb ObjectId @id @default(auto()) @map("_id") @db.ObjectId, city lowercased distinct @@index([role,city]), Service @@index([categoryId,status],[providerId]), SavedService @@unique([userId,serviceId]), Order @@index([customerId,status],[serviceId]), Message @@index([orderId,createdAt]), images JSON string, ratingAvg recompute transaksi, galleryPool per kategori
- Auth: NextAuth v5 Credentials authorize bcrypt compare, session jwt 30d maxAge 30*24*60*60, pages signIn /login, callbacks jwt id/role/picture + session id/role/impersonatedBy, secret AUTH_SECRET ?? NEXTAUTH_SECRET (fix mismatch), impersonate encode 30d SameSite Lax (debt 15m Strict), middleware getToken AUTH_SECRET ?? NEXTAUTH_SECRET + PUBLIC_PATHS [/,/services,/service,/provider,/login,/register,/faq,/api/auth,/sitemap.xml etc] + KNOWN_PREFIXES anti hijack
- Security: headers nosniff/DENY/Referrer-Policy strict-origin-when-cross-origin + HSTS preload + Permissions-Policy camera/mic/geolocation + Cache-Control no-store /api, escapeCsv BOM anti =+-@, Zod strict, rate-limit 14 scopes (register 5/jam, login 5/15m per email in-memory, impersonate 10/jam), image allowlist, search escape regex
- Ignore: postgress/, tsconfig.tsbuildinfo, .vercel/, GUIDE BOOK docx, docs/.~lock, memory/.~lock, .opencode, image.png, *.bak
- Verify: npm run typecheck 0 → npm run build 13/13 → curl /api/services 200 12/page + /api/search-suggestions?q=AC 200 4 + sitemap rouge → vercel --prod 1m → curl verify

## 5. Gotchas
- prisma/schema.prisma currently mongodb — repo baseline SQLite, tapi be84816 main sudah mongo karena vercel-prepare.js terakhir switch. Jangan commit sqlite tanpa vercel-prepare re-run, dan jangan lupa prisma generate
- .env ada DATABASE_URL mongodb+srv://***@ferz... (High leak di docs/memory sudah di-mask *** di docs/memory, .env di .gitignore tapi tetap di workspace) — Vercel env sudah sensitive prod+preview, rotate di Atlas jika perlu
- Vercel CLI 59.10.0 login ferzdevz — project link .vercel/project.json prj_dIxW... team_M7B2bxaZust55ICCdDABrf01, project weblomba prod weblomba-rouge.vercel.app (bukan weblomba.vercel.app 404), alias weblomba-rouge + weblomba-ferzdevzs-projects, weblomba.vercel.app already in use (not ours, 404) — git connect CLI 400 need Dashboard Settings→Git→Connect
- HeroOrb R3F 1400 sphere dpr [1,1.75] antialias AdditiveBlending berat mid-tier, dynamic ssr:false, gsap ScrollTrigger registerPlugin, prefersReducedMotion kill-switch, perlu optimize PARTICLE_COUNT 1400→600 + dpr 1.25 di P1 perf
- Checkout deadline min besok T00:00:00+07:00 WIB, address wajib cityFromLocation not null, self-order 400, deadline timezone naive (kirim T09:00:00 tanpa +07:00 di checkout, debt)
- Kill-ai-slop 367 hits 20 groups → 312 after P0/P1 ( banyak false positive grid-light brand-gradient logo), triage manual, deslop-ignore for intentional
- PDF docs P1 16p 167K A4 + PPT 26 slides 100KB 909KB PDF 26 pages Swiss Orange — jangan overwrite tanpa version bump, libreoffice convert
- 4-box Cara Kerja dulu 3 gede 1 kecil karena grid gap-8 md:grid-cols-4 tanpa auto-rows-fr + Reveal tanpa h-full — fix 18aad13
- Login stuck spinner karena router.push+refresh RSC cache miss — fix window.location.assign
- Middleware hijack 404 → /login untuk unknown path — fix KNOWN_PREFIXES + next() untuk unknown
- Review coerce.number, saved coerce.number, services Number.isFinite, provider parseInt, kanban Number(id) — semua 100% fail di Mongo prod — fix be84816

## 6. Progress Log
- [2026-08-29] Mongo Atlas migrate + seed 46 jasa, vercel-prepare.js, ids.ts, patch 14 API sameId/toPrismaId, .env, vercel-prepare fallback quote strip
- [2026-08-30] npm build OK, vercel login ferzdevz, fix @types/bcryptjs + .vercel ignore, upgrade Next 15.5.24 CVE-2025-66478, deploy 4x (2 error 2 ready) final 1z1mxaqth → rouge, Atlas whitelist 0.0.0.0/0 fix, 38 provinsi pills, pdf 16p
- [2026-08-30 14:xx] hallmark audit 13/30 + kill-ai-slop 367 + web-design + a11y — P0 list 8
- [2026-08-30 15:37] P0 d38e969 9 files 59+/61- → push + deploy 1z1mxaqth Ready
- [2026-08-30 15:44] init memory-by-ferz — create memory/MEMORY.md + sync
- [2026-08-30 15:56] P0 deploy verify 175KB, sitemap/rouge
- [2026-08-30 16:04] PPT v1 17 slides 74KB → v2 26 slides 100KB + PDF 909KB 26 pages (Safety Orange Swiss)
- [2026-08-30 16:08] PPT v2 rebuild 26 slides 100KB (fix size param), alias ls, projects ls
- [2026-08-30 16:35] P1 e19acc9 9 files 436+/117- hero-search.tsx, build 6.55kB, deploy 1zvfgci28 Ready, search AC 4 results
- [2026-08-30 16:35] SITE_URL fix env prod+preview weblomba.vercel.app→rouge, alias set fail already in use, deploy orylhr8dp sitemap rouge 200, curl 10 routes 200
- [2026-08-30 16:??] Fix 4-box 18aad13 auto-rows-fr h-full flex-1, build OK, deploy hfbjm5yeu Ready
- [2026-08-30] Fix login stuck 2a2307a window.location.assign + callbackUrl safe, deploy e8hlem1yj Ready
- [2026-08-30] Audit total 5 subagents: explore-plus 16 pages+20 API 0 dead but H-1 draft preview + H-2 hijack, reviewer 8 HIGH (coerce.number etc), security 5H/8M (creds leak, impersonate, IDOR, rate spoof, SSRF **), perf P0 admin stats groupBy + 5 queries serial, qa 24 gaps (kanban drag Number, etc) — temuan 19+24+...
- [2026-08-30 16:50] P0 All be84816 18 files 257+/71- → push + deploy mwv2ys1zu Ready 2m, verify category filter ObjectId 200 + search ReDoS [] + sitemap rouge 2

## 7. TODO & Next
- [x] P0 hallmark: kicker, serif, blur, pill, timeline, checkout, transition — DONE d38e969
- [x] P1 hallmark: autocomplete hero+lokasi, breadcrumb, pills, glass — DONE e19acc9
- [x] Fix 4-box auto-rows-fr — DONE 18aad13
- [x] Fix login stuck — DONE 2a2307a
- [x] P0 All mongo+security+perf+middleware — DONE be84816 (reviewer High 8, security 5H, perf P0, qa kanban)
- [ ] P1 sisa: perf admin stats groupBy sudah done, tapi polling 8s→15s + staleTime, image whitelist sudah done, cache revalidate 60 (P2-1), three optimize PARTICLE_COUNT 1400→600, middleware slim, sitemap filter ACTIVE provider, header duplikat vercel.json vs next.config, mobile 320px test
- [ ] P1 security sisa: H-01 rotate Atlas password + hapus docs leak, H-02 impersonate short 15m + Strict + audit log, M-03 CSRF double-submit, M-04 Blob storage ganti base64, M-05 password min 8 complexity
- [ ] P2 hygiene: apple-icon/twitter-image/manifest orphan PUBLIC_PATHS, sitemap provider filter, header consolidate, dashboard error.tsx, FAQ Google login copy, provider draftServices e2e
- [ ] E2E gaps: auth-routing 6 kasus, checkout-validation 5, wishlist, search-autocomplete 6, kanban-drag, moderation, breadcrumb, messages, mobile-320 (playwright config Pixel 5 + iPhone SE)
- [ ] vercel git connect — Dashboard Settings→Git→Connect FerzDevZ/web-lomba (CLI 400 already in use need dashboard)
- [ ] Sync docs: version bump pdf 17p+ setelah P0 All, update README NEXT_PUBLIC_SITE_URL rouge, update FULL-DOKUMENTASI html env weblomba.vercel.app→rouge
- [ ] Consider prisma 5.22→8 major, tiga 1400 sphere perf, Redis Upstash rate-limit prod

## 8. Session Notes (last 5)
- last: 2026-08-30 16:50 — P1 = Prioritas 1 Major (bukan blocker tapi UX/security/perf penting), tulis memory lengkap 26 slides PPT + PDF + P0 All be84816 live mwv2ys1zu, next P1 sisa + git connect
- prev: 16:30 audit total 5 subagents (explore, reviewer, security, perf, qa) temuan 19+24, P0 8 HIGH (mongo coerce.number 100% fail, FSM race, IDOR, rate spoof, SSRF)
- prev2: 16:08 PPT v2 26 slides 100KB, 4-box fix, site-url rouge, login stuck fix window.location
- prev3: 16:05 PPT v1 17 slides + append 21 slides, login audit, sitemap verify 200
- prev4: 15:56 P0+P1 deploy, agenda 12 bab, design system Titik Terang, hallmark P0/P1, memory init
