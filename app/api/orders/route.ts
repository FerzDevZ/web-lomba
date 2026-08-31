import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { RATE_LIMITS, enforceRateLimit } from "@/lib/api-guard"
import { toPrismaId, sameId } from "@/lib/ids"

export const dynamic = "force-dynamic"

const createOrderSchema = z.object({
  serviceId: z.union([z.string().min(1), z.coerce.number().int().positive()]),
  orderNotes: z.string().max(500).optional().nullable(),
  // Alamat pelaksanaan layanan — wajib, inti marketplace jasa lokal (P0-1).
  address: z.string().trim().min(5, "Alamat minimal 5 karakter").max(500, "Alamat maksimal 500 karakter"),
  // Jadwal yang diinginkan customer; harus di masa depan bila diisi (P1-1).
  deadline: z
    .coerce
    .date()
    .optional()
    .nullable()
    .refine((d) => !d || d.getTime() > Date.now(), {
      message: "Jadwal harus di masa depan",
    }),
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
    const serviceId = toPrismaId(String(validated.serviceId))

    const service = await prisma.service.findUnique({
      where: { id: serviceId as unknown as number & string },
    })
    if (!service || service.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Jasa tidak ditemukan" },
        { status: 404 }
      )
    }

    const customerId = toPrismaId(session.user.id) as unknown as number & string
    if (sameId(service.providerId, customerId)) {
      return NextResponse.json(
        { error: "Tidak dapat memesan jasa sendiri" },
        { status: 400 }
      )
    }

    const order = await prisma.order.create({
      // @ts-ignore - prisma handles string|number id for mongo/sqlite
      data: {
        customerId,
        serviceId: service.id,
        totalPrice: service.price,
        status: "PENDING",
        paymentMethod: validated.paymentMethod ?? null,
        orderNotes: validated.orderNotes ?? null,
        address: validated.address,
        deadline: validated.deadline ?? null,
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

  try {
    const customerId = toPrismaId(session.user.id) as unknown as number & string
    const orders = await prisma.order.findMany({
      // @ts-ignore
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
  } catch (error) {
    console.error("[orders] GET error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
