'use client'

import { useEffect, useState, useCallback } from 'react'
import { ListTodo, CheckCircle2, AlertTriangle, Clock, Check, Building2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { paperclip, type Issue, type Company } from '@/lib/paperclip'
import { COMPANIES, type CompanyConfig } from '@/lib/companies'

const PRIORITY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  urgent:  { label: 'Hoog',   color: 'text-red-400',    bg: 'bg-red-500/15' },
  high:    { label: 'Hoog',   color: 'text-red-400',    bg: 'bg-red-500/15' },
  medium:  { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  low:     { label: 'Laag',   color: 'text-zinc-400',   bg: 'bg-zinc-500/15' },
  none:    { label: 'Laag',   color: 'text-zinc-400',   bg: 'bg-zinc-500/15' },
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'Zojuist'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m geleden`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}u geleden`
  const days = Math.floor(hours / 24)
  return `${days}d geleden`
}

interface TaskWithCompany extends Issue {
  companyConfig: CompanyConfig
  paperclipCompanyId: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithCompany[]>([])
  const [recentDone, setRecentDone] = useState<TaskWithCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<Record<string, boolean>>({})

  const fetchTasks = useCallback(async () => {
    try {
      const companies = await paperclip.getCompanies()
      const allTasks: TaskWithCompany[] = []
      const allDone: TaskWithCompany[] = []

      for (const company of companies) {
        // Match to local config by prefix
        const config = Object.values(COMPANIES).find(c => c.prefix === company.issuePrefix)
        if (!config) continue

        const issues = await paperclip.getIssues(company.id)

        for (const issue of issues) {
          const enriched: TaskWithCompany = {
            ...issue,
            companyConfig: config,
            paperclipCompanyId: company.id,
          }

          const needsHuman = issue.labels?.includes('needs-human')
          const hasWilco = issue.title?.toLowerCase().includes('wilco')
          const isLocalBoard = issue.assigneeAgentId === 'local-board'
          const isPending = issue.status === 'todo' || issue.status === 'blocked'

          if ((needsHuman || hasWilco || (isLocalBoard && isPending)) && issue.status !== 'done' && issue.status !== 'cancelled') {
            allTasks.push(enriched)
          }

          // Recent done with needs-human label
          if (issue.status === 'done' && needsHuman) {
            allDone.push(enriched)
          }
        }
      }

      // Sort tasks: blocked first, then by priority, then by date
      const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 }
      allTasks.sort((a, b) => {
        if (a.status === 'blocked' && b.status !== 'blocked') return -1
        if (b.status === 'blocked' && a.status !== 'blocked') return 1
        return (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
      })

      // Sort done by completion, take last 5
      allDone.sort((a, b) => new Date(b.completedAt || b.updatedAt).getTime() - new Date(a.completedAt || a.updatedAt).getTime())

      setTasks(allTasks)
      setRecentDone(allDone.slice(0, 5))
    } catch {
      toast.error('Fout bij ophalen taken')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
    const interval = setInterval(fetchTasks, 30000)
    return () => clearInterval(interval)
  }, [fetchTasks])

  async function handleComplete(task: TaskWithCompany) {
    setCompleting(prev => ({ ...prev, [task.id]: true }))
    try {
      await paperclip.updateIssue(task.id, { status: 'done' })
      toast.success(`${task.identifier} afgerond`)
      await fetchTasks()
    } catch {
      toast.error(`Fout bij afronden ${task.identifier}`)
    } finally {
      setCompleting(prev => ({ ...prev, [task.id]: false }))
    }
  }

  // Group tasks by company
  const grouped = tasks.reduce<Record<string, TaskWithCompany[]>>((acc, task) => {
    const key = task.companyConfig.slug
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {})

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <ListTodo className="w-7 h-7 text-red-400" />
          Mijn Takenpakket
        </h1>
        <p className="text-muted text-sm mt-1">Taken die het AI team niet zelf kan uitvoeren</p>
      </div>

      {loading ? (
        <div className="bg-card-bg border border-card-border rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-muted mx-auto mb-3 animate-spin" />
          <p className="text-muted text-sm">Taken laden uit alle bedrijven...</p>
        </div>
      ) : tasks.length === 0 ? (
        /* No tasks - all good */
        <div className="bg-card-bg border border-card-border rounded-xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-1">Alles loopt op rolletjes</h2>
          <p className="text-muted text-sm">Er zijn geen taken die je aandacht vereisen</p>
        </div>
      ) : (
        /* Task groups */
        <div className="space-y-6">
          {Object.entries(grouped).map(([slug, companyTasks]) => {
            const config = companyTasks[0].companyConfig
            return (
              <div key={slug} className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
                {/* Company header */}
                <div className="px-5 py-3 border-b border-card-border flex items-center gap-3" style={{ borderLeftWidth: 3, borderLeftColor: config.color }}>
                  <Building2 className="w-4 h-4" style={{ color: config.color }} />
                  <span className="text-sm font-semibold text-white">{config.fullName}</span>
                  <span className="text-xs text-muted ml-auto">{companyTasks.length} {companyTasks.length === 1 ? 'taak' : 'taken'}</span>
                </div>

                {/* Tasks */}
                <div className="divide-y divide-card-border/50">
                  {companyTasks.map(task => {
                    const prio = PRIORITY_MAP[task.priority] || PRIORITY_MAP.none
                    const isBlocked = task.status === 'blocked'

                    return (
                      <div key={task.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-start gap-4">
                          {/* Left: content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {/* Company badge */}
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: config.color + '20', color: config.color }}
                              >
                                {config.prefix}
                              </span>
                              {/* Identifier */}
                              <span className="text-xs text-muted font-mono">{task.identifier}</span>
                              {/* Priority */}
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${prio.bg} ${prio.color}`}>
                                {prio.label}
                              </span>
                              {/* Blocked badge */}
                              {isBlocked && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Geblokkeerd
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-medium text-white mb-1">{task.title}</h3>
                            {task.description && (
                              <p className="text-xs text-muted line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted">
                              <Clock className="w-3 h-3" />
                              {relativeTime(task.createdAt)}
                            </div>
                          </div>

                          {/* Right: action */}
                          <button
                            onClick={() => handleComplete(task)}
                            disabled={!!completing[task.id]}
                            className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                          >
                            {completing[task.id] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Afgerond
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Recente Acties */}
      {recentDone.length > 0 && (
        <div className="mt-8">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            Recente Acties
          </h2>
          <div className="bg-card-bg border border-card-border rounded-xl divide-y divide-card-border/50">
            {recentDone.map(task => (
              <div key={task.id} className="px-5 py-3 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-500/50 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: task.companyConfig.color + '20', color: task.companyConfig.color }}
                    >
                      {task.companyConfig.prefix}
                    </span>
                    <span className="text-xs text-muted font-mono">{task.identifier}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{task.title}</p>
                </div>
                <span className="text-xs text-muted shrink-0">
                  {relativeTime(task.completedAt || task.updatedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
