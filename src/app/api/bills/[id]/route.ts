import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function toNumber(value: any): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  return parseFloat(value.toString())
}

function computeSettlements(items: { assignedUserId: number; amount: number }[], payerId: number) {
  const totals: Record<number, number> = {}
  for (const item of items) {
    if (!item.assignedUserId || !item.amount) continue
    totals[item.assignedUserId] = (totals[item.assignedUserId] || 0) + item.amount
  }
  return Object.entries(totals)
    .filter(([userId]) => Number(userId) !== payerId)
    .map(([userId, amount]) => ({
      fromUserId: Number(userId),
      toUserId: payerId,
      amount,
      status: "pending" as const,
    }))
}

async function getBill(id: number) {
  return prisma.bill.findUnique({
    where: { id },
    include: {
      payer: true,
      items: { include: { assignedUser: true } },
      settlements: { include: { fromUser: true, toUser: true } },
    },
  })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params
    const id = Number(idStr)
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    const bill = await getBill(id)
    if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 })

    return NextResponse.json(bill)
  } catch (error) {
    console.error("Failed to fetch bill:", error)
    return NextResponse.json({ error: "Failed to fetch bill" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params
    const id = Number(idStr)
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    const body = await req.json()
    const { title, date, payerId, items } = body || {}

    if (!title || !date || !payerId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "title, date, payerId, and at least one item are required" },
        { status: 400 },
      )
    }

    const normalizedItems = items.map((item: any) => ({
      description: item.description ?? "",
      amount: Number(item.amount || 0),
      assignedUserId: Number(item.assignedUserId),
    }))
    const settlements = computeSettlements(normalizedItems, Number(payerId))

    await prisma.$transaction(async (tx) => {
      await tx.settlement.deleteMany({ where: { billId: id } })
      await tx.billItem.deleteMany({ where: { billId: id } })

      await tx.bill.update({
        where: { id },
        data: {
          title,
          date: new Date(date),
          payerId: Number(payerId),
        },
      })

      await tx.billItem.createMany({
        data: normalizedItems.map((item) => ({
          billId: id,
          description: item.description,
          amount: item.amount,
          assignedUserId: item.assignedUserId,
        })),
      })

      if (settlements.length) {
        await tx.settlement.createMany({
          data: settlements.map((s) => ({
            billId: id,
            fromUserId: s.fromUserId,
            toUserId: s.toUserId,
            amount: s.amount,
            status: s.status,
          })),
        })
      }
    })

    const updated = await getBill(id)
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update bill:", error)
    return NextResponse.json({ error: "Failed to update bill" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params
    const id = Number(idStr)
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    await prisma.bill.delete({ where: { id } })
    return NextResponse.json({}, { status: 204 })
  } catch (error) {
    console.error("Failed to delete bill:", error)
    return NextResponse.json({ error: "Failed to delete bill" }, { status: 500 })
  }
}
