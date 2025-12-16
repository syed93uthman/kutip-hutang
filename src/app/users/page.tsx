"use client";

import { useState } from "react";
import { UserForm } from "@/components/user-form";
import { UserTable } from "@/components/user-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UsersPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUserSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
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
  );
}
