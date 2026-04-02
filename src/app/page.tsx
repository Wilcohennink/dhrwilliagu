'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, AlertTriangle, Bot, CircleDot,
  ArrowRight, Crown, Loader2, RefreshCw,
} from 'lucide-react'
import { COMPANIES, type CompanyConfig } from '@/lib/companies'
import { paperclip, type Company, type Agent, type Issue } from '@/lib/paperclip'

// Company slugs voor de 4 kaarten (excl board)
const GRID_SLUGS = ['the', 'rev', 'ksh', 'dos'] as const

interface CompanyData {
  config: CompanyConfig
  company: Company | null
  agents: Agent[]
  issues: Issue[]
  error?: string
}

interface HumanTask {
  issue: Issue
  companyConfig: CompanyConfig
  companyName: string
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function formatDate(): string {
  return new Intl.DateTimeFormat('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function priorityWeight(p: string): number {
  switch (p) {
    case 'urgent': return 0
    case 'high': return 1
    case 'medium': return 2
    default: return 3
  }
}

function priorityColor(p: string): string {
  switch (p) {
    case 'urgent': return 'text-danger'
    case 'high': return 'text-warning'
    case 'medium': return 'text-blue'
    default: return 'text-muted'
  }
}

function priorityLabel(p: string): string {
  switch (p) {
    case 'urgent': return 'Urgent'
    case 'high': return 'Hoog'
    case 'medium': return 'Normaal'
    default: return 'Laag'
  }
}

export default function CommandCenterPage() {
  const [companyData, setCompanyData] = useState<Record<string, CompanyData>>({})
  const [boardData, setBoardData] = useState<CompanyData | null>(null)
  const [humanTasks, setHumanTasks] = useState<HumanTask[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const loadData = useCallback(async () => {
    try {
      // Haal alle companies op van Paperclip en match op prefix
      const apiCompanies = await paperclip.getCompanies()
      const prefixMap = new Map<string, Company>()
      for (const c of apiCompanies) {
        prefixMap.set(c.issuePrefix, c)
      }

      const allTasks: HumanTask[] = []
      const dataMap: Record<string, CompanyData> = {}

      // Laad data voor elke grid company
      const allSlugs = [...GRID_SLUGS, 'board'] as const
      await Promise.all(
        allSlugs.map(async (slug) => {
          const config = COMPANIES[slug]
          if (!config) return

          const matched = prefixMap.get(config.prefix)
          if (!matched) {
            const entry: CompanyData = { config, company: null, agents: [], issues: [], error: 'Niet geconfigureerd' }
            if (slug === 'board') {
              setBoardData(entry)
            } else {
              dataMap[slug] = entry
            }
            return
          }

          try {
            const [agents, issues] = await Promise.all([
              paperclip.getAgents(matched.id),
              paperclip.getIssues(matched.id),
            ])

            const entry: CompanyData = { config, company: matched, agents, issues }

            if (slug === 'board') {
              setBoardData(entry)
            } else {
              dataMap[slug] = entry
            }

            // Zoek taken die menselijke aandacht nodig hebben
            for (const issue of issues) {
              const needsHuman =
                issue.labels.some(l => l.toLowerCase().includes('needs-human')) ||
                issue.status === 'blocked'
              if (needsHuman) {
                allTasks.push({ issue, companyConfig: config, companyName: config.name })
              }
            }
          } catch {
            const entry: CompanyData = { config, company: matched, agents: [], issues: [], error: 'Fout bij laden' }
            if (slug === 'board') {
              setBoardData(entry)
            } else {
              dataMap[slug] = entry
            }
          }
        }),
      )

      // Sorteer taken op prioriteit
      allTasks.sort((a, b) => priorityWeight(a.issue.priority) - priorityWeight(b.issue.priority))

      setCompanyData(dataMap)
      setHumanTasks(allTasks)
      setLastRefresh(new Date())
    } catch {
      // Silently handle — data stays empty
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30_000)
    return () => clearInterval(interval)
  }, [loadData])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-muted animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-card-border flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Wiliagu Holding — Command Center</h1>
            <p className="text-muted text-sm capitalize">{formatDate()}</p>
          </div>
        </div>
        <button
          onClick={() => { setLoading(true); loadData() }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-card-border text-muted text-xs hover:text-white hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {lastRefresh.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
        </button>
      </div>

      {/* Mijn Taken */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Mijn Taken
        </h2>
        {humanTasks.length === 0 ? (
          <div className="bg-card-bg border border-card-border rounded-xl p-6 text-center">
            <p className="text-muted text-sm">Geen taken voor jou</p>
          </div>
        ) : (
          <div className="space-y-2">
            {humanTasks.map((t) => (
              <div
                key={t.issue.id}
                className="bg-card-bg border border-card-border rounded-xl px-5 py-3 flex items-center gap-4 hover:bg-card-hover transition-colors"
              >
                <span className={`text-xs font-bold uppercase ${priorityColor(t.issue.priority)}`}>
                  {priorityLabel(t.issue.priority)}
                </span>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: t.companyConfig.color }}
                />
                <span className="text-xs text-muted font-mono">{t.issue.identifier}</span>
                <span className="text-sm text-white flex-1 truncate">{t.issue.title}</span>
                <span className="text-xs text-muted">{t.companyName}</span>
                {t.issue.status === 'blocked' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-danger/20 text-danger">Blocked</span>
                )}
                {t.issue.labels.some(l => l.toLowerCase().includes('needs-human')) && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/20 text-warning">Needs Human</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Company Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {GRID_SLUGS.map((slug) => {
          const data = companyData[slug]
          const config = COMPANIES[slug]
          if (!config) return null

          const runningAgents = data?.agents.filter(a => a.status === 'running').length ?? 0
          const totalAgents = data?.agents.length ?? 0
          const openIssues = data?.issues.filter(i => !['done', 'cancelled'].includes(i.status)).length ?? 0
          const budgetTotal = data?.company?.budgetMonthlyCents ?? 0
          const budgetSpent = data?.company?.spentMonthlyCents ?? 0
          const budgetPct = budgetTotal > 0 ? Math.min((budgetSpent / budgetTotal) * 100, 100) : 0
          const notConfigured = data?.error === 'Niet geconfigureerd'

          return (
            <Link
              key={slug}
              href={`/${slug}`}
              className="bg-card-bg border border-card-border rounded-xl p-5 hover:bg-card-hover transition-colors group block"
            >
              {/* Company Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <h3 className="text-base font-semibold text-white">{config.name}</h3>
                </div>
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-white transition-colors" />
              </div>

              {notConfigured ? (
                <p className="text-sm text-muted italic">Niet geconfigureerd in Paperclip</p>
              ) : (
                <>
                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-muted" />
                      <span className="text-sm text-muted-foreground">
                        <span className="text-white font-medium">{runningAgents}</span>/{totalAgents} agents
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CircleDot className="w-4 h-4 text-muted" />
                      <span className="text-sm text-muted-foreground">
                        <span className="text-white font-medium">{openIssues}</span> open issues
                      </span>
                    </div>
                  </div>

                  {/* Budget Bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted">Budget</span>
                      <span className="text-muted-foreground">
                        {formatCents(budgetSpent)} / {formatCents(budgetTotal)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${budgetPct}%`,
                          backgroundColor: budgetPct > 90 ? 'var(--danger)' : config.color,
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </Link>
          )
        })}
      </div>

      {/* Board of Directors Summary */}
      <div className="bg-card-bg border border-card-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-silver" />
            <h3 className="text-base font-semibold text-white">Board of Directors</h3>
          </div>
          <Link
            href="/board"
            className="text-xs text-muted hover:text-white transition-colors flex items-center gap-1"
          >
            Bekijken <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!boardData || boardData.error ? (
          <p className="text-sm text-muted italic">{boardData?.error ?? 'Niet geconfigureerd in Paperclip'}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Agents */}
            <div>
              <p className="text-xs text-muted mb-2">Agents</p>
              <div className="space-y-1.5">
                {boardData.agents.length === 0 ? (
                  <p className="text-xs text-muted italic">Geen agents</p>
                ) : (
                  boardData.agents.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-center justify-between">
                      <span className="text-sm text-white">{a.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        a.status === 'running' ? 'bg-success/20 text-success' :
                        a.status === 'error' ? 'bg-danger/20 text-danger' :
                        'bg-white/10 text-muted'
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Open Issues */}
            <div>
              <p className="text-xs text-muted mb-2">Open Issues</p>
              <p className="text-2xl font-bold text-white">
                {boardData.issues.filter(i => !['done', 'cancelled'].includes(i.status)).length}
              </p>
            </div>

            {/* Budget */}
            <div>
              <p className="text-xs text-muted mb-2">Budget</p>
              <p className="text-sm text-white font-medium">
                {formatCents(boardData.company?.spentMonthlyCents ?? 0)}
                <span className="text-muted"> / {formatCents(boardData.company?.budgetMonthlyCents ?? 0)}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
