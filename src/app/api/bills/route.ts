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

async function fetchBills() {
  const bills = await prisma.bill.findMany({
    orderBy: { date: "desc" },
    include: {
      payer: true,
      items: { include: { assignedUser: true } },
      settlements: { include: { fromUser: true, toUser: true } },
    },
  })

  return bills.map((bill) => {
    const total = bill.items.reduce((acc, item) => acc + toNumber(item.amount), 0)
    const outstanding = bill.settlements
      .filter((s) => s.status === "pending")
      .reduce((acc, s) => acc + toNumber(s.amount), 0)
    const paid = bill.settlements
      .filter((s) => s.status === "paid")
      .reduce((acc, s) => acc + toNumber(s.amount), 0)

    return {
      ...bill,
      total,
      outstanding,
      paid,
    }
  })
}

export async function GET() {
  try {
    const bills = await fetchBills()
    return NextResponse.json(bills)
  } catch (error) {
    console.error("Failed to fetch bills:", error)
    return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
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

    const createdBill = await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.create({
        data: {
          title,
          date: new Date(date),
          payerId: Number(payerId),
        },
      })

      if (normalizedItems.length) {
        await tx.billItem.createMany({
          data: normalizedItems.map((item) => ({
            billId: bill.id,
            description: item.description,
            amount: item.amount,
            assignedUserId: item.assignedUserId,
          })),
        })
      }

      if (settlements.length) {
        await tx.settlement.createMany({
          data: settlements.map((s) => ({
            billId: bill.id,
            fromUserId: s.fromUserId,
            toUserId: s.toUserId,
            amount: s.amount,
            status: s.status,
          })),
        })
      }

      return bill
    })

    const billWithRelations = await prisma.bill.findUnique({
      where: { id: createdBill.id },
      include: {
        payer: true,
        items: { include: { assignedUser: true } },
        settlements: { include: { fromUser: true, toUser: true } },
      },
    })

    return NextResponse.json(billWithRelations, { status: 201 })
  } catch (error) {
    console.error("Failed to create bill:", error)
    return NextResponse.json({ error: "Failed to create bill" }, { status: 500 })
  }
}
