import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { RATE_LIMITS, enforceRateLimit } from "@/lib/api-guard"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const limited = enforceRateLimit(
    request,
    "notifications",
    RATE_LIMITS.notifications,
    session.user.id
  )
  if (limited) return limited

  const userId = parseInt(session.user.id, 10)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
  }

  // Provider: pesanan menunggu / sedang dikerjakan
  // Customer: pesanan sedang dikerjakan
  if (user.role === "PROVIDER" || user.role === "ADMIN") {
    const orders = await prisma.order.findMany({
      where: {
        service: { providerId: userId },
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      include: {
        service: { select: { title: true } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return NextResponse.json({
      count: orders.length,
      items: orders.map((o) => ({
        orderId: o.id,
        message:
          o.status === "PENDING"
            ? `Pesanan baru #${o.id}: ${o.service.title} — oleh ${o.customer.name ?? "Customer"}`
            : `Pesanan #${o.id} sedang Anda kerjakan`,
        time: `${Math.max(
          1,
          Math.round((Date.now() - o.createdAt.getTime()) / 3600000)
        )} jam lalu`,
      })),
    })
  }

  // Customer
  const orders = await prisma.order.findMany({
    where: {
      customerId: userId,
      status: { in: ["IN_PROGRESS", "COMPLETED"] },
    },
    include: { service: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  return NextResponse.json({
    count: orders.length,
    items: orders.map((o) => ({
      orderId: o.id,
      message:
        o.status === "IN_PROGRESS"
          ? `Pesanan #${o.id}: "${o.service.title}" sedang dikerjakan`
          : `Pesanan #${o.id}: "${o.service.title}" telah selesai`,
      time: `${Math.max(
        1,
        Math.round((Date.now() - o.createdAt.getTime()) / 3600000)
      )} jam lalu`,
    })),
  })
}
