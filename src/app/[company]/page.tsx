'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import {
  Bot, Activity, AlertCircle, CheckCircle2, Clock, Zap,
  Plus, Crown, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { paperclip, type Company, type Agent, type Issue } from '@/lib/paperclip'
import { getCompanyBySlug, type CompanyConfig } from '@/lib/companies'

// --- Helpers ---

function formatCents(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'nooit'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'zojuist'
  if (mins < 60) return `${mins} min geleden`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}u geleden`
  const days = Math.floor(hours / 24)
  return `${days}d geleden`
}

const STATUS_COLUMNS = ['backlog', 'todo', 'in_progress', 'done'] as const
const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-blue-500/20 text-blue-400',
  none: 'bg-white/10 text-muted-foreground',
}

function StatusDot({ status }: { status: Agent['status'] }) {
  const colors: Record<Agent['status'], string> = {
    running: 'bg-green-500 shadow-green-500/50',
    idle: 'bg-zinc-500',
    error: 'bg-red-500 shadow-red-500/50',
    paused: 'bg-yellow-500',
  }
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[status]} ${status === 'running' || status === 'error' ? 'shadow-[0_0_6px]' : ''}`}
    />
  )
}

// --- Main page ---

export default function CompanyDashboard() {
  const params = useParams<{ company: string }>()
  const slug = params.company
  const config = getCompanyBySlug(slug)

  const [company, setCompany] = useState<Company | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!config) return
    try {
      // Find the Paperclip company by matching prefix
      const companies = await paperclip.getCompanies()
      const pc = companies.find(c => c.issuePrefix === config.prefix)
      if (!pc) {
        toast.error(`Bedrijf "${config.prefix}" niet gevonden in Paperclip`)
        setLoading(false)
        return
      }
      setCompany(pc)
      const [agentData, issueData] = await Promise.all([
        paperclip.getAgents(pc.id),
        paperclip.getIssues(pc.id),
      ])
      setAgents(agentData)
      setIssues(issueData)
    } catch {
      toast.error('Fout bij ophalen data')
    } finally {
      setLoading(false)
    }
  }, [config])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15_000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (!config) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted">
        Onbekend bedrijf: <span className="ml-1 text-white font-mono">{slug}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    )
  }

  const agentMap = Object.fromEntries(agents.map(a => [a.id, a]))
  const runningAgents = agents.filter(a => a.status === 'running').length
  const openIssues = issues.filter(i => !['done', 'cancelled'].includes(i.status)).length
  const doneIssues = issues.filter(i => i.status === 'done').length

  const handleTriggerCEO = async () => {
    const ceo = agents.find(a => a.role === 'ceo')
    if (!ceo) {
      toast.error('Geen CEO agent gevonden')
      return
    }
    try {
      await paperclip.triggerHeartbeat(ceo.id)
      toast.success(`${ceo.name} getriggerd`)
    } catch {
      toast.error('Kon CEO niet triggeren')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: config.color + '30', borderColor: config.color + '50', borderWidth: 1 }}
          >
            {config.prefix}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{config.fullName}</h1>
            <p className="text-sm text-muted">{config.description}</p>
          </div>
        </div>
        {/* Quick actions */}
        <div className="flex gap-2">
          <a
            href={`/${slug}/brainstorm`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/5 border border-card-border text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nieuwe Taak
          </a>
          <button
            onClick={handleTriggerCEO}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: config.color + '20', color: config.color }}
          >
            <Crown className="w-4 h-4" />
            Trigger CEO
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Agents', value: agents.length, icon: Bot, color: 'text-blue-400' },
          { label: 'Actief', value: runningAgents, icon: Activity, color: 'text-green-400' },
          { label: 'Open Issues', value: openIssues, icon: AlertCircle, color: 'text-yellow-400' },
          { label: 'Afgerond', value: doneIssues, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Budget', value: company ? formatCents(company.spentMonthlyCents) : '-', sub: company ? `/ ${formatCents(company.budgetMonthlyCents)}` : '', icon: Zap, color: 'text-purple-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-card-bg border border-card-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-muted">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-white">
              {stat.value}
              {'sub' in stat && stat.sub && (
                <span className="text-sm text-muted font-normal ml-1">{stat.sub}</span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Agent overview */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Agents
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {agents.map(agent => {
            const budgetPct = agent.budgetMonthlyCents > 0
              ? Math.min(100, Math.round((agent.spentMonthlyCents / agent.budgetMonthlyCents) * 100))
              : 0
            return (
              <div
                key={agent.id}
                className="bg-card-bg border border-card-border rounded-xl p-4 hover:border-card-hover transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-lg">
                      {agent.icon || '🤖'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{agent.name}</span>
                        <StatusDot status={agent.status} />
                      </div>
                      {agent.title && (
                        <p className="text-xs text-muted">{agent.title}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: config.color + '20', color: config.color }}
                  >
                    {agent.role}
                  </span>
                </div>

                {/* Budget bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted">Budget</span>
                    <span className="text-muted-foreground">
                      {formatCents(agent.spentMonthlyCents)} / {formatCents(agent.budgetMonthlyCents)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${budgetPct}%`,
                        backgroundColor: budgetPct > 90 ? '#EF4444' : budgetPct > 70 ? '#EAB308' : config.color,
                      }}
                    />
                  </div>
                </div>

                {/* Heartbeat */}
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <Clock className="w-3 h-3" />
                  {relativeTime(agent.lastHeartbeatAt)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Issue board */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Issue Board
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {STATUS_COLUMNS.map(status => {
            const columnIssues = issues.filter(i => i.status === status)
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between px-1 mb-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {STATUS_LABELS[status]}
                  </span>
                  <span className="text-xs text-muted bg-white/5 px-1.5 py-0.5 rounded-md">
                    {columnIssues.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {columnIssues.length === 0 && (
                    <div className="text-xs text-muted text-center py-6 bg-card-bg border border-dashed border-card-border rounded-lg">
                      Geen issues
                    </div>
                  )}
                  {columnIssues.map(issue => {
                    const assignee = issue.assigneeAgentId ? agentMap[issue.assigneeAgentId] : null
                    return (
                      <div
                        key={issue.id}
                        className="bg-card-bg border border-card-border rounded-lg p-3 hover:border-card-hover transition-colors cursor-default"
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <span className="text-[10px] font-mono text-muted">{issue.identifier}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${PRIORITY_COLORS[issue.priority] || PRIORITY_COLORS.none}`}>
                            {issue.priority}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-white leading-snug mb-2 line-clamp-2">
                          {issue.title}
                        </p>
                        {assignee && (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted">
                            <span>{assignee.icon || '🤖'}</span>
                            <span>{assignee.name}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
