import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { toPrismaId, sameId } from "@/lib/ids"
import { RATE_LIMITS, enforceRateLimit } from "@/lib/api-guard"

export const dynamic = "force-dynamic"

const MESSAGE_MAX = 500

const createMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Pesan tidak boleh kosong")
    .max(MESSAGE_MAX, `Pesan maksimal ${MESSAGE_MAX} karakter`),
})

async function getOrderParticipant(orderId: string | number, userId: string | number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId } as unknown as { id: string | number } & { id: string },
    include: { service: { select: { providerId: true } } },
  })
  if (!order) return { error: "Pesanan tidak ditemukan", status: 404 }
  if (!sameId(order.customerId, userId) && !sameId(order.service.providerId, userId)) {
    return { error: "Forbidden: bukan peserta pesanan ini", status: 403 }
  }
  return { order }
}

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
    "messages-read",
    RATE_LIMITS.read,
    session.user.id
  )
  if (limited) return limited

  const { id } = await params
  const orderId = toPrismaId(id) as unknown as number & string
  if (!String(orderId).trim()) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 })
  }

  const userId = toPrismaId(session.user.id) as unknown as number & string
  const check = await getOrderParticipant(orderId, userId)
  if (!check.order) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const messages = await prisma.message.findMany({
    where: { orderId },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
    take: 200,
  })

  return NextResponse.json(messages)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const orderId = toPrismaId(id) as unknown as number & string
  if (!String(orderId).trim()) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 })
  }

  const userId = toPrismaId(session.user.id) as unknown as number & string
  const check = await getOrderParticipant(orderId, userId)
  if (!check.order) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const limited = enforceRateLimit(
    request,
    "message",
    RATE_LIMITS.message,
    session.user.id
  )
  if (limited) return limited

  try {
    const body = await request.json()
    const { content } = createMessageSchema.parse(body)

    const message = await prisma.message.create({
      data: {
        orderId,
        senderId: userId,
        content,
      },
      include: { sender: { select: { id: true, name: true } } },
    })

    return NextResponse.json(message, { status: 201 })
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
