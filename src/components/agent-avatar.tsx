'use client'

import { getPersonaByName, type AgentPersona } from '@/lib/agents'
import type { Agent } from '@/lib/paperclip'

interface AgentAvatarProps {
  agent: Agent
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showStatus?: boolean
  showProps?: boolean
  onClick?: () => void
  className?: string
}

const SIZES = {
  sm: { container: 'w-10 h-10', emoji: 'text-lg', dot: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5', props: 'hidden' },
  md: { container: 'w-14 h-14', emoji: 'text-2xl', dot: 'w-3 h-3 -bottom-0.5 -right-0.5', props: 'text-xs' },
  lg: { container: 'w-20 h-20', emoji: 'text-4xl', dot: 'w-3.5 h-3.5 bottom-0 right-0', props: 'text-sm' },
  xl: { container: 'w-28 h-28', emoji: 'text-5xl', dot: 'w-4 h-4 bottom-0.5 right-0.5', props: 'text-base' },
}

export function AgentAvatar({ agent, size = 'md', showStatus = true, showProps = false, onClick, className = '' }: AgentAvatarProps) {
  const persona = getPersonaByName(agent.name)
  const s = SIZES[size]

  const statusClass = agent.status === 'running' ? 'status-running'
    : agent.status === 'error' ? 'status-error'
    : agent.status === 'paused' ? 'status-paused'
    : 'status-idle'

  return (
    <div
      className={`relative inline-flex flex-col items-center ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Avatar circle */}
      <div className={`${s.container} rounded-2xl bg-gradient-to-br ${persona?.bgGradient || 'from-zinc-800/30 to-zinc-900/20'} border border-white/10 flex items-center justify-center relative transition-all duration-200 ${onClick ? 'hover:scale-110 hover:border-green/40 hover:shadow-lg hover:shadow-green/10' : ''}`}>
        <span className={s.emoji}>{persona?.emoji || agent.icon || '\u{1F916}'}</span>

        {/* Status dot */}
        {showStatus && (
          <span className={`absolute ${s.dot} rounded-full border-2 border-background ${statusClass}`} />
        )}
      </div>

      {/* Floating props */}
      {showProps && persona && (size === 'lg' || size === 'xl') && (
        <div className="absolute -top-1 -right-3 flex gap-0.5">
          {persona.props.map((prop, i) => (
            <span key={i} className={`${s.props} opacity-60`}>{prop}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export function AgentCard({ agent, persona, onClick, isActive }: {
  agent: Agent
  persona?: AgentPersona
  onClick?: () => void
  isActive?: boolean
}) {
  const p = persona || getPersonaByName(agent.name)

  return (
    <button
      onClick={onClick}
      className={`group relative bg-card-bg border rounded-2xl p-4 transition-all duration-200 text-left w-full card-glow ${
        isActive
          ? 'border-green/40 shadow-lg shadow-green/5'
          : 'border-card-border hover:border-white/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <AgentAvatar agent={agent} size="md" showProps />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-white truncate">{agent.name}</span>
            <span
              className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: (p?.accentColor || '#22C55E') + '20', color: p?.accentColor || '#22C55E' }}
            >
              {p?.title || agent.role}
            </span>
          </div>
          <p className="text-xs text-muted truncate">{p?.description || agent.title || ''}</p>

          {/* Current task indicator */}
          {agent.status === 'running' && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
              <span className="text-[10px] text-green font-medium">Bezig met taak...</span>
            </div>
          )}
          {agent.status === 'error' && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-danger" />
              <span className="text-[10px] text-danger font-medium">Fout opgetreden</span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
