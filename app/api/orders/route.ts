import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { RATE_LIMITS, enforceRateLimit } from "@/lib/api-guard"

export const dynamic = "force-dynamic"

const createOrderSchema = z.object({
  serviceId: z.coerce.number().int().positive(),
  orderNotes: z.string().max(500).optional().nullable(),
  paymentMethod: z.enum(["transfer", "ewallet", "cod"]).optional(),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const limited = enforceRateLimit(
    request,
    "order-create",
    RATE_LIMITS.orderCreate,
    session.user.id
  )
  if (limited) return limited

  try {
    const body = await request.json()
    const validated = createOrderSchema.parse(body)

    const service = await prisma.service.findUnique({
      where: { id: validated.serviceId },
    })
    if (!service || service.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Jasa tidak ditemukan" },
        { status: 404 }
      )
    }

    const customerId = parseInt(session.user.id, 10)
    if (service.providerId === customerId) {
      return NextResponse.json(
        { error: "Tidak dapat memesan jasa sendiri" },
        { status: 400 }
      )
    }

    const order = await prisma.order.create({
      data: {
        customerId,
        serviceId: service.id,
        totalPrice: service.price,
        status: "PENDING",
        paymentMethod: validated.paymentMethod ?? null,
        orderNotes: validated.orderNotes ?? null,
      },
      include: {
        service: {
          include: {
            provider: { select: { name: true } },
            category: true,
          },
        },
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const limited = enforceRateLimit(
    request,
    "orders-list",
    RATE_LIMITS.read,
    session.user.id
  )
  if (limited) return limited

  const customerId = parseInt(session.user.id, 10)
  const orders = await prisma.order.findMany({
    where: { customerId },
    include: {
      service: {
        include: {
          provider: {
            select: { id: true, name: true, avatarUrl: true },
          },
          category: true,
        },
      },
      reviews: { select: { id: true, rating: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(orders)
}
