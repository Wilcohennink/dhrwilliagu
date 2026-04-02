'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Crown, Trophy, Rocket, Building2, ShoppingBag,
  Brain, Users, ListTodo, ChevronDown, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  color?: string
  children?: { href: string; label: string; icon: React.ElementType }[]
}

const navItems: NavItem[] = [
  { href: '/', label: 'Command Center', icon: LayoutDashboard },
  {
    href: '/board', label: 'Board of Directors', icon: Crown, color: '#C0C0C0',
    children: [
      { href: '/board', label: 'Overzicht', icon: LayoutDashboard },
      { href: '/board/meeting', label: 'Board Meeting', icon: Users },
    ],
  },
  {
    href: '/the', label: 'Wall of Glory', icon: Trophy, color: '#D4AF37',
    children: [
      { href: '/the', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/the/brainstorm', label: 'Brainstorm', icon: Brain },
      { href: '/the/team', label: 'Team', icon: Users },
    ],
  },
  {
    href: '/rev', label: 'Revenue Lab', icon: Rocket, color: '#22C55E',
    children: [
      { href: '/rev', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/rev/brainstorm', label: 'Brainstorm', icon: Brain },
      { href: '/rev/team', label: 'Team', icon: Users },
    ],
  },
  {
    href: '/ksh', label: 'KSH', icon: Building2, color: '#3B82F6',
    children: [
      { href: '/ksh', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/ksh/team', label: 'Team', icon: Users },
    ],
  },
  {
    href: '/dos', label: 'Officestunter', icon: ShoppingBag, color: '#F97316',
    children: [
      { href: '/dos', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dos/team', label: 'Team', icon: Users },
    ],
  },
  { href: '/tasks', label: 'Mijn Taken', icon: ListTodo, color: '#EF4444' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleExpand = (href: string) => {
    setExpanded(prev => ({ ...prev, [href]: !prev[href] }))
  }

  const isActive = (href: string) => pathname === href
  const isInSection = (href: string) => pathname.startsWith(href) && href !== '/'

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-sidebar-bg border-r border-card-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-card-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-base font-bold text-white">W</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-wide">WILIAGU</h1>
            <p className="text-[10px] text-muted uppercase tracking-widest">Holding B.V.</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const inSection = isInSection(item.href)
          const isOpen = expanded[item.href] ?? inSection

          if (item.children) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => toggleExpand(item.href)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    inSection ? 'text-white bg-white/5' : 'text-muted-foreground hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" style={item.color ? { color: item.color } : undefined} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-muted" />}
                </button>
                {isOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-card-border pl-3">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon
                      const childActive = isActive(child.href)
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] transition-colors ${
                            childActive ? 'text-white bg-white/10' : 'text-muted hover:text-muted-foreground hover:bg-white/5'
                          }`}
                        >
                          <ChildIcon className="w-3.5 h-3.5" />
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                active ? 'text-white bg-white/10' : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" style={item.color ? { color: item.color } : undefined} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-card-border">
        <p className="text-[10px] text-muted text-center">Powered by Paperclip AI</p>
      </div>
    </aside>
  )
}
