import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const billId = Number(id)
    if (!billId) return NextResponse.json({ error: "Invalid bill id" }, { status: 400 })

    const body = await req.json()
    const { settlementId, status } = body || {}

    if (!settlementId || (status !== "pending" && status !== "paid")) {
      return NextResponse.json({ error: "settlementId and valid status are required" }, { status: 400 })
    }

    const updated = await prisma.settlement.update({
      where: { id: Number(settlementId) },
      data: { status },
      include: { fromUser: true, toUser: true },
    })

    if (updated.billId !== billId) {
      return NextResponse.json({ error: "Settlement does not belong to bill" }, { status: 400 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update settlement:", error)
    return NextResponse.json({ error: "Failed to update settlement" }, { status: 500 })
  }
}
