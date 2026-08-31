import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { toPrismaId, sameId } from "@/lib/ids"
import { RATE_LIMITS, enforceRateLimit } from '@/lib/api-guard'

export const dynamic = 'force-dynamic'

const SORT_MAP = {
  newest: { createdAt: 'desc' },
  'price-asc': { price: 'asc' },
  'price-desc': { price: 'desc' },
  rating: { ratingAvg: 'desc' },
} as const

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, 'services-list', RATE_LIMITS.read)
  if (limited) return limited

  try {
    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') ?? '').trim()
    const slug = searchParams.get('slug')
    const category = searchParams.get('category')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const rating = searchParams.get('rating')
    const location = (searchParams.get('location') ?? '').trim()
    const sort = (searchParams.get('sort') ?? 'newest') as keyof typeof SORT_MAP
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = 12

    const where: any = { status: 'ACTIVE' }

    if (slug) {
      where.slug = slug
    }
    if (category) {
      const cid = String(category).trim()
      if (/^[0-9a-fA-F]{24}$/.test(cid) || /^\d+$/.test(cid)) {
        where.categoryId = toPrismaId(cid) as unknown as number & string
      }
    }
    // Pencarian multi-kata: escape regex, limit, anti-ReDoS
    if (search) {
      const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const raw = search.slice(0, 50)
      const tokens = raw.split(/\s+/).filter(Boolean).slice(0, 5).map((t) => escapeRegex(t.slice(0, 30))).filter(Boolean)
      if (tokens.length > 0) {
        where.AND = tokens.map((token) => ({
          OR: [
            { title: { contains: token } },
            { description: { contains: token } },
            { provider: { name: { contains: token } } },
          ],
        }))
      }
    }
    if (minPrice || maxPrice) {
      const min = minPrice ? parseFloat(minPrice) : undefined
      const max = maxPrice ? parseFloat(maxPrice) : undefined
      if (min !== undefined && max !== undefined && min > max) {
        return NextResponse.json({ error: "Harga minimum tidak boleh lebih besar dari maksimum" }, { status: 400 })
      }
      if (min !== undefined && (!Number.isFinite(min) || min < 0)) {
        return NextResponse.json({ error: "Harga minimum tidak valid" }, { status: 400 })
      }
      if (max !== undefined && (!Number.isFinite(max) || max < 0)) {
        return NextResponse.json({ error: "Harga maksimum tidak valid" }, { status: 400 })
      }
      where.price = {}
      if (min !== undefined) where.price.gte = min
      if (max !== undefined) where.price.lte = max
    }
    if (rating) {
      where.ratingAvg = { gte: parseFloat(rating) }
    }
    if (location) {
      // Cocokkan ke `provider.city` lowercase + trim (P1-7)
      const loc = location.trim().toLowerCase()
      if (loc) where.provider = { city: { contains: loc } }
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          provider: { select: { id: true, name: true, avatarUrl: true, city: true } },
          category: { select: { id: true, name: true, slug: true, icon: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: SORT_MAP[sort] ?? SORT_MAP.newest,
      }),
      prisma.service.count({ where }),
    ])

    return NextResponse.json({
      services,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("[services] GET error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

const createServiceSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.coerce.number().positive(),
  deliveryTimeDays: z.coerce.number().int().positive(),
  categoryId: z.string().min(1).refine((v) => /^[0-9a-fA-F]{24}$/.test(v) || /^\d+$/.test(v), "categoryId tidak valid"),
  // Hanya URL https:// whitelist; tolak data:image untuk cegah bloat (max 300KB)
  imageUrl: z.string().max(300_000, "Gambar >300KB").optional().or(z.literal('')).refine(
    (v) => {
      if (!v) return true
      if (v.startsWith('data:image/')) return false
      try {
        const u = new URL(v); if (!['http:', 'https:'].includes(u.protocol)) return false
        const allowed = ['images.unsplash.com','i.pravatar.cc','res.cloudinary.com','cdn.servislokal.id']
        return allowed.some(h => u.hostname === h || u.hostname.endsWith('.' + h))
      } catch { return false }
    },
    { message: 'Gambar >300KB atau URL gambar tidak valid atau host tidak diizinkan' }
  ),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: toPrismaId(session.user.id) as unknown as number & string },
  })
  if (user?.role !== 'PROVIDER' && user?.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Hanya role PROVIDER yang dapat membuat jasa' },
      { status: 403 }
    )
  }

  const limited = enforceRateLimit(
    request,
    'service-write',
    RATE_LIMITS.serviceWrite,
    user.id
  )
  if (limited) return limited

  try {
    const body = await request.json()
    const validated = createServiceSchema.parse(body)

    const slugBase = validated.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const service = await prisma.service.create({
      data: {
        title: validated.title,
        slug: `${slugBase}-${Date.now()}`,
        description: validated.description,
        price: validated.price,
        deliveryTimeDays: validated.deliveryTimeDays,
        imageUrl: validated.imageUrl || null,
        categoryId: toPrismaId(validated.categoryId) as unknown as number & string,
        providerId: toPrismaId(String(user.id)) as unknown as number & string,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? 'Data tidak valid' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
