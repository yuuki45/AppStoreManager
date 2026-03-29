"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/browser"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SidebarNav } from "@/components/sidebar"
import { LogOut, User, Menu } from "lucide-react"

interface HeaderProps {
  email: string
}

export function Header({ email }: HeaderProps) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const initials = email.slice(0, 2).toUpperCase()

  return (
    <header className="flex h-14 items-center justify-between border-b px-4 lg:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger className="rounded-md p-2 hover:bg-muted">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0">
            <div className="flex h-14 items-center border-b px-4">
              <Link
                href="/projects"
                className="text-lg font-semibold"
                onClick={() => setMobileOpen(false)}
              >
                App Store Manager
              </Link>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link href="/projects" className="text-lg font-semibold lg:hidden">
          App Store Manager
        </Link>
      </div>
      <div className="hidden lg:block" />
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted lg:px-3 lg:py-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{email}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <User className="mr-2 h-4 w-4" />
            設定
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
