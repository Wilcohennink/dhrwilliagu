import { NextRequest, NextResponse } from 'next/server'

const PAPERCLIP_URL = process.env.PAPERCLIP_URL || 'http://204.168.221.20:3101'

// Agents die elke 15 min getriggered worden: Brainstormers + CEO's
// IDs worden dynamisch opgehaald op basis van rol
const TRIGGER_ROLES = ['ceo', 'researcher'] // CEO's + Brainstormers

interface Agent {
  id: string
  name: string
  role: string
  companyId: string
  status: string
}

interface Company {
  id: string
  name: string
  issuePrefix: string
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: { company: string; agent: string; role: string; ok: boolean; error?: string }[] = []

  try {
    // Haal alle companies op
    const companiesRes = await fetch(`${PAPERCLIP_URL}/api/companies`)
    const companies: Company[] = await companiesRes.json()

    for (const company of companies) {
      // Haal agents op per company
      const agentsRes = await fetch(`${PAPERCLIP_URL}/api/companies/${company.id}/agents`)
      const agents: Agent[] = await agentsRes.json()

      // Auto-recovery: reset error agents zodat ze weer kunnen werken
      const errorAgents = agents.filter(a => a.status === 'error')
      for (const agent of errorAgents) {
        try {
          await fetch(`${PAPERCLIP_URL}/api/agents/${agent.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'idle' }),
          })
        } catch { /* ignore */ }
      }

      // Filter op CEO's en Brainstormers (researchers)
      const toTrigger = agents.filter(a => TRIGGER_ROLES.includes(a.role))

      for (const agent of toTrigger) {
        try {
          // Probeer heartbeat, fallback naar run
          let res = await fetch(`${PAPERCLIP_URL}/api/agents/${agent.id}/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
            signal: AbortSignal.timeout(10000),
          })

          if (!res.ok) {
            res = await fetch(`${PAPERCLIP_URL}/api/agents/${agent.id}/run`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: '{}',
              signal: AbortSignal.timeout(10000),
            })
          }

          results.push({
            company: company.issuePrefix,
            agent: agent.name,
            role: agent.role,
            ok: res.ok,
          })
        } catch (err) {
          results.push({
            company: company.issuePrefix,
            agent: agent.name,
            role: agent.role,
            ok: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          })
        }
      }
    }

    const okCount = results.filter(r => r.ok).length
    const failCount = results.filter(r => !r.ok).length

    return NextResponse.json({
      message: `Heartbeats triggered: ${okCount} OK, ${failCount} failed`,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({
      error: 'Paperclip niet bereikbaar',
      details: err instanceof Error ? err.message : 'Unknown',
    }, { status: 502 })
  }
}
