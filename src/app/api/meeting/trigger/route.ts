import { NextRequest, NextResponse } from 'next/server'

const PAPERCLIP_URL = process.env.PAPERCLIP_URL || 'http://204.168.221.20:3101'

interface Agent {
  id: string
  name: string
  role: string
  companyId: string
}

interface Company {
  id: string
  name: string
  issuePrefix: string
}

// Trigger Board agents + all CEO's to respond to a Board Meeting message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const message = body.message || ''

    const companiesRes = await fetch(`${PAPERCLIP_URL}/api/companies`)
    const companies: Company[] = await companiesRes.json()

    const toTrigger: { name: string; id: string }[] = []

    for (const company of companies) {
      const agentsRes = await fetch(`${PAPERCLIP_URL}/api/companies/${company.id}/agents`)
      const agents: Agent[] = await agentsRes.json()

      // Board: trigger all agents (Visionary, Chairman, Atlas)
      if (company.issuePrefix === 'WIL' || company.issuePrefix === 'BOD') {
        agents.forEach(a => toTrigger.push({ name: a.name, id: a.id }))
      } else {
        // Other companies: trigger CEO's only
        agents.filter(a => a.role === 'ceo').forEach(a => toTrigger.push({ name: a.name, id: a.id }))
      }
    }

    // Trigger agents sequentially (not all at once to avoid rate limits)
    const results: { name: string; ok: boolean }[] = []
    for (const agent of toTrigger) {
      try {
        // Try to trigger via assignment - create/update the meeting issue comment context
        const res = await fetch(`${PAPERCLIP_URL}/api/agents/${agent.id}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: 'board_meeting_message',
            context: `Nieuw bericht in de Board Meeting van Wilco: "${message.substring(0, 200)}". Lees de Board Meeting comments en reageer met je perspectief.`,
          }),
          signal: AbortSignal.timeout(5000),
        })

        if (!res.ok) {
          // Fallback: try heartbeat
          const hbRes = await fetch(`${PAPERCLIP_URL}/api/agents/${agent.id}/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
            signal: AbortSignal.timeout(5000),
          })
          results.push({ name: agent.name, ok: hbRes.ok })
        } else {
          results.push({ name: agent.name, ok: true })
        }
      } catch {
        results.push({ name: agent.name, ok: false })
      }
    }

    return NextResponse.json({
      triggered: results.filter(r => r.ok).length,
      total: toTrigger.length,
      results,
    })
  } catch {
    return NextResponse.json({ error: 'Trigger failed' }, { status: 500 })
  }
}
