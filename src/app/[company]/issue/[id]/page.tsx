'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Clock, User, MessageSquare, Loader2,
  CheckCircle2, AlertCircle, Circle, PlayCircle, Eye,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { paperclip, type Company, type Agent, type Issue, type Comment } from '@/lib/paperclip'
import { getCompanyBySlug } from '@/lib/companies'

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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  backlog: { label: 'Backlog', icon: Circle, color: '#71717A' },
  todo: { label: 'To Do', icon: AlertCircle, color: '#3B82F6' },
  in_progress: { label: 'In Progress', icon: PlayCircle, color: '#EAB308' },
  in_review: { label: 'In Review', icon: Eye, color: '#A855F7' },
  done: { label: 'Done', icon: CheckCircle2, color: '#22C55E' },
  blocked: { label: 'Geblokkeerd', icon: AlertCircle, color: '#EF4444' },
  cancelled: { label: 'Geannuleerd', icon: Circle, color: '#71717A' },
}

export default function IssuePage() {
  const params = useParams()
  const companySlug = params.company as string
  const issueId = params.id as string
  const config = getCompanyBySlug(companySlug)

  const [loading, setLoading] = useState(true)
  const [issue, setIssue] = useState<Issue | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [sending, setSending] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const companies = await paperclip.getCompanies()
      const matched = companies.find((c: Company) => c.issuePrefix === config?.prefix)
      if (!matched) { setLoading(false); return }
      setCompanyId(matched.id)

      const [agentList, issueList] = await Promise.all([
        paperclip.getAgents(matched.id),
        paperclip.getIssues(matched.id),
      ])

      setAgents(agentList)
      const found = issueList.find((i: Issue) => i.id === issueId)
      setIssue(found || null)

      if (found) {
        try {
          const cmts = await paperclip.getComments(matched.id, found.id)
          setComments(Array.isArray(cmts) ? cmts : [])
        } catch {
          setComments([])
        }
      }
    } catch {
      toast.error('Kan issue niet laden')
    } finally {
      setLoading(false)
    }
  }, [issueId, config?.prefix])

  useEffect(() => { loadData() }, [loadData])

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return null
    const agent = agents.find(a => a.id === agentId)
    return agent?.name || null
  }

  const handleSendComment = async () => {
    if (!newComment.trim() || !companyId || !issue) return
    setSending(true)
    try {
      await paperclip.addComment(companyId, issue.id, newComment.trim())
      setNewComment('')
      toast.success('Opmerking geplaatst')
      loadData()
    } catch {
      toast.error('Kon opmerking niet plaatsen')
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!issue) return
    try {
      await paperclip.updateIssue(issue.id, { status: newStatus } as Partial<Issue>)
      toast.success(`Status gewijzigd naar ${STATUS_CONFIG[newStatus]?.label || newStatus}`)
      loadData()
    } catch {
      toast.error('Kon status niet wijzigen')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    )
  }

  if (!issue || !config) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link href={`/${companySlug}`} className="flex items-center gap-2 text-muted hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Terug naar {config?.name || companySlug}
        </Link>
        <p className="text-muted">Issue niet gevonden</p>
      </div>
    )
  }

  const status = STATUS_CONFIG[issue.status] || STATUS_CONFIG.backlog
  const StatusIcon = status.icon
  const assigneeName = getAgentName(issue.assigneeAgentId)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link href={`/${companySlug}`} className="flex items-center gap-2 text-muted hover:text-white mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Terug naar {config.name}
      </Link>

      {/* Issue header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: config.color + '20', color: config.color }}>
            {issue.identifier}
          </span>
          <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: status.color + '20', color: status.color }}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
          {issue.priority && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              issue.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
              issue.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
              issue.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-zinc-500/20 text-zinc-400'
            }`}>
              {issue.priority}
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold text-white">{issue.title}</h1>
      </div>

      {/* Meta info */}
      <div className="bg-card-bg border border-card-border rounded-lg p-4 mb-6 space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <User className="w-4 h-4 text-muted" />
          <span className="text-muted">Toegewezen aan:</span>
          <span className="text-white">{assigneeName || 'Niet toegewezen'}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Clock className="w-4 h-4 text-muted" />
          <span className="text-muted">Aangemaakt:</span>
          <span className="text-white">{formatDate(issue.createdAt)}</span>
        </div>
        {issue.completedAt && (
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green" />
            <span className="text-muted">Afgerond:</span>
            <span className="text-white">{formatDate(issue.completedAt)}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm">
          <Clock className="w-4 h-4 text-muted" />
          <span className="text-muted">Laatst gewijzigd:</span>
          <span className="text-white">{relativeTime(issue.updatedAt)}</span>
        </div>
      </div>

      {/* Status actions */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {issue.status !== 'done' && (
          <button onClick={() => handleStatusChange('done')} className="px-3 py-1.5 text-xs rounded-lg bg-green/20 text-green hover:bg-green/30 transition-colors">
            Markeer als Done
          </button>
        )}
        {issue.status === 'backlog' && (
          <button onClick={() => handleStatusChange('todo')} className="px-3 py-1.5 text-xs rounded-lg bg-blue/20 text-blue hover:bg-blue/30 transition-colors">
            Zet op To Do
          </button>
        )}
        {issue.status === 'todo' && (
          <button onClick={() => handleStatusChange('in_progress')} className="px-3 py-1.5 text-xs rounded-lg bg-warning/20 text-warning hover:bg-warning/30 transition-colors">
            Start Uitvoering
          </button>
        )}
        {issue.status !== 'cancelled' && issue.status !== 'done' && (
          <button onClick={() => handleStatusChange('cancelled')} className="px-3 py-1.5 text-xs rounded-lg bg-danger/20 text-danger hover:bg-danger/30 transition-colors">
            Annuleer
          </button>
        )}
      </div>

      {/* Description */}
      {issue.description && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Beschrijving</h2>
          <div className="bg-card-bg border border-card-border rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {issue.description}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
          <MessageSquare className="w-4 h-4" />
          Opmerkingen ({comments.length})
        </h2>

        {comments.length === 0 ? (
          <p className="text-sm text-muted bg-card-bg border border-card-border rounded-lg p-4">
            Nog geen opmerkingen
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => {
              const authorName = getAgentName(comment.authorAgentId) || (comment.authorUserId === 'local-board' ? 'Wilco' : 'Onbekend')
              return (
                <div key={comment.id} className="bg-card-bg border border-card-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{authorName}</span>
                    <span className="text-xs text-muted">{relativeTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{comment.body}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* New comment form */}
        <div className="mt-4 flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Schrijf een opmerking..."
            className="flex-1 bg-card-bg border border-card-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted resize-none focus:outline-none focus:border-white/20"
            rows={2}
          />
          <button
            onClick={handleSendComment}
            disabled={!newComment.trim() || sending}
            className="px-4 rounded-lg bg-white/10 text-white hover:bg-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
