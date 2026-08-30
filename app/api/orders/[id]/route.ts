import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { computeRatingAggregate } from "@/lib/rating"
import {
  ORDER_STATUSES,
  canTransition,
  isOrderStatus,
  transitionError,
  type OrderStatus,
} from "@/lib/order-status"
import { RATE_LIMITS, enforceRateLimit } from "@/lib/api-guard"
import { toPrismaId, sameId } from "@/lib/ids"

export const dynamic = "force-dynamic"

const statusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const limited = enforceRateLimit(
    request,
    "order-read",
    RATE_LIMITS.read,
    session.user.id
  )
  if (limited) return limited

  const { id } = await params
  if (!id || String(id).trim() === "") {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 })
  }
  const orderId = toPrismaId(String(id).trim()) as unknown as number & string
  if (!/^[0-9a-f]{24}$|^\d+$/.test(String(orderId))) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId } as unknown as { id: string | number } & { id: string },
    include: {
      customer: { select: { id: true, name: true, avatarUrl: true } },
      service: {
        include: {
          provider: { select: { id: true, name: true, avatarUrl: true } },
          category: { select: { name: true } },
        },
      },
      reviews: {
        include: { reviewer: { select: { id: true, name: true } } },
      },
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 })
  }

  const userId = toPrismaId(session.user.id) as unknown as number & string
  const isCustomer = sameId(order.customerId, userId)
  const isProvider = sameId(order.service.providerId, userId)
  if (!isCustomer && !isProvider) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(order)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  if (!id || String(id).trim() === "") {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 })
  }
  const orderId = toPrismaId(String(id).trim()) as unknown as number & string
  if (!/^[0-9a-f]{24}$|^\d+$/.test(String(orderId))) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 })
  }

  const limited = enforceRateLimit(
    request,
    "order-mutate",
    RATE_LIMITS.orderMutate,
    session.user.id
  )
  if (limited) return limited

  try {
    const body = await request.json()
    const { status } = statusSchema.parse(body)

    const order = await prisma.order.findUnique({
      where: { id: orderId } as unknown as { id: string | number } & { id: string },
      include: { service: { select: { providerId: true } } },
    })

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 })
    }

    const userId = toPrismaId(session.user.id) as unknown as number & string
    const isProvider = sameId(order.service.providerId, userId)
    const isCustomer = sameId(order.customerId, userId)

    if (!isProvider && !isCustomer) {
      return NextResponse.json(
        { error: "Forbidden: bukan pihak dalam pesanan ini" },
        { status: 403 }
      )
    }

    // Pelanggan hanya boleh membatalkan pesanan yang belum dikonfirmasi.
    if (!isProvider && status !== "CANCELLED") {
      return NextResponse.json(
        { error: "Pelanggan hanya dapat membatalkan pesanan" },
        { status: 403 }
      )
    }

    if (!isOrderStatus(order.status)) {
      return NextResponse.json(
        { error: "Status pesanan tersimpan tidak dikenal" },
        { status: 500 }
      )
    }

    const current: OrderStatus = order.status
    if (!canTransition(current, status)) {
      return NextResponse.json(
        { error: transitionError(current, status) },
        { status: 409 }
      )
    }

    // Update + agregat dalam transaksi untuk mencegah race (P0-3)
    // Menggunakan updateMany dengan where status:current untuk optimistic locking; jika count 0 berarti race.
    const updated = await prisma.$transaction(async (tx) => {
      // @ts-ignore - handle string|number id for mongo/sqlite
      const res = await (tx.order as unknown as { updateMany: (args: unknown) => Promise<{ count: number }> }).updateMany({
        where: { id: orderId, status: current },
        data:
          status === "COMPLETED"
            ? { status, completedAt: new Date() }
            : { status },
      })
      if (res.count === 0) {
        throw Object.assign(new Error("Conflict: status sudah berubah"), { code: "CONFLICT" })
      }
      const ord = await tx.order.findUnique({
        where: { id: orderId } as unknown as { id: string | number } & { id: string },
      })
      if (!ord) throw new Error("Pesanan tidak ditemukan setelah update")
      if (status === "COMPLETED") {
        const service = await tx.service.findUnique({
          where: { id: ord.serviceId },
          include: {
            orders: {
              where: { status: "COMPLETED" },
              include: { reviews: true },
            },
          },
        })
        if (service) {
          const reviews = service.orders.flatMap((o) => o.reviews)
          const agg = computeRatingAggregate(reviews)
          await tx.service.update({
            where: { id: service.id },
            data: agg,
          })
        }
      }
      return ord
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      )
    }
    if ((error as unknown as { code?: string })?.code === "CONFLICT") {
      return NextResponse.json(
        { error: "Conflict: status pesanan sudah berubah, silakan muat ulang" },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
