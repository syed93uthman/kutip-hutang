"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface User {
  id: number
  name: string
  phone: string
}

interface Settlement {
  id: number
  billId: number
  fromUserId: number
  toUserId: number
  amount: string | number
  status: "pending" | "paid"
  fromUser?: User
  toUser?: User
  bill?: {
    id: number
    title: string
    date: string
  }
}

const fmtRM = (value: number | string) => `RM ${Number(value || 0).toFixed(2)}`

interface UserDebtViewProps {
  users: User[]
  onRefresh: () => void
}

export function UserDebtView({ users, onRefresh }: UserDebtViewProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(String(users[0].id))
    }
  }, [users, selectedUserId])

  useEffect(() => {
    if (!selectedUserId) return
    loadSettlements()
  }, [selectedUserId])

  const loadSettlements = async () => {
    if (!selectedUserId) return
    try {
      setLoading(true)
      const res = await fetch("/api/bills")
      if (!res.ok) throw new Error("Failed to load bills")
      const bills = await res.json()
      
      const allSettlements: Settlement[] = []
      bills.forEach((bill: any) => {
        bill.settlements?.forEach((s: Settlement) => {
          allSettlements.push({
            ...s,
            bill: {
              id: bill.id,
              title: bill.title,
              date: bill.date,
            },
          })
        })
      })

      const userSettlements = allSettlements.filter(
        (s) => s.fromUserId === Number(selectedUserId) || s.toUserId === Number(selectedUserId)
      )
      setSettlements(userSettlements)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load settlements")
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async (billId: number, settlementId: number) => {
    try {
      const res = await fetch(`/api/bills/${billId}/settlements`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settlementId, status: "paid" }),
      })
      if (!res.ok) throw new Error("Failed to mark as paid")
      toast.success("Payment marked as paid")
      await loadSettlements()
      onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark payment")
    }
  }

  const toPay = settlements.filter((s) => s.fromUserId === Number(selectedUserId) && s.status === "pending")
  const toReceive = settlements.filter((s) => s.toUserId === Number(selectedUserId) && s.status === "pending")
  const paidOut = settlements.filter((s) => s.fromUserId === Number(selectedUserId) && s.status === "paid")
  const received = settlements.filter((s) => s.toUserId === Number(selectedUserId) && s.status === "paid")

  const totalToPay = toPay.reduce((acc, s) => acc + Number(s.amount || 0), 0)
  const totalToReceive = toReceive.reduce((acc, s) => acc + Number(s.amount || 0), 0)

  if (!users.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Debts & Payments</CardTitle>
          <CardDescription>No users available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Debts & Payments</CardTitle>
        <CardDescription>View and manage your debts by selecting a user</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select User</label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-3 space-y-1">
                <div className="text-sm text-muted-foreground">Total to Pay</div>
                <div className="text-2xl font-bold text-amber-600">{fmtRM(totalToPay)}</div>
              </div>
              <div className="rounded-lg border p-3 space-y-1">
                <div className="text-sm text-muted-foreground">Total to Receive</div>
                <div className="text-2xl font-bold text-emerald-600">{fmtRM(totalToReceive)}</div>
              </div>
            </div>

            {toPay.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold">Pending Payments (You Owe)</div>
                <div className="space-y-2">
                  {toPay.map((s) => (
                    <div key={s.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-sm">{s.bill?.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(s.bill?.date || "").toLocaleDateString()} • Pay to {s.toUser?.name}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-amber-600">
                          {fmtRM(s.amount)}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => markAsPaid(s.billId, s.id)}
                        className="w-full"
                      >
                        Mark as Paid
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {toReceive.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold">Pending Receipts (You Receive)</div>
                <div className="space-y-2">
                  {toReceive.map((s) => (
                    <div key={s.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-sm">{s.bill?.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(s.bill?.date || "").toLocaleDateString()} • From {s.fromUser?.name}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-emerald-600">
                          {fmtRM(s.amount)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {paidOut.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold">Paid Payments</div>
                <div className="space-y-2">
                  {paidOut.map((s) => (
                    <div key={s.id} className="rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-sm">{s.bill?.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(s.bill?.date || "").toLocaleDateString()} • Paid to {s.toUser?.name}
                          </div>
                        </div>
                        <Badge variant="default">{fmtRM(s.amount)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {toPay.length === 0 && toReceive.length === 0 && paidOut.length === 0 && received.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No settlements found for this user.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
