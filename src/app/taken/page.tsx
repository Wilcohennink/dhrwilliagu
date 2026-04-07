'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Loader2, ListTodo, Clock, User,
  ChevronDown, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { paperclip, type Company, type Agent, type Issue } from '@/lib/paperclip'
import { COMPANY } from '@/lib/companies'
import { AgentAvatar } from '@/components/agent-avatar'
import { getPersonaByName } from '@/lib/agents'

const STATUS_COLUMNS = [
  { key: 'backlog', label: 'Backlog', color: '#7D8590' },
  { key: 'todo', label: 'To Do', color: '#3B82F6' },
  { key: 'in_progress', label: 'In Progress', color: '#EAB308' },
  { key: 'done', label: 'Done', color: '#22C55E' },
] as const

const PRIORITY_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: 'Urgent', color: 'text-red-400', bg: 'bg-red-500/15' },
  high: { label: 'Hoog', color: 'text-orange-400', bg: 'bg-orange-500/15' },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  low: { label: 'Laag', color: 'text-zinc-400', bg: 'bg-zinc-500/15' },
  none: { label: 'Laag', color: 'text-zinc-400', bg: 'bg-zinc-500/15' },
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'nu'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}u`
  return `${Math.floor(hours / 24)}d`
}

export default function TakenPage() {
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newAssignee, setNewAssignee] = useState('')
  const [creating, setCreating] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)

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
      toast.error('Fout bij ophalen data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15_000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !companyId) return
    setCreating(true)
    try {
      const data: Parameters<typeof paperclip.createIssue>[1] = {
        title: newTitle.trim(),
        description: newDesc.trim(),
        status: 'backlog',
        priority: newPriority,
      }
      await paperclip.createIssue(companyId, data)
      setNewTitle('')
      setNewDesc('')
      setNewPriority('medium')
      setNewAssignee('')
      setShowNewTask(false)
      toast.success('Taak aangemaakt')
      await fetchData()
    } catch {
      toast.error('Kon taak niet aanmaken')
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (issue: Issue, newStatus: string) => {
    try {
      await paperclip.updateIssue(issue.id, { status: newStatus } as Partial<Issue>)
      toast.success(`${issue.identifier} verplaatst naar ${STATUS_COLUMNS.find(c => c.key === newStatus)?.label}`)
      await fetchData()
    } catch {
      toast.error('Kon status niet wijzigen')
    }
  }

  const agentMap = Object.fromEntries(agents.map(a => [a.id, a]))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-8 h-8 text-green animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ListTodo className="w-7 h-7 text-green" />
            Takenbord
          </h1>
          <p className="text-sm text-muted mt-1">Beheer alle taken voor KSH</p>
        </div>
        <button
          onClick={() => setShowNewTask(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green/20 text-green font-medium text-sm hover:bg-green/30 transition-colors border border-green/20"
        >
          <Plus className="w-4 h-4" />
          Nieuwe Taak
        </button>
      </div>

      {/* New Task Modal */}
      {showNewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowNewTask(false)}>
          <div className="bg-card-bg border border-card-border rounded-2xl w-full max-w-lg mx-4 p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Nieuwe Taak</h2>
              <button onClick={() => setShowNewTask(false)} className="text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1.5">Titel</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Wat moet er gebeuren?"
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:border-green/40"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1.5">Beschrijving</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Extra details..."
                  rows={3}
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:border-green/40 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1.5">Prioriteit</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                    className="w-full bg-background border border-card-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green/40"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">Hoog</option>
                    <option value="medium">Medium</option>
                    <option value="low">Laag</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1.5">Toewijzen aan</label>
                  <select
                    value={newAssignee}
                    onChange={e => setNewAssignee(e.target.value)}
                    className="w-full bg-background border border-card-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green/40"
                  >
                    <option value="">Niet toegewezen</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name} — {a.role}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTask(false)}
                  className="px-4 py-2 rounded-xl text-sm text-muted hover:text-white transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || creating}
                  className="px-5 py-2 rounded-xl bg-green text-white text-sm font-medium hover:bg-green-dim transition-colors disabled:opacity-40"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-3 min-h-[60vh]">
        {STATUS_COLUMNS.map(column => {
          const columnIssues = issues
            .filter(i => i.status === column.key)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

          return (
            <div key={column.key} className="flex flex-col">
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color }} />
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">{column.label}</span>
                </div>
                <span className="text-[10px] font-mono text-muted bg-white/5 px-2 py-0.5 rounded-md">
                  {columnIssues.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-240px)] pr-1">
                {columnIssues.length === 0 && (
                  <div className="text-[10px] text-muted text-center py-8 border border-dashed border-card-border rounded-xl bg-card-bg/50">
                    Geen taken
                  </div>
                )}
                {columnIssues.map(issue => {
                  const assignee = issue.assigneeAgentId ? agentMap[issue.assigneeAgentId] : null
                  const prio = PRIORITY_STYLES[issue.priority] || PRIORITY_STYLES.none
                  const persona = assignee ? getPersonaByName(assignee.name) : null

                  return (
                    <div
                      key={issue.id}
                      onClick={() => setSelectedIssue(selectedIssue?.id === issue.id ? null : issue)}
                      className={`bg-card-bg border rounded-xl p-3 cursor-pointer transition-all duration-200 card-glow ${
                        selectedIssue?.id === issue.id
                          ? 'border-green/40 shadow-lg shadow-green/5'
                          : 'border-card-border hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <span className="text-[10px] font-mono text-muted">{issue.identifier}</span>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${prio.bg} ${prio.color}`}>
                          {prio.label}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-white leading-snug mb-2 line-clamp-2">
                        {issue.title}
                      </p>
                      <div className="flex items-center justify-between">
                        {assignee ? (
                          <div className="flex items-center gap-1.5">
                            <AgentAvatar agent={assignee} size="sm" showStatus={false} className="scale-[0.6] origin-left" />
                            <span className="text-[10px] text-muted">{assignee.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-muted">
                            <User className="w-3 h-3" />
                            Niet toegewezen
                          </div>
                        )}
                        <span className="text-[9px] text-muted flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {relativeTime(issue.updatedAt)}
                        </span>
                      </div>

                      {/* Expanded detail */}
                      {selectedIssue?.id === issue.id && (
                        <div className="mt-3 pt-3 border-t border-card-border animate-fade-in">
                          {issue.description && (
                            <p className="text-[10px] text-muted mb-3 leading-relaxed">{issue.description}</p>
                          )}
                          <div className="flex gap-1 flex-wrap">
                            {column.key !== 'todo' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(issue, 'todo') }}
                                className="text-[10px] px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                              >
                                To Do
                              </button>
                            )}
                            {column.key !== 'in_progress' && column.key !== 'done' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(issue, 'in_progress') }}
                                className="text-[10px] px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                              >
                                Start
                              </button>
                            )}
                            {column.key !== 'done' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(issue, 'done') }}
                                className="text-[10px] px-2 py-1 rounded-lg bg-green/10 text-green hover:bg-green/20"
                              >
                                Done
                              </button>
                            )}
                            <a
                              href={`/ksh/issue/${issue.id}`}
                              onClick={e => e.stopPropagation()}
                              className="text-[10px] px-2 py-1 rounded-lg bg-white/5 text-muted hover:text-white hover:bg-white/10"
                            >
                              Details
                            </a>
                          </div>
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
  )
}
