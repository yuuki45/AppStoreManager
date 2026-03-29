"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

interface DashboardShellProps {
  email: string
  children: React.ReactNode
}

export function DashboardShell({ email, children }: DashboardShellProps) {
  return (
    <div className="flex h-dvh">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-0">
        <Header email={email} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
