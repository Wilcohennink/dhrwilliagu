'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, Loader2, AlertTriangle, CheckCircle2,
  Activity, ListTodo, Clock, TrendingUp,
} from 'lucide-react'
import { paperclip, type Company, type Agent, type Issue } from '@/lib/paperclip'
import { COMPANY } from '@/lib/companies'
import { AgentAvatar } from '@/components/agent-avatar'
import { ChatPanel } from '@/components/chat-panel'
import { getPersonaByName } from '@/lib/agents'

function formatDate(): string {
  return new Intl.DateTimeFormat('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return 'Goedenacht'
  if (hour < 12) return 'Goedemorgen'
  if (hour < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export default function VirtualOfficePage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [chatAgent, setChatAgent] = useState<Agent | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const apiCompanies = await paperclip.getCompanies()
      const matched = apiCompanies.find((c: Company) => c.issuePrefix === COMPANY.prefix)
      if (!matched) { setLoading(false); return }

      setCompany(matched)
      setCompanyId(matched.id)

      const [agentData, issueData] = await Promise.all([
        paperclip.getAgents(matched.id),
        paperclip.getIssues(matched.id),
      ])

      setAgents(agentData)
      setIssues(issueData)
      setLastRefresh(new Date())
    } catch {
      // Silently handle
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
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-green animate-spin" />
          <p className="text-sm text-muted">Virtual Office laden...</p>
        </div>
      </div>
    )
  }

  const runningAgents = agents.filter(a => a.status === 'running').length
  const errorAgents = agents.filter(a => a.status === 'error').length
  const openIssues = issues.filter(i => !['done', 'cancelled'].includes(i.status)).length
  const inProgress = issues.filter(i => i.status === 'in_progress').length
  const doneToday = issues.filter(i => {
    if (i.status !== 'done' || !i.completedAt) return false
    const today = new Date().toDateString()
    return new Date(i.completedAt).toDateString() === today
  }).length
  const blockedIssues = issues.filter(i => i.status === 'blocked' || i.labels.some(l => l.toLowerCase().includes('needs-human')))

  return (
    <div className={`max-w-7xl mx-auto ${chatAgent ? 'mr-96' : ''} transition-all duration-300`}>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            {getGreeting()}, Wilco
          </h1>
          <p className="text-muted capitalize">{formatDate()}</p>
        </div>
        <button
          onClick={() => { setLoading(true); loadData() }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card-bg border border-card-border text-muted text-xs hover:text-white hover:border-green/30 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {lastRefresh.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Actieve Agents', value: `${runningAgents}/${agents.length}`, icon: Activity, color: '#22C55E', sub: 'online' },
          { label: 'Open Taken', value: openIssues, icon: ListTodo, color: '#3B82F6', sub: 'totaal' },
          { label: 'In Progress', value: inProgress, icon: Clock, color: '#EAB308', sub: 'nu bezig' },
          { label: 'Vandaag Afgerond', value: doneToday, icon: CheckCircle2, color: '#22C55E', sub: 'taken klaar' },
          { label: 'Budget', value: company ? formatCents(company.spentMonthlyCents) : '-', icon: TrendingUp, color: '#A855F7', sub: company ? `van ${formatCents(company.budgetMonthlyCents)}` : '' },
        ].map(stat => (
          <div key={stat.label} className="bg-card-bg border border-card-border rounded-2xl p-4 card-glow transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.color + '15' }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <span className="text-[11px] text-muted font-medium">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            {stat.sub && <p className="text-[10px] text-muted mt-0.5">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(errorAgents > 0 || blockedIssues.length > 0) && (
        <div className="mb-6 space-y-2">
          {errorAgents > 0 && (
            <div className="bg-danger/10 border border-danger/20 rounded-2xl px-5 py-3 flex items-center gap-3 animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
              <p className="text-sm text-danger">
                {errorAgents} agent{errorAgents > 1 ? 's' : ''} in error state
              </p>
            </div>
          )}
          {blockedIssues.length > 0 && (
            <div className="bg-warning/10 border border-warning/20 rounded-2xl px-5 py-3 flex items-center gap-3 animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
              <p className="text-sm text-warning">
                {blockedIssues.length} taak{blockedIssues.length > 1 ? 'taken' : ''} vereist jouw aandacht
              </p>
              <div className="ml-auto flex gap-2">
                {blockedIssues.slice(0, 3).map(i => (
                  <span key={i.id} className="text-[10px] font-mono text-warning/80">{i.identifier}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Team Overview - Virtual Office Floor */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-green" />
            Virtual Office
          </h2>
          <p className="text-[10px] text-muted">Klik op een agent om te chatten</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-3">
          {agents.map((agent, index) => {
            const persona = getPersonaByName(agent.name)
            // Zoek de huidige taak van deze agent
            const currentTask = issues.find(
              i => i.status === 'in_progress' && (i.assigneeAgentId === agent.id || i.executionAgentNameKey?.toLowerCase() === agent.name.toLowerCase())
            )

            return (
              <button
                key={agent.id}
                onClick={() => setChatAgent(chatAgent?.id === agent.id ? null : agent)}
                className={`group relative bg-card-bg border rounded-2xl p-4 transition-all duration-300 card-glow text-center animate-fade-in ${
                  chatAgent?.id === agent.id
                    ? 'border-green/40 shadow-lg shadow-green/10 scale-[1.02]'
                    : 'border-card-border hover:border-white/20 hover:scale-[1.02]'
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Avatar */}
                <div className="flex justify-center mb-3">
                  <AgentAvatar agent={agent} size="lg" showProps />
                </div>

                {/* Name & Role */}
                <p className="text-sm font-semibold text-white mb-0.5">{agent.name}</p>
                <p
                  className="text-[10px] font-medium uppercase tracking-wider mb-2"
                  style={{ color: persona?.accentColor || '#22C55E' }}
                >
                  {persona?.title || agent.role}
                </p>

                {/* Current task */}
                {currentTask ? (
                  <div className="bg-background rounded-lg px-2 py-1.5 mt-1">
                    <p className="text-[9px] text-muted line-clamp-2 leading-tight">{currentTask.title}</p>
                  </div>
                ) : (
                  <div className="bg-background/50 rounded-lg px-2 py-1.5 mt-1">
                    <p className="text-[9px] text-muted italic">Geen actieve taak</p>
                  </div>
                )}

                {/* Props floating */}
                {persona && (
                  <div className="absolute top-2 right-2 flex gap-0.5 opacity-30 group-hover:opacity-60 transition-opacity">
                    {persona.props.map((prop, i) => (
                      <span key={i} className="text-xs">{prop}</span>
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recente taken */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-green" />
            Recente Taken
          </h3>
          <div className="space-y-2">
            {issues
              .filter(i => !['done', 'cancelled'].includes(i.status))
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 6)
              .map(issue => {
                const assignee = issue.assigneeAgentId ? agents.find(a => a.id === issue.assigneeAgentId) : null
                const statusColor = issue.status === 'in_progress' ? '#EAB308' : issue.status === 'todo' ? '#3B82F6' : issue.status === 'blocked' ? '#EF4444' : '#7D8590'
                return (
                  <a
                    key={issue.id}
                    href={`/ksh/issue/${issue.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
                    <span className="text-[10px] font-mono text-muted shrink-0">{issue.identifier}</span>
                    <span className="text-xs text-white flex-1 truncate group-hover:text-green transition-colors">{issue.title}</span>
                    {assignee && (
                      <span className="text-[10px] text-muted shrink-0">{assignee.name}</span>
                    )}
                  </a>
                )
              })}
            {issues.filter(i => !['done', 'cancelled'].includes(i.status)).length === 0 && (
              <p className="text-xs text-muted text-center py-6">Geen open taken</p>
            )}
          </div>
          <a
            href="/taken"
            className="mt-3 flex items-center justify-center gap-1 text-[11px] text-green font-medium hover:text-green-dim transition-colors"
          >
            Alle taken bekijken
          </a>
        </div>

        {/* Recent afgerond */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green" />
            Recent Afgerond
          </h3>
          <div className="space-y-2">
            {issues
              .filter(i => i.status === 'done')
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 6)
              .map(issue => {
                const assignee = issue.assigneeAgentId ? agents.find(a => a.id === issue.assigneeAgentId) : null
                return (
                  <div
                    key={issue.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-green/40 shrink-0" />
                    <span className="text-[10px] font-mono text-muted shrink-0">{issue.identifier}</span>
                    <span className="text-xs text-muted flex-1 truncate line-through decoration-muted/30">{issue.title}</span>
                    {assignee && (
                      <span className="text-[10px] text-muted/60 shrink-0">{assignee.name}</span>
                    )}
                  </div>
                )
              })}
            {issues.filter(i => i.status === 'done').length === 0 && (
              <p className="text-xs text-muted text-center py-6">Nog niets afgerond</p>
            )}
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      {chatAgent && companyId && (
        <ChatPanel
          agent={chatAgent}
          companyId={companyId}
          onClose={() => setChatAgent(null)}
        />
      )}
    </div>
  )
}
