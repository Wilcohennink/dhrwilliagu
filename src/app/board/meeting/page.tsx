'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Crown, Send, Loader2, Users, Brain,
  Rocket, Trophy, Building2, ShoppingBag, Sparkles,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { paperclip, type Company, type Agent, type Issue, type Comment } from '@/lib/paperclip'

interface ChatMessage {
  id: string
  author: string
  authorRole: string
  company: string
  companyColor: string
  text: string
  timestamp: string
  isHuman?: boolean
}

const COMPANY_COLORS: Record<string, string> = {
  WIL: '#C0C0C0',
  THE: '#D4AF37',
  REV: '#22C55E',
  KSH: '#3B82F6',
  DOS: '#F97316',
}

const COMPANY_ICONS: Record<string, React.ElementType> = {
  WIL: Crown,
  THE: Trophy,
  REV: Rocket,
  KSH: Building2,
  DOS: ShoppingBag,
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'zojuist'
  if (mins < 60) return `${mins}m geleden`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}u geleden`
  return `${Math.floor(hours / 24)}d geleden`
}

export default function BoardMeetingPage() {
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [boardCompanyId, setBoardCompanyId] = useState<string | null>(null)
  const [participants, setParticipants] = useState<{ name: string; role: string; company: string; status: string }[]>([])
  const [showParticipants, setShowParticipants] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadData = useCallback(async () => {
    try {
      const companies = await paperclip.getCompanies()
      const boardCo = companies.find((c: Company) => c.issuePrefix === 'WIL' || c.issuePrefix === 'BOD')

      if (!boardCo) {
        setLoading(false)
        return
      }

      setBoardCompanyId(boardCo.id)

      // Haal board meeting issue op (of maak er een)
      const issues = await paperclip.getIssues(boardCo.id)
      let meetingIssue = issues.find((i: Issue) => i.title.includes('Board Meeting') && i.status !== 'cancelled' && i.status !== 'done')

      if (!meetingIssue) {
        // Maak een permanente board meeting issue aan
        meetingIssue = await paperclip.createIssue(boardCo.id, {
          title: 'Board Meeting — Doorlopende Vergadering',
          description: 'Centrale vergaderruimte voor het Board of Directors. Hier bespreken Wilco, de Board agents en alle CEO\'s strategische beslissingen, resultaten en nieuwe ideeen.',
          status: 'in_progress',
          priority: 'critical',
        })
      }

      // Haal comments op als chat berichten
      if (meetingIssue) {
        const comments = await paperclip.getComments(boardCo.id, meetingIssue.id)

        // Haal alle agents op om namen te resolven
        const allAgents: Agent[] = []
        const agentCompanyMap: Record<string, string> = {}

        for (const company of companies) {
          const agents = await paperclip.getAgents(company.id)
          allAgents.push(...agents)
          agents.forEach((a: Agent) => { agentCompanyMap[a.id] = company.issuePrefix })
        }

        // Bouw participant list: Board agents + alle CEO's
        const boardAgents = allAgents.filter(a => a.companyId === boardCo.id)
        const ceoAgents = allAgents.filter(a => a.role === 'ceo' && a.companyId !== boardCo.id)

        const parts = [
          { name: 'Wilco', role: 'Eigenaar', company: 'WIL', status: 'online' },
          ...boardAgents.map(a => ({
            name: a.name,
            role: a.title || a.role,
            company: 'WIL',
            status: a.status,
          })),
          ...ceoAgents.map(a => ({
            name: a.name,
            role: a.title || a.role,
            company: agentCompanyMap[a.id] || '?',
            status: a.status,
          })),
        ]
        setParticipants(parts)

        // Zet comments om naar chat messages
        const chatMessages: ChatMessage[] = (Array.isArray(comments) ? comments : []).map((c: Comment) => {
          const agent = allAgents.find(a => a.id === c.authorAgentId)
          const isHuman = c.authorUserId === 'local-board' || (!c.authorAgentId && !c.authorUserId)
          const companyPrefix = agent ? (agentCompanyMap[agent.id] || 'WIL') : 'WIL'

          return {
            id: c.id,
            author: isHuman ? 'Wilco' : (agent?.name || 'Onbekend'),
            authorRole: isHuman ? 'Eigenaar' : (agent?.role || 'agent'),
            company: companyPrefix,
            companyColor: COMPANY_COLORS[companyPrefix] || '#71717A',
            text: c.body,
            timestamp: c.createdAt,
            isHuman,
          }
        })

        setMessages(chatMessages)
      }
    } catch (err) {
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [loadData])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || !boardCompanyId) return
    setSending(true)
    try {
      const issues = await paperclip.getIssues(boardCompanyId)
      const meetingIssue = issues.find((i: Issue) => i.title.includes('Board Meeting') && i.status !== 'cancelled' && i.status !== 'done')
      if (!meetingIssue) { toast.error('Geen actieve vergadering gevonden'); return }

      await paperclip.addComment(boardCompanyId, meetingIssue.id, newMessage.trim())
      setNewMessage('')
      toast.success('Bericht verzonden')
      loadData()
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-4">
      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-card-border mb-4">
          <div className="flex items-center gap-3">
            <Link href="/board" className="text-muted hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Crown className="w-5 h-5 text-silver" />
            <div>
              <h1 className="text-lg font-bold text-white">Board Meeting</h1>
              <p className="text-xs text-muted">{participants.length} deelnemers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowParticipants(!showParticipants)} className="p-2 rounded-lg bg-white/5 text-muted hover:text-white hover:bg-white/10">
              <Users className="w-4 h-4" />
            </button>
            <button onClick={loadData} className="p-2 rounded-lg bg-white/5 text-muted hover:text-white hover:bg-white/10">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Sparkles className="w-10 h-10 text-muted mb-3" />
              <p className="text-muted text-sm">De vergadering is geopend.</p>
              <p className="text-muted text-xs mt-1">Typ een bericht om de discussie te starten.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const CompanyIcon = COMPANY_ICONS[msg.company] || Crown
              return (
                <div key={msg.id} className={`flex gap-3 ${msg.isHuman ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ backgroundColor: msg.companyColor + '20', color: msg.companyColor }}
                  >
                    {msg.author[0]}
                  </div>

                  {/* Message bubble */}
                  <div className={`max-w-[70%] ${msg.isHuman ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-white">{msg.author}</span>
                      <CompanyIcon className="w-3 h-3" style={{ color: msg.companyColor }} />
                      <span className="text-[10px] text-muted">{msg.authorRole}</span>
                      <span className="text-[10px] text-muted">{relativeTime(msg.timestamp)}</span>
                    </div>
                    <div className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                      msg.isHuman
                        ? 'bg-blue/20 text-white border border-blue/30'
                        : 'bg-card-bg border border-card-border text-foreground'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="mt-4 pt-4 border-t border-card-border">
          <div className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Typ je bericht... (Enter om te verzenden)"
              className="flex-1 bg-card-bg border border-card-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted resize-none focus:outline-none focus:border-white/20"
              rows={2}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="px-4 rounded-lg bg-silver/20 text-silver hover:bg-silver/30 transition-colors disabled:opacity-50 self-end"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Participants sidebar */}
      {showParticipants && (
        <div className="w-56 border-l border-card-border pl-4 shrink-0">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Deelnemers</h3>
          <div className="space-y-2">
            {participants.map((p, i) => {
              const color = COMPANY_COLORS[p.company] || '#71717A'
              return (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      p.status === 'running' ? 'bg-green' :
                      p.status === 'online' ? 'bg-green' :
                      p.status === 'idle' ? 'bg-muted' :
                      'bg-danger'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{p.name}</p>
                    <p className="text-[10px] truncate" style={{ color }}>{p.role}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
