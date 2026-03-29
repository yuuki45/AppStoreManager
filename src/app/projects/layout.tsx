import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/dashboard-shell"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return <DashboardShell email={user.email ?? ""}>{children}</DashboardShell>
}
