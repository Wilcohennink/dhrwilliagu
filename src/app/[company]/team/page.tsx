'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Users, Bot, Pause, DollarSign, Play, Zap, Clock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { paperclip, type Agent, type Company } from '@/lib/paperclip'
import { getCompanyBySlug, type CompanyConfig } from '@/lib/companies'

const ROLE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  ceo:        { bg: 'bg-yellow-500/15', text: 'text-yellow-400', label: 'CEO' },
  researcher: { bg: 'bg-purple-500/15', text: 'text-purple-400', label: 'Researcher' },
  engineer:   { bg: 'bg-blue-500/15',   text: 'text-blue-400',   label: 'Engineer' },
  designer:   { bg: 'bg-pink-500/15',   text: 'text-pink-400',   label: 'Designer' },
  cmo:        { bg: 'bg-orange-500/15', text: 'text-orange-400', label: 'CMO' },
  general:    { bg: 'bg-zinc-500/15',   text: 'text-zinc-400',   label: 'General' },
}

const STATUS_DOT: Record<string, string> = {
  running: 'bg-green-400',
  idle:    'bg-zinc-500',
  error:   'bg-red-500',
  paused:  'bg-yellow-400',
}

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
  const days = Math.floor(hours / 24)
  return `${days}d geleden`
}

export default function TeamPage() {
  const params = useParams()
  const slug = params.company as string
  const companyConfig = getCompanyBySlug(slug)

  const [agents, setAgents] = useState<Agent[]>([])
  const [paperclipCompanyId, setPaperclipCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const fetchData = useCallback(async () => {
    if (!companyConfig) return
    try {
      const companies = await paperclip.getCompanies()
      const match = companies.find(c => c.issuePrefix === companyConfig.prefix)
      if (!match) {
        toast.error(`Bedrijf ${companyConfig.prefix} niet gevonden in Paperclip`)
        setLoading(false)
        return
      }
      setPaperclipCompanyId(match.id)
      const agentList = await paperclip.getAgents(match.id)
      setAgents(agentList)
    } catch {
      toast.error('Fout bij ophalen teamdata')
    } finally {
      setLoading(false)
    }
  }, [companyConfig])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  async function handleTrigger(agent: Agent) {
    setActionLoading(prev => ({ ...prev, [agent.id]: true }))
    try {
      await paperclip.triggerHeartbeat(agent.id)
      toast.success(`Heartbeat getriggerd voor ${agent.name}`)
    } catch {
      toast.error(`Fout bij triggeren ${agent.name}`)
    } finally {
      setActionLoading(prev => ({ ...prev, [agent.id]: false }))
    }
  }

  async function handleTogglePause(agent: Agent) {
    setActionLoading(prev => ({ ...prev, [`pause-${agent.id}`]: true }))
    try {
      const newStatus = agent.status === 'paused' ? 'idle' : 'paused'
      await paperclip.updateAgent(agent.id, { status: newStatus } as Partial<Agent>)
      toast.success(`${agent.name} ${newStatus === 'paused' ? 'gepauzeerd' : 'hervat'}`)
      await fetchData()
    } catch {
      toast.error(`Fout bij status wijzigen ${agent.name}`)
    } finally {
      setActionLoading(prev => ({ ...prev, [`pause-${agent.id}`]: false }))
    }
  }

  if (!companyConfig) {
    return (
      <div className="p-8">
        <p className="text-danger">Onbekend bedrijf: {slug}</p>
      </div>
    )
  }

  const totalBudget = agents.reduce((s, a) => s + a.budgetMonthlyCents, 0)
  const totalSpent = agents.reduce((s, a) => s + a.spentMonthlyCents, 0)
  const counts = {
    running: agents.filter(a => a.status === 'running').length,
    idle: agents.filter(a => a.status === 'idle').length,
    paused: agents.filter(a => a.status === 'paused').length,
    error: agents.filter(a => a.status === 'error').length,
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Team — <span style={{ color: companyConfig.color }}>{companyConfig.name}</span>
        </h1>
        <p className="text-muted text-sm mt-1">{companyConfig.description}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
        <div className="bg-card-bg border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted text-xs mb-1">
            <Users className="w-3.5 h-3.5" /> Totaal
          </div>
          <p className="text-xl font-bold text-white">{agents.length}</p>
        </div>
        <div className="bg-card-bg border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs mb-1">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-muted">Running</span>
          </div>
          <p className="text-xl font-bold text-green-400">{counts.running}</p>
        </div>
        <div className="bg-card-bg border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs mb-1">
            <span className="w-2 h-2 rounded-full bg-zinc-500" />
            <span className="text-muted">Idle</span>
          </div>
          <p className="text-xl font-bold text-zinc-400">{counts.idle}</p>
        </div>
        <div className="bg-card-bg border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs mb-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-muted">Paused</span>
          </div>
          <p className="text-xl font-bold text-yellow-400">{counts.paused}</p>
        </div>
        <div className="bg-card-bg border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted text-xs mb-1">
            <DollarSign className="w-3.5 h-3.5" /> Budget
          </div>
          <p className="text-xl font-bold text-white">{formatCents(totalBudget)}</p>
        </div>
        <div className="bg-card-bg border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted text-xs mb-1">
            <DollarSign className="w-3.5 h-3.5" /> Uitgegeven
          </div>
          <p className="text-xl font-bold text-white">
            {formatCents(totalSpent)}
            {totalBudget > 0 && (
              <span className="text-xs text-muted font-normal ml-1">
                ({Math.round((totalSpent / totalBudget) * 100)}%)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Agent Table */}
      {loading ? (
        <div className="bg-card-bg border border-card-border rounded-xl p-12 text-center">
          <Bot className="w-8 h-8 text-muted mx-auto mb-3 animate-pulse" />
          <p className="text-muted text-sm">Team laden...</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-card-bg border border-card-border rounded-xl p-12 text-center">
          <Users className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-muted text-sm">Geen agents gevonden voor dit bedrijf</p>
        </div>
      ) : (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="text-left text-xs text-muted font-medium px-4 py-3">Status</th>
                  <th className="text-left text-xs text-muted font-medium px-4 py-3">Agent</th>
                  <th className="text-left text-xs text-muted font-medium px-4 py-3">Rol</th>
                  <th className="text-left text-xs text-muted font-medium px-4 py-3">Budget</th>
                  <th className="text-left text-xs text-muted font-medium px-4 py-3">Heartbeat</th>
                  <th className="text-right text-xs text-muted font-medium px-4 py-3">Acties</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(agent => {
                  const roleStyle = ROLE_COLORS[agent.role] || ROLE_COLORS.general
                  const budgetPct = agent.budgetMonthlyCents > 0
                    ? Math.min(100, Math.round((agent.spentMonthlyCents / agent.budgetMonthlyCents) * 100))
                    : 0

                  return (
                    <tr key={agent.id} className="border-b border-card-border/50 hover:bg-white/[0.02] transition-colors">
                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[agent.status] || 'bg-zinc-500'}`} />
                          <span className="text-xs text-muted capitalize">{agent.status}</span>
                        </div>
                      </td>

                      {/* Name + Title */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white">{agent.name}</p>
                        {agent.title && <p className="text-xs text-muted">{agent.title}</p>}
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                          {roleStyle.label}
                        </span>
                      </td>

                      {/* Budget */}
                      <td className="px-4 py-3">
                        <div className="min-w-[120px]">
                          <p className="text-xs text-white mb-1">
                            {formatCents(agent.spentMonthlyCents)}
                            <span className="text-muted"> / {formatCents(agent.budgetMonthlyCents)}</span>
                          </p>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${budgetPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Heartbeat */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted">
                          <Clock className="w-3 h-3" />
                          {relativeTime(agent.lastHeartbeatAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleTrigger(agent)}
                            disabled={!!actionLoading[agent.id]}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                          >
                            <Zap className="w-3 h-3" />
                            Trigger
                          </button>
                          <button
                            onClick={() => handleTogglePause(agent)}
                            disabled={!!actionLoading[`pause-${agent.id}`]}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                              agent.status === 'paused'
                                ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                            }`}
                          >
                            {agent.status === 'paused' ? (
                              <><Play className="w-3 h-3" /> Hervat</>
                            ) : (
                              <><Pause className="w-3 h-3" /> Pauzeer</>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error agents warning */}
      {counts.error > 0 && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">
            {counts.error} agent{counts.error > 1 ? 's' : ''} in error state. Controleer de logs.
          </p>
        </div>
      )}
    </div>
  )
}
