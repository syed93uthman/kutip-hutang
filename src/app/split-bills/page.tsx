"use client"

import { useEffect, useMemo, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { UserDebtView } from "@/components/user-debt-view"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface User {
  id: number
  name: string
  phone: string
}

interface BillItemInput {
  tempId: string
  description: string
  amount: string
  assignedUserId: string
}

interface Settlement {
  id: number
  fromUserId: number
  toUserId: number
  amount: string | number
  status: "pending" | "paid"
  fromUser?: User
  toUser?: User
}

interface BillItem {
  id: number
  description: string
  amount: string | number
  assignedUserId: number
  assignedUser?: User
}

interface Bill {
  id: number
  title: string
  date: string
  payerId: number
  payer?: User
  items: BillItem[]
  settlements: Settlement[]
  total?: number
  outstanding?: number
  paid?: number
}

const fmtRM = (value: number | string) => `RM ${Number(value || 0).toFixed(2)}`

export default function SplitBillsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [title, setTitle] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [payerId, setPayerId] = useState<string>("")
  const [items, setItems] = useState<BillItemInput[]>([
    { tempId: crypto.randomUUID(), description: "", amount: "", assignedUserId: "" },
  ])

  const payer = useMemo(() => users.find((u) => String(u.id) === payerId), [users, payerId])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [usersRes, billsRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/bills"),
        ])
        if (!usersRes.ok) throw new Error("Failed to load users")
        if (!billsRes.ok) throw new Error("Failed to load bills")
        const usersData = await usersRes.json()
        const billsData = await billsRes.json()
        setUsers(usersData)
        setBills(billsData)
        if (usersData.length > 0) {
          setPayerId(String(usersData[0].id))
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const refreshBills = async () => {
    try {
      const res = await fetch("/api/bills")
      if (!res.ok) throw new Error("Failed to refresh bills")
      const data = await res.json()
      setBills(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to refresh bills")
    }
  }

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { tempId: crypto.randomUUID(), description: "", amount: "", assignedUserId: "" },
    ])
  }

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.tempId !== id))
  }

  const handleItemChange = (id: string, field: keyof BillItemInput, value: string) => {
    setItems((prev) => prev.map((item) => (item.tempId === id ? { ...item, [field]: value } : item)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !date || !payerId) {
      toast.error("Please fill in title, date, and payer")
      return
    }
    if (!items.length || items.some((i) => !i.description || !i.amount || !i.assignedUserId)) {
      toast.error("Please fill all item rows")
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        title,
        date,
        payerId: Number(payerId),
        items: items.map((i) => ({
          description: i.description,
          amount: Number(i.amount),
          assignedUserId: Number(i.assignedUserId),
        })),
      }
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to create bill")
      }
      toast.success("Bill created")
      setTitle("")
      setDate(new Date().toISOString().slice(0, 10))
      setItems([{ tempId: crypto.randomUUID(), description: "", amount: "", assignedUserId: "" }])
      await refreshBills()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create bill")
    } finally {
      setSubmitting(false)
    }
  }

  const toggleSettlement = async (billId: number, settlementId: number, status: "pending" | "paid") => {
    try {
      const res = await fetch(`/api/bills/${billId}/settlements`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settlementId, status }),
      })
      if (!res.ok) throw new Error("Failed to update settlement")
      toast.success(`Settlement marked ${status}`)
      await refreshBills()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update settlement")
    }
  }

  const globalBalances = useMemo(() => {
    const balances: Record<number, number> = {}
    bills.forEach((bill) => {
      bill.settlements.forEach((s) => {
        if (s.status !== "pending") return
        const amount = Number(s.amount || 0)
        balances[s.fromUserId] = (balances[s.fromUserId] || 0) - amount
        balances[s.toUserId] = (balances[s.toUserId] || 0) + amount
      })
    })
    return balances
  }, [bills])

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Split Bills</h2>
                  <p className="text-muted-foreground">
                    Itemized RM bills with per-user settlements and global balances.
                  </p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Create Bill</CardTitle>
                  <CardDescription>Itemized entries; settlements per user to payer.</CardDescription>
                </CardHeader>
                <CardContent>
                  {!users.length ? (
                    <p className="text-sm text-muted-foreground">Add users first to create bills.</p>
                  ) : (
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lunch Bills" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Payer</Label>
                          <Select value={payerId} onValueChange={setPayerId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payer" />
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
                      </div>

                      <div className="space-y-2">
                        <Label>Items</Label>
                        <div className="space-y-3">
                          {items.map((item, idx) => (
                            <div key={item.tempId} className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] items-end">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Description</Label>
                                <Input
                                  value={item.description}
                                  onChange={(e) => handleItemChange(item.tempId, "description", e.target.value)}
                                  placeholder={`Item ${idx + 1}`}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Amount (RM)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.amount}
                                  onChange={(e) => handleItemChange(item.tempId, "amount", e.target.value)}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Assigned User</Label>
                                <Select
                                  value={item.assignedUserId}
                                  onValueChange={(v) => handleItemChange(item.tempId, "assignedUserId", v)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select" />
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
                              <div className="flex gap-2">
                                {items.length > 1 && (
                                  <Button variant="outline" type="button" onClick={() => handleRemoveItem(item.tempId)}>
                                    Remove
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                          <Button type="button" variant="secondary" onClick={handleAddItem}>
                            Add Item
                          </Button>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" disabled={submitting}>
                          {submitting ? "Saving..." : "Save Bill"}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bills</CardTitle>
                  <CardDescription>Per-bill settlements (RM) and itemized breakdowns.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : !bills.length ? (
                    <p className="text-sm text-muted-foreground">No bills yet.</p>
                  ) : (
                    bills.map((bill) => (
                      <div key={bill.id} className="rounded-lg border p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold text-lg">{bill.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(bill.date).toLocaleDateString()} • Payer: {bill.payer?.name}
                            </div>
                          </div>
                          <div className="flex gap-3 text-sm">
                            <Badge variant="secondary">Total: {fmtRM(bill.total ?? 0)}</Badge>
                            <Badge variant="outline">Outstanding: {fmtRM(bill.outstanding ?? 0)}</Badge>
                            <Badge variant="default">Paid: {fmtRM(bill.paid ?? 0)}</Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Items</div>
                          <div className="space-y-1 text-sm">
                            {bill.items.map((item) => (
                              <div key={item.id} className="flex justify-between border rounded px-3 py-2">
                                <div>
                                  <div className="font-medium">{item.description}</div>
                                  <div className="text-muted-foreground text-xs">
                                    Assigned to {item.assignedUser?.name}
                                  </div>
                                </div>
                                <div className="font-semibold">{fmtRM(item.amount)}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Settlements (per user → payer)</div>
                          <div className="space-y-2 text-sm">
                            {bill.settlements.map((s) => (
                              <div key={s.id} className="flex items-center justify-between border rounded px-3 py-2">
                                <div>
                                  <div className="font-medium">
                                    {s.fromUser?.name} → {s.toUser?.name}
                                  </div>
                                  <div className="text-muted-foreground text-xs">{fmtRM(s.amount)}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={s.status === "paid" ? "default" : "outline"}>
                                    {s.status === "paid" ? "Paid" : "Pending"}
                                  </Badge>
                                  {s.status === "pending" ? (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => toggleSettlement(bill.id, s.id, "paid")}
                                    >
                                      Mark paid
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => toggleSettlement(bill.id, s.id, "pending")}
                                    >
                                      Undo
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Global Balances</CardTitle>
                  <CardDescription>Net owed/owing across all bills (RM).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {users.map((u) => {
                    const balance = globalBalances[u.id] || 0
                    return (
                      <div key={u.id} className="flex justify-between border rounded px-3 py-2">
                        <div className="font-medium">{u.name}</div>
                        <div className={balance >= 0 ? "text-emerald-600" : "text-amber-600"}>
                          {balance >= 0 ? `Receives ${fmtRM(balance)}` : `Owes ${fmtRM(Math.abs(balance))}`}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <UserDebtView users={users} onRefresh={refreshBills} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
