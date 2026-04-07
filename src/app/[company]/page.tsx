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
import { AgentAvatar } from '@/components/agent-avatar'
import { getPersonaByName } from '@/lib/agents'

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
  return `${Math.floor(hours / 24)}d geleden`
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
      const companies = await paperclip.getCompanies()
      const pc = companies.find((c: Company) => c.issuePrefix === config.prefix)
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
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <p className="text-muted mb-2">Onbekend bedrijf: <span className="text-white font-mono">{slug}</span></p>
        <a href="/" className="text-green text-sm hover:underline">Terug naar Dashboard</a>
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
    if (!ceo) { toast.error('Geen CEO agent gevonden'); return }
    try {
      await paperclip.triggerHeartbeat(ceo.id)
      toast.success(`${ceo.name} getriggerd`)
    } catch {
      toast.error('Kon CEO niet triggeren')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-green/20 border border-green/20">
            {config.prefix}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{config.fullName}</h1>
            <p className="text-sm text-muted">{config.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href="/taken"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-card-bg border border-card-border text-muted-foreground hover:text-white hover:bg-card-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nieuwe Taak
          </a>
          <button
            onClick={handleTriggerCEO}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-green/20 text-green hover:bg-green/30 transition-colors"
          >
            <Crown className="w-4 h-4" />
            Trigger CEO
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Agents', value: agents.length, icon: Bot, color: '#3B82F6' },
          { label: 'Actief', value: runningAgents, icon: Activity, color: '#22C55E' },
          { label: 'Open Issues', value: openIssues, icon: AlertCircle, color: '#EAB308' },
          { label: 'Afgerond', value: doneIssues, icon: CheckCircle2, color: '#22C55E' },
          { label: 'Budget', value: company ? formatCents(company.spentMonthlyCents) : '-', icon: Zap, color: '#A855F7' },
        ].map(stat => (
          <div key={stat.label} className="bg-card-bg border border-card-border rounded-2xl p-4 card-glow">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              <span className="text-[11px] text-muted">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Agent overview */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {agents.map(agent => {
            const persona = getPersonaByName(agent.name)
            const budgetPct = agent.budgetMonthlyCents > 0
              ? Math.min(100, Math.round((agent.spentMonthlyCents / agent.budgetMonthlyCents) * 100))
              : 0
            return (
              <div key={agent.id} className="bg-card-bg border border-card-border rounded-2xl p-4 card-glow transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <AgentAvatar agent={agent} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{agent.name}</span>
                    </div>
                    <span
                      className="text-[10px] font-medium uppercase tracking-wider"
                      style={{ color: persona?.accentColor || '#22C55E' }}
                    >
                      {persona?.title || agent.role}
                    </span>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-muted">Budget</span>
                    <span className="text-muted-foreground">{formatCents(agent.spentMonthlyCents)} / {formatCents(agent.budgetMonthlyCents)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${budgetPct}%`,
                      backgroundColor: budgetPct > 90 ? '#EF4444' : budgetPct > 70 ? '#EAB308' : '#22C55E',
                    }} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted">
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
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Issue Board</h2>
        <div className="grid grid-cols-4 gap-3">
          {STATUS_COLUMNS.map(status => {
            const columnIssues = issues.filter(i => i.status === status)
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between px-1 mb-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{STATUS_LABELS[status]}</span>
                  <span className="text-[10px] text-muted bg-white/5 px-1.5 py-0.5 rounded-md">{columnIssues.length}</span>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {columnIssues.length === 0 && (
                    <div className="text-[10px] text-muted text-center py-6 bg-card-bg border border-dashed border-card-border rounded-xl">Geen issues</div>
                  )}
                  {columnIssues.map(issue => {
                    const assignee = issue.assigneeAgentId ? agentMap[issue.assigneeAgentId] : null
                    return (
                      <a key={issue.id} href={`/${slug}/issue/${issue.id}`} className="block bg-card-bg border border-card-border rounded-xl p-3 hover:border-white/20 transition-colors card-glow">
                        <div className="flex items-start justify-between mb-1.5">
                          <span className="text-[10px] font-mono text-muted">{issue.identifier}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${PRIORITY_COLORS[issue.priority] || PRIORITY_COLORS.none}`}>
                            {issue.priority}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-white leading-snug mb-2 line-clamp-2">{issue.title}</p>
                        {assignee && (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted">
                            <span>{assignee.icon || '\u{1F916}'}</span>
                            <span>{assignee.name}</span>
                          </div>
                        )}
                      </a>
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
