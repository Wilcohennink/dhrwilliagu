'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Loader2 } from 'lucide-react'
import { paperclip, type Company, type Agent } from '@/lib/paperclip'
import { COMPANY } from '@/lib/companies'
import { AgentCard } from '@/components/agent-avatar'
import { ChatPanel } from '@/components/chat-panel'

export default function ChatPage() {
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [chatAgent, setChatAgent] = useState<Agent | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const companies = await paperclip.getCompanies()
      const matched = companies.find((c: Company) => c.issuePrefix === COMPANY.prefix)
      if (!matched) { setLoading(false); return }
      setCompanyId(matched.id)
      const agentData = await paperclip.getAgents(matched.id)
      setAgents(agentData)
    } catch {
      // Silently handle
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-8 h-8 text-green animate-spin" />
      </div>
    )
  }

  return (
    <div className={`max-w-4xl mx-auto ${chatAgent ? 'mr-96' : ''} transition-all duration-300`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-green" />
          Chat met Agents
        </h1>
        <p className="text-sm text-muted mt-1">Selecteer een agent om te chatten over hun taken</p>
      </div>

      {/* Agent selection grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {agents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onClick={() => setChatAgent(chatAgent?.id === agent.id ? null : agent)}
            isActive={chatAgent?.id === agent.id}
          />
        ))}
      </div>

      {agents.length === 0 && (
        <div className="bg-card-bg border border-card-border rounded-2xl p-12 text-center">
          <MessageSquare className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-muted">Geen agents gevonden</p>
        </div>
      )}

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
