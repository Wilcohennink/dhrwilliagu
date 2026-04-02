// Paperclip API helper — alle calls gaan via /api/paperclip proxy naar VPS

const BASE = '/api/paperclip'

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  return res.json() as Promise<T>
}

// Types
export interface Company {
  id: string
  name: string
  status: string
  issuePrefix: string
  issueCounter: number
  budgetMonthlyCents: number
  spentMonthlyCents: number
}

export interface Agent {
  id: string
  companyId: string
  name: string
  role: string
  title: string | null
  icon: string
  status: 'idle' | 'running' | 'error' | 'paused'
  budgetMonthlyCents: number
  spentMonthlyCents: number
  pauseReason: string | null
  lastHeartbeatAt: string | null
  permissions: { canCreateAgents: boolean }
}

export interface Issue {
  id: string
  companyId: string
  title: string
  description: string
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked' | 'cancelled'
  priority: string
  identifier: string
  assigneeAgentId: string | null
  executionAgentNameKey: string | null
  labels: string[]
  labelIds: string[]
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export interface Comment {
  id: string
  body: string
  authorAgentId: string | null
  authorUserId: string | null
  createdAt: string
}

// API calls
export const paperclip = {
  // Companies
  getCompanies: () => api<Company[]>('/companies'),
  getCompany: (id: string) => api<Company>(`/companies/${id}`),

  // Agents
  getAgents: (companyId: string) => api<Agent[]>(`/companies/${companyId}/agents`),
  updateAgent: (agentId: string, data: Partial<Agent>) =>
    api<Agent>(`/agents/${agentId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  triggerHeartbeat: (agentId: string) =>
    api<unknown>(`/agents/${agentId}/heartbeat`, { method: 'POST', body: '{}' }),

  // Issues
  getIssues: (companyId: string) => api<Issue[]>(`/companies/${companyId}/issues`),
  createIssue: (companyId: string, data: { title: string; description: string; status?: string; priority?: string; labels?: string[] }) =>
    api<Issue>(`/companies/${companyId}/issues`, { method: 'POST', body: JSON.stringify(data) }),
  updateIssue: (issueId: string, data: Partial<Issue>) =>
    api<Issue>(`/issues/${issueId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Comments
  getComments: (_companyId: string, issueId: string) =>
    api<Comment[]>(`/issues/${issueId}/comments`),
  addComment: (_companyId: string, issueId: string, body: string) =>
    api<Comment>(`/issues/${issueId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
}
