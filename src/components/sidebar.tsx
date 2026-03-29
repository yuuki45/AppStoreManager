"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Link2,
  AppWindow,
  FolderOpen,
  Settings,
  BookOpen,
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/projects", label: "プロジェクト", icon: FolderOpen },
  { href: "/apps", label: "App 選択", icon: AppWindow },
  { href: "/connections", label: "Apple 接続", icon: Link2 },
  { href: "/tutorial", label: "チュートリアル", icon: BookOpen },
  { href: "/settings", label: "設定", icon: Settings },
]

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-1 p-3">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/projects"
            ? pathname === "/projects" || pathname.startsWith("/projects/")
            : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-60 flex-col border-r bg-muted/40 lg:flex">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/projects" className="text-lg font-semibold">
          App Store Manager
        </Link>
      </div>
      <SidebarNav />
    </aside>
  )
}
