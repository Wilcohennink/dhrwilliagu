'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Crown, Bot, CircleDot, Clock, AlertTriangle,
  Plus, Loader2, RefreshCw, CheckCircle, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { paperclip, type Company, type Agent, type Issue } from '@/lib/paperclip'
import { COMPANIES } from '@/lib/companies'

function formatCents(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Nooit'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'Zojuist'
  if (minutes < 60) return `${minutes}m geleden`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}u geleden`
  const days = Math.floor(hours / 24)
  return `${days}d geleden`
}

function statusLabel(s: string): string {
  switch (s) {
    case 'backlog': return 'Backlog'
    case 'todo': return 'To Do'
    case 'in_progress': return 'In Progress'
    case 'in_review': return 'In Review'
    case 'done': return 'Klaar'
    case 'blocked': return 'Blocked'
    case 'cancelled': return 'Geannuleerd'
    default: return s
  }
}

function statusColor(s: string): string {
  switch (s) {
    case 'backlog': return 'bg-white/10 text-muted'
    case 'todo': return 'bg-blue/20 text-blue'
    case 'in_progress': return 'bg-warning/20 text-warning'
    case 'in_review': return 'bg-silver/20 text-silver'
    case 'done': return 'bg-success/20 text-success'
    case 'blocked': return 'bg-danger/20 text-danger'
    case 'cancelled': return 'bg-white/10 text-muted line-through'
    default: return 'bg-white/10 text-muted'
  }
}

function agentStatusColor(s: string): string {
  switch (s) {
    case 'running': return 'bg-success/20 text-success'
    case 'error': return 'bg-danger/20 text-danger'
    case 'paused': return 'bg-warning/20 text-warning'
    default: return 'bg-white/10 text-muted'
  }
}

function statusIcon(s: string) {
  switch (s) {
    case 'done': return <CheckCircle className="w-4 h-4 text-success shrink-0" />
    case 'blocked': return <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
    case 'in_progress': return <Clock className="w-4 h-4 text-warning shrink-0" />
    case 'cancelled': return <XCircle className="w-4 h-4 text-muted shrink-0" />
    default: return <CircleDot className="w-4 h-4 text-muted shrink-0" />
  }
}

export default function BoardPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [notConfigured, setNotConfigured] = useState(false)

  // Nieuw idee form
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const boardConfig = COMPANIES.board

  const loadData = useCallback(async () => {
    try {
      const companies = await paperclip.getCompanies()
      const matched = companies.find(c => c.issuePrefix === 'BOD')

      if (!matched) {
        setNotConfigured(true)
        setLoading(false)
        return
      }

      setCompany(matched)

      const [agentData, issueData] = await Promise.all([
        paperclip.getAgents(matched.id),
        paperclip.getIssues(matched.id),
      ])

      setAgents(agentData)
      setIssues(issueData)
    } catch {
      // Data stays empty
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30_000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleCreateIdea = async () => {
    if (!newTitle.trim() || !company) return
    setSubmitting(true)
    try {
      const created = await paperclip.createIssue(company.id, {
        title: newTitle.trim(),
        description: newDescription.trim(),
        status: 'backlog',
        priority: 'medium',
        labels: ['strategic'],
      })
      setIssues(prev => [created, ...prev])
      setNewTitle('')
      setNewDescription('')
      setShowForm(false)
      toast.success('Strategisch idee aangemaakt')
    } catch {
      toast.error('Fout bij aanmaken idee')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-muted animate-spin" />
      </div>
    )
  }

  if (notConfigured) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <Crown className="w-8 h-8 text-silver" />
          <h1 className="text-2xl font-bold text-white">Board of Directors</h1>
        </div>
        <div className="bg-card-bg border border-card-border rounded-xl p-8 text-center">
          <p className="text-muted">Niet geconfigureerd in Paperclip</p>
          <p className="text-xs text-muted mt-2">Maak een company aan met prefix BOD om te beginnen.</p>
        </div>
      </div>
    )
  }

  const openIssues = issues.filter(i => !['done', 'cancelled'].includes(i.status))
  const budgetPct = company && company.budgetMonthlyCents > 0
    ? Math.min((company.spentMonthlyCents / company.budgetMonthlyCents) * 100, 100)
    : 0

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-silver/10 border border-silver/20 flex items-center justify-center">
            <Crown className="w-6 h-6 text-silver" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Board of Directors</h1>
            <p className="text-muted text-sm">
              Strategische beslissingen en holding governance
            </p>
          </div>
        </div>
        <button
          onClick={() => { setLoading(true); loadData() }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-card-border text-muted text-xs hover:text-white hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Vernieuwen
        </button>
      </div>

      {/* Budget Summary */}
      {company && (
        <div className="bg-card-bg border border-card-border rounded-xl p-5 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted">Maandbudget</span>
            <span className="text-sm text-muted-foreground">
              {formatCents(company.spentMonthlyCents)} / {formatCents(company.budgetMonthlyCents)}
            </span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${budgetPct}%`,
                backgroundColor: budgetPct > 90 ? 'var(--danger)' : boardConfig.color,
              }}
            />
          </div>
        </div>
      )}

      {/* Agent Cards */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Agents
        </h2>
        {agents.length === 0 ? (
          <div className="bg-card-bg border border-card-border rounded-xl p-6 text-center">
            <p className="text-sm text-muted">Geen agents geconfigureerd</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-card-bg border border-card-border rounded-xl p-5 hover:bg-card-hover transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">{agent.name}</h3>
                    <p className="text-xs text-muted">{agent.role}</p>
                    {agent.title && <p className="text-xs text-muted-foreground mt-0.5">{agent.title}</p>}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${agentStatusColor(agent.status)}`}>
                    {agent.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Laatste heartbeat</span>
                    <span className="text-muted-foreground">{timeAgo(agent.lastHeartbeatAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Budget</span>
                    <span className="text-muted-foreground">
                      {formatCents(agent.spentMonthlyCents)} / {formatCents(agent.budgetMonthlyCents)}
                    </span>
                  </div>
                  {agent.pauseReason && (
                    <div className="mt-2 px-2 py-1.5 rounded-md bg-warning/10 text-warning text-[11px]">
                      {agent.pauseReason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Issues */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <CircleDot className="w-4 h-4" />
            Issues ({openIssues.length} open)
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'rgba(192, 192, 192, 0.1)',
              color: boardConfig.color,
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Nieuw Strategisch Idee
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-card-bg border border-card-border rounded-xl p-5 mb-4">
            <div className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Titel van het strategisch idee..."
                className="w-full bg-white/5 border border-card-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted outline-none focus:border-silver/50"
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Beschrijving (optioneel)..."
                rows={3}
                className="w-full bg-white/5 border border-card-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted outline-none focus:border-silver/50 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowForm(false); setNewTitle(''); setNewDescription('') }}
                  className="px-3 py-1.5 rounded-lg text-xs text-muted hover:text-white transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleCreateIdea}
                  disabled={!newTitle.trim() || submitting}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-silver/15 text-silver hover:bg-silver/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  Aanmaken
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Issues List */}
        {issues.length === 0 ? (
          <div className="bg-card-bg border border-card-border rounded-xl p-6 text-center">
            <p className="text-sm text-muted">Nog geen issues</p>
          </div>
        ) : (
          <div className="space-y-2">
            {issues
              .sort((a, b) => {
                // Open issues eerst, dan op datum
                const aOpen = !['done', 'cancelled'].includes(a.status)
                const bOpen = !['done', 'cancelled'].includes(b.status)
                if (aOpen !== bOpen) return aOpen ? -1 : 1
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
              })
              .map((issue) => (
                <div
                  key={issue.id}
                  className="bg-card-bg border border-card-border rounded-xl px-5 py-3 flex items-center gap-4 hover:bg-card-hover transition-colors"
                >
                  {statusIcon(issue.status)}
                  <span className="text-xs text-muted font-mono w-16 shrink-0">{issue.identifier}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{issue.title}</p>
                    {issue.description && (
                      <p className="text-xs text-muted truncate mt-0.5">{issue.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {issue.labels.map(l => (
                      <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted">
                        {l}
                      </span>
                    ))}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor(issue.status)}`}>
                      {statusLabel(issue.status)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
