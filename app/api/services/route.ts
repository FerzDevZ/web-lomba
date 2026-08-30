// @ts-nocheck
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
    const categoryId = toPrismaId(category) as unknown as number & string
    if (Number.isFinite(categoryId)) {
      where.categoryId = categoryId
    }
  }
  // Pencarian multi-kata: setiap kata harus cocok di judul / deskripsi / nama provider
  if (search) {
    const tokens = search.split(/\s+/).filter(Boolean)
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
}

const createServiceSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.coerce.number().positive(),
  deliveryTimeDays: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive(),
  // Bisa URL https:// atau data:image/... dari upload device (auto-kompresi client), max ~2MB base64
  imageUrl: z.string().max(2_500_000).optional().or(z.literal('')).refine(
    (v) => !v || v.startsWith('data:image/') || /^https?:\/\/.+/.test(v),
    { message: 'URL gambar tidak valid' }
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
        categoryId: validated.categoryId,
        providerId: user.id,
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
