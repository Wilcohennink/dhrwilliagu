'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Lightbulb, Plus, CheckCircle2, Play, Loader2, User, Bot } from 'lucide-react'
import { toast } from 'sonner'
import { paperclip, type Company, type Agent, type Issue } from '@/lib/paperclip'
import { getCompanyBySlug } from '@/lib/companies'

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  backlog: { label: 'Nieuw', className: 'bg-zinc-500/20 text-zinc-400' },
  todo: { label: 'Goedgekeurd', className: 'bg-blue-500/20 text-blue-400' },
  in_progress: { label: 'In Uitvoering', className: 'bg-yellow-500/20 text-yellow-400' },
  in_review: { label: 'In Review', className: 'bg-purple-500/20 text-purple-400' },
  done: { label: 'Afgerond', className: 'bg-green-500/20 text-green-400' },
  blocked: { label: 'Geblokkeerd', className: 'bg-red-500/20 text-red-400' },
  cancelled: { label: 'Geannuleerd', className: 'bg-zinc-500/20 text-zinc-600' },
}

interface IdeaSection {
  key: string
  title: string
  icon: React.ElementType
  color: string
  filter: (issue: Issue) => boolean
}

export default function BrainstormPage() {
  const params = useParams<{ company: string }>()
  const slug = params.company
  const config = getCompanyBySlug(slug)

  const [companyId, setCompanyId] = useState<string | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [ideaText, setIdeaText] = useState('')

  const fetchData = useCallback(async () => {
    if (!config) return
    try {
      const companies = await paperclip.getCompanies()
      const pc = companies.find(c => c.issuePrefix === config.prefix)
      if (!pc) {
        toast.error(`Bedrijf "${config.prefix}" niet gevonden in Paperclip`)
        setLoading(false)
        return
      }
      setCompanyId(pc.id)
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
  }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ideaText.trim() || !companyId) return
    setSubmitting(true)
    try {
      await paperclip.createIssue(companyId, {
        title: ideaText.trim(),
        description: '',
        status: 'backlog',
        priority: 'medium',
      })
      setIdeaText('')
      toast.success('Idee toegevoegd')
      await fetchData()
    } catch {
      toast.error('Kon idee niet toevoegen')
    } finally {
      setSubmitting(false)
    }
  }

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

  const sections: IdeaSection[] = [
    {
      key: 'new',
      title: 'Nieuwe Ideeen',
      icon: Lightbulb,
      color: 'text-yellow-400',
      filter: (i) => i.status === 'backlog',
    },
    {
      key: 'approved',
      title: 'Goedgekeurd door CEO',
      icon: CheckCircle2,
      color: 'text-blue-400',
      filter: (i) => i.status === 'todo' && !!i.assigneeAgentId,
    },
    {
      key: 'wip',
      title: 'In Uitvoering',
      icon: Play,
      color: 'text-green-400',
      filter: (i) => i.status === 'in_progress',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: config.color + '20' }}
        >
          <Lightbulb className="w-5 h-5" style={{ color: config.color }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">
            Brainstorm
            <span className="text-muted font-normal mx-2">/</span>
            <span style={{ color: config.color }}>{config.name}</span>
          </h1>
          <p className="text-sm text-muted">Voeg ideeen toe die door de CEO beoordeeld worden</p>
        </div>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="bg-card-bg border border-card-border rounded-xl p-4">
        <textarea
          value={ideaText}
          onChange={(e) => setIdeaText(e.target.value)}
          placeholder="Beschrijf je idee..."
          rows={3}
          className="w-full bg-transparent text-white placeholder-zinc-600 text-sm resize-none focus:outline-none"
        />
        <div className="flex justify-end mt-3 pt-3 border-t border-card-border">
          <button
            type="submit"
            disabled={!ideaText.trim() || submitting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: ideaText.trim() ? config.color + '20' : undefined,
              color: ideaText.trim() ? config.color : undefined,
            }}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Toevoegen
          </button>
        </div>
      </form>

      {/* Idea sections */}
      {sections.map(section => {
        const sectionIssues = issues.filter(section.filter)
        const SectionIcon = section.icon
        return (
          <div key={section.key}>
            <div className="flex items-center gap-2 mb-3">
              <SectionIcon className={`w-4 h-4 ${section.color}`} />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h2>
              <span className="text-xs text-muted bg-white/5 px-1.5 py-0.5 rounded-md ml-1">
                {sectionIssues.length}
              </span>
            </div>
            {sectionIssues.length === 0 ? (
              <div className="text-xs text-muted text-center py-8 bg-card-bg border border-dashed border-card-border rounded-xl">
                Geen items
              </div>
            ) : (
              <div className="space-y-2">
                {sectionIssues.map(issue => {
                  const assignee = issue.assigneeAgentId ? agentMap[issue.assigneeAgentId] : null
                  const badge = STATUS_BADGES[issue.status] || STATUS_BADGES.backlog
                  return (
                    <div
                      key={issue.id}
                      className="bg-card-bg border border-card-border rounded-xl p-4 hover:border-card-hover transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted">{issue.identifier}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                        {assignee && (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Bot className="w-3 h-3" />
                            <span>{assignee.name}</span>
                          </div>
                        )}
                        {!assignee && issue.status === 'backlog' && (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted">
                            <User className="w-3 h-3" />
                            <span>Wilco</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-white leading-snug">
                        {issue.title}
                      </p>
                      {issue.description && (
                        <p className="text-xs text-muted mt-1.5 line-clamp-2">
                          {issue.description}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
