'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Send, Loader2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { paperclip, type Agent, type Issue, type Comment } from '@/lib/paperclip'
import { AgentAvatar } from './agent-avatar'
import { getPersonaByName } from '@/lib/agents'

interface ChatPanelProps {
  agent: Agent
  companyId: string
  onClose: () => void
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

export function ChatPanel({ agent, companyId, onClose }: ChatPanelProps) {
  const persona = getPersonaByName(agent.name)
  const [issues, setIssues] = useState<Issue[]>([])
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadIssues = useCallback(async () => {
    try {
      const [issueList, agentList] = await Promise.all([
        paperclip.getIssues(companyId),
        paperclip.getAgents(companyId),
      ])
      setAgents(agentList)
      // Toon issues die aan deze agent zijn toegewezen
      const agentIssues = issueList.filter(
        (i: Issue) => i.assigneeAgentId === agent.id || i.executionAgentNameKey?.toLowerCase() === agent.name.toLowerCase()
      )
      setIssues(agentIssues)

      // Auto-select meest recente actieve issue
      if (!selectedIssue && agentIssues.length > 0) {
        const active = agentIssues.find((i: Issue) => i.status === 'in_progress') || agentIssues[0]
        setSelectedIssue(active)
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false)
    }
  }, [companyId, agent.id, agent.name, selectedIssue])

  const loadComments = useCallback(async () => {
    if (!selectedIssue) return
    try {
      const cmts = await paperclip.getComments(companyId, selectedIssue.id)
      setComments(Array.isArray(cmts) ? cmts : [])
      setTimeout(scrollToBottom, 100)
    } catch {
      setComments([])
    }
  }, [companyId, selectedIssue])

  useEffect(() => { loadIssues() }, [loadIssues])
  useEffect(() => { loadComments() }, [loadComments])

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return 'Wilco'
    const a = agents.find(ag => ag.id === agentId)
    return a?.name || 'Agent'
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedIssue) return
    setSending(true)
    try {
      await paperclip.addComment(companyId, selectedIssue.id, newMessage.trim())
      setNewMessage('')
      await loadComments()
    } catch {
      toast.error('Kon bericht niet verzenden')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-card-bg border-l border-card-border z-50 flex flex-col animate-slide-in shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-card-border flex items-center gap-3">
        <AgentAvatar agent={agent} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{agent.name}</p>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: persona?.accentColor || '#22C55E' }}>
            {persona?.title || agent.role}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-muted hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Issue selector */}
      {issues.length > 1 && (
        <div className="px-4 py-2 border-b border-card-border">
          <select
            value={selectedIssue?.id || ''}
            onChange={(e) => {
              const issue = issues.find(i => i.id === e.target.value)
              setSelectedIssue(issue || null)
            }}
            className="w-full bg-background border border-card-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-green/40"
          >
            {issues.map(issue => (
              <option key={issue.id} value={issue.id}>
                {issue.identifier} — {issue.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-muted" />
          </div>
        ) : !selectedIssue ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <MessageSquare className="w-8 h-8 text-muted mb-3" />
            <p className="text-sm text-muted">Geen actieve taken voor {agent.name}</p>
            <p className="text-xs text-muted mt-1">Wijs een taak toe om te chatten</p>
          </div>
        ) : (
          <>
            {/* Issue context */}
            <div className="bg-background rounded-xl p-3 mb-2 border border-card-border">
              <p className="text-[10px] font-mono text-muted mb-1">{selectedIssue.identifier}</p>
              <p className="text-xs font-medium text-white">{selectedIssue.title}</p>
              {selectedIssue.description && (
                <p className="text-[10px] text-muted mt-1 line-clamp-2">{selectedIssue.description}</p>
              )}
            </div>

            {/* Comments as chat messages */}
            {comments.map((comment) => {
              const isAgent = !!comment.authorAgentId
              const authorName = getAgentName(comment.authorAgentId)
              return (
                <div key={comment.id} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                    isAgent
                      ? 'bg-background border border-card-border rounded-bl-sm'
                      : 'bg-green/20 border border-green/20 rounded-br-sm'
                  }`}>
                    <p className="text-[10px] font-medium mb-0.5" style={{ color: isAgent ? (persona?.accentColor || '#22C55E') : '#22C55E' }}>
                      {authorName}
                    </p>
                    <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{comment.body}</p>
                    <p className="text-[9px] text-muted mt-1 text-right">{relativeTime(comment.createdAt)}</p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      {selectedIssue && (
        <div className="p-3 border-t border-card-border">
          <div className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Schrijf een bericht..."
              rows={2}
              className="flex-1 bg-background border border-card-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted resize-none focus:outline-none focus:border-green/40 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="self-end w-9 h-9 rounded-xl bg-green/20 text-green hover:bg-green/30 flex items-center justify-center transition-colors disabled:opacity-40"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
