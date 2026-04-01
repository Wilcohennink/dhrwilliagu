"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Factory, Trophy, Sparkles } from "lucide-react"

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profit-factory", label: "Profit Factory", icon: Factory },
  { href: "/wall-of-glory", label: "Wall of Glory", icon: Trophy },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar-bg border-r border-card-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-card-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber to-purple flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">Wilco&apos;s Projects</h1>
            <p className="text-xs text-muted">Side Projects Dashboard</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-muted hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-card-border">
        <p className="text-xs text-muted">Powered by Paperclip</p>
      </div>
    </aside>
  )
}
