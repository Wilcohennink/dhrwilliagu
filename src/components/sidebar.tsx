'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, ListTodo, MessageSquare,
  Building2, ShoppingBag,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/taken', label: 'Taken', icon: ListTodo },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-background border-r border-card-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-card-border">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green/20 to-green/5 border border-green/20 flex items-center justify-center transition-all group-hover:border-green/40 group-hover:shadow-lg group-hover:shadow-green/10">
            <span className="text-lg font-bold text-green">K</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">KSH</h1>
            <p className="text-[10px] text-muted tracking-wider">Virtual Office</p>
          </div>
        </Link>
      </div>

      {/* Brand badges */}
      <div className="px-4 py-3 border-b border-card-border">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-navy-light/30 border border-navy-light/20">
            <Building2 className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] text-blue-300 font-medium">B2B</span>
          </div>
          <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/10">
            <ShoppingBag className="w-3 h-3 text-orange-400" />
            <span className="text-[10px] text-orange-300 font-medium">B2C</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <p className="text-[10px] text-muted uppercase tracking-widest font-medium px-3 py-2">Navigatie</p>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                active
                  ? 'text-white bg-green/10 border border-green/20 shadow-sm shadow-green/5'
                  : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-green' : ''}`} />
              {item.label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green" />}
            </Link>
          )
        })}
      </nav>

      {/* Status indicator */}
      <div className="p-4 border-t border-card-border">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green/5 border border-green/10">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
          <span className="text-[11px] text-green font-medium">Paperclip Online</span>
        </div>
        <p className="text-[9px] text-muted text-center mt-2">Powered by Paperclip AI</p>
      </div>
    </aside>
  )
}
