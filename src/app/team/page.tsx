'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, Loader2, Zap, Pause, Play, Clock,
  MessageSquare, ListTodo, DollarSign,
} from 'lucide-react'
import { toast } from 'sonner'
import { paperclip, type Company, type Agent, type Issue } from '@/lib/paperclip'
import { COMPANY } from '@/lib/companies'
import { AgentAvatar, AgentCard } from '@/components/agent-avatar'
import { ChatPanel } from '@/components/chat-panel'
import { getPersonaByName } from '@/lib/agents'

function formatCents(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Nooit'
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s geleden`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m geleden`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}u geleden`
  return `${Math.floor(hours / 24)}d geleden`
}

export default function TeamPage() {
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [chatAgent, setChatAgent] = useState<Agent | null>(null)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const fetchData = useCallback(async () => {
    try {
      const companies = await paperclip.getCompanies()
      const matched = companies.find((c: Company) => c.issuePrefix === COMPANY.prefix)
      if (!matched) { setLoading(false); return }
      setCompanyId(matched.id)
      const [agentData, issueData] = await Promise.all([
        paperclip.getAgents(matched.id),
        paperclip.getIssues(matched.id),
      ])
      setAgents(agentData)
      setIssues(issueData)
    } catch {
      toast.error('Fout bij ophalen teamdata')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15_000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleTrigger = async (agent: Agent) => {
    setActionLoading(prev => ({ ...prev, [agent.id]: true }))
    try {
      await paperclip.triggerHeartbeat(agent.id)
      toast.success(`${agent.name} getriggerd`)
    } catch {
      toast.error(`Fout bij triggeren ${agent.name}`)
    } finally {
      setActionLoading(prev => ({ ...prev, [agent.id]: false }))
    }
  }

  const handleTogglePause = async (agent: Agent) => {
    setActionLoading(prev => ({ ...prev, [`p-${agent.id}`]: true }))
    try {
      const newStatus = agent.status === 'paused' ? 'idle' : 'paused'
      await paperclip.updateAgent(agent.id, { status: newStatus } as Partial<Agent>)
      toast.success(`${agent.name} ${newStatus === 'paused' ? 'gepauzeerd' : 'hervat'}`)
      await fetchData()
    } catch {
      toast.error(`Fout bij status wijzigen ${agent.name}`)
    } finally {
      setActionLoading(prev => ({ ...prev, [`p-${agent.id}`]: false }))
    }
  }

  const getAgentTasks = (agent: Agent) => {
    return issues.filter(i =>
      i.assigneeAgentId === agent.id ||
      i.executionAgentNameKey?.toLowerCase() === agent.name.toLowerCase()
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-8 h-8 text-green animate-spin" />
      </div>
    )
  }

  const counts = {
    running: agents.filter(a => a.status === 'running').length,
    idle: agents.filter(a => a.status === 'idle').length,
    paused: agents.filter(a => a.status === 'paused').length,
    error: agents.filter(a => a.status === 'error').length,
  }

  const totalBudget = agents.reduce((s, a) => s + a.budgetMonthlyCents, 0)
  const totalSpent = agents.reduce((s, a) => s + a.spentMonthlyCents, 0)

  return (
    <div className={`max-w-7xl mx-auto ${chatAgent ? 'mr-96' : ''} transition-all duration-300`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Users className="w-7 h-7 text-green" />
          Team
        </h1>
        <p className="text-sm text-muted mt-1">15 AI agents werken voor KSH</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 card-glow">
          <div className="flex items-center gap-2 text-muted text-[11px] mb-2">
            <Users className="w-3.5 h-3.5" /> Totaal
          </div>
          <p className="text-2xl font-bold text-white">{agents.length}</p>
        </div>
        {[
          { label: 'Running', count: counts.running, color: '#22C55E' },
          { label: 'Idle', count: counts.idle, color: '#7D8590' },
          { label: 'Paused', count: counts.paused, color: '#EAB308' },
          { label: 'Error', count: counts.error, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="bg-card-bg border border-card-border rounded-2xl p-4 card-glow">
            <div className="flex items-center gap-2 text-[11px] mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-muted">{s.label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
          </div>
        ))}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 card-glow">
          <div className="flex items-center gap-2 text-muted text-[11px] mb-2">
            <DollarSign className="w-3.5 h-3.5" /> Budget
          </div>
          <p className="text-lg font-bold text-white">{formatCents(totalSpent)}</p>
          <p className="text-[10px] text-muted">van {formatCents(totalBudget)}</p>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {agents.map((agent) => {
          const persona = getPersonaByName(agent.name)
          const agentTasks = getAgentTasks(agent)
          const activeTasks = agentTasks.filter(t => t.status === 'in_progress').length
          const doneTasks = agentTasks.filter(t => t.status === 'done').length
          const budgetPct = agent.budgetMonthlyCents > 0
            ? Math.min(100, Math.round((agent.spentMonthlyCents / agent.budgetMonthlyCents) * 100))
            : 0
          const isSelected = selectedAgent?.id === agent.id

          return (
            <div
              key={agent.id}
              className={`bg-card-bg border rounded-2xl overflow-hidden transition-all duration-200 card-glow ${
                isSelected ? 'border-green/40 shadow-lg shadow-green/5' : 'border-card-border'
              }`}
            >
              {/* Card content */}
              <button
                onClick={() => setSelectedAgent(isSelected ? null : agent)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  <AgentAvatar agent={agent} size="lg" showProps />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-semibold text-white">{agent.name}</span>
                      <span
                        className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: (persona?.accentColor || '#22C55E') + '20', color: persona?.accentColor || '#22C55E' }}
                      >
                        {persona?.title || agent.role}
                      </span>
                    </div>
                    <p className="text-xs text-muted mb-2">{persona?.description || agent.title || ''}</p>

                    {/* Mini stats */}
                    <div className="flex items-center gap-4 text-[10px] text-muted">
                      <span className="flex items-center gap-1">
                        <ListTodo className="w-3 h-3" />
                        {activeTasks} actief
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {relativeTime(agent.lastHeartbeatAt)}
                      </span>
                      <span>{doneTasks} afgerond</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Budget bar */}
              <div className="px-4 pb-3">
                <div className="flex justify-between text-[10px] mb-1">
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
                      backgroundColor: budgetPct > 90 ? '#EF4444' : budgetPct > 70 ? '#EAB308' : '#22C55E',
                    }}
                  />
                </div>
              </div>

              {/* Expanded section */}
              {isSelected && (
                <div className="px-4 pb-4 pt-2 border-t border-card-border animate-fade-in">
                  {/* Action buttons */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => handleTrigger(agent)}
                      disabled={!!actionLoading[agent.id]}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                    >
                      <Zap className="w-3 h-3" />
                      Trigger
                    </button>
                    <button
                      onClick={() => handleTogglePause(agent)}
                      disabled={!!actionLoading[`p-${agent.id}`]}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-xl transition-colors disabled:opacity-50 ${
                        agent.status === 'paused'
                          ? 'bg-green/10 text-green hover:bg-green/20'
                          : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                      }`}
                    >
                      {agent.status === 'paused' ? <><Play className="w-3 h-3" /> Hervat</> : <><Pause className="w-3 h-3" /> Pauzeer</>}
                    </button>
                    <button
                      onClick={() => setChatAgent(agent)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-green/10 text-green hover:bg-green/20 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Chat
                    </button>
                  </div>

                  {/* Recent tasks */}
                  <p className="text-[10px] text-muted uppercase tracking-wider font-medium mb-2">Recente Taken</p>
                  <div className="space-y-1">
                    {agentTasks
                      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                      .slice(0, 4)
                      .map(task => {
                        const statusColor = task.status === 'in_progress' ? '#EAB308' : task.status === 'done' ? '#22C55E' : task.status === 'todo' ? '#3B82F6' : '#7D8590'
                        return (
                          <a
                            key={task.id}
                            href={`/ksh/issue/${task.id}`}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
                            <span className="text-[10px] font-mono text-muted shrink-0">{task.identifier}</span>
                            <span className="text-[10px] text-white flex-1 truncate">{task.title}</span>
                          </a>
                        )
                      })}
                    {agentTasks.length === 0 && (
                      <p className="text-[10px] text-muted italic py-2">Geen taken toegewezen</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
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
