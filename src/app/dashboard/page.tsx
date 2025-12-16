"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { UserForm } from "@/components/user-form"
import { UserTable } from "@/components/user-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function Page() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUserSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                  <p className="text-muted-foreground">
                    Manage users for debt tracking
                  </p>
                </div>
                <UserForm onSuccess={handleUserSuccess} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>User List</CardTitle>
                  <CardDescription>
                    All users in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserTable refreshTrigger={refreshTrigger} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
