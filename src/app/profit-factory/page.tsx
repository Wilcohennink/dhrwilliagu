"use client"

import { useState } from "react"
import {
  Factory, Users, CheckCircle, Clock, AlertCircle,
  Bot, Send, DollarSign, TrendingUp, Filter
} from "lucide-react"

const COMPANY_ID = "37025077-cb95-4410-8a6c-a7b6c05b3da2"

const agents = [
  { name: "Strategist", role: "Business Strategy", status: "active" },
  { name: "Copywriter", role: "Content Creation", status: "active" },
  { name: "Analyst", role: "Data Analysis", status: "active" },
  { name: "Designer", role: "UI/UX Design", status: "idle" },
  { name: "Developer", role: "Frontend Dev", status: "active" },
  { name: "Backend Dev", role: "API Development", status: "active" },
  { name: "SEO Expert", role: "Search Optimization", status: "idle" },
  { name: "Ad Manager", role: "Paid Advertising", status: "active" },
  { name: "Social Media", role: "Social Management", status: "active" },
  { name: "Email Marketer", role: "Email Campaigns", status: "idle" },
  { name: "Video Editor", role: "Video Production", status: "active" },
  { name: "QA Tester", role: "Quality Assurance", status: "idle" },
  { name: "DevOps", role: "Infrastructure", status: "active" },
  { name: "PM", role: "Project Management", status: "active" },
  { name: "Sales Agent", role: "Sales Outreach", status: "idle" },
]

const tasks = [
  { id: 1, title: "Landing page redesign", status: "done", agent: "Designer" },
  { id: 2, title: "API integratie opzetten", status: "in_progress", agent: "Backend Dev" },
  { id: 3, title: "SEO audit uitvoeren", status: "todo", agent: "SEO Expert" },
  { id: 4, title: "Email funnel bouwen", status: "in_progress", agent: "Email Marketer" },
  { id: 5, title: "A/B test campagne", status: "done", agent: "Ad Manager" },
  { id: 6, title: "Video tutorials maken", status: "todo", agent: "Video Editor" },
  { id: 7, title: "Database optimalisatie", status: "in_progress", agent: "DevOps" },
  { id: 8, title: "Pricing pagina bouwen", status: "done", agent: "Developer" },
]

type TaskFilter = "all" | "todo" | "in_progress" | "done"

export default function ProfitFactoryPage() {
  const [filter, setFilter] = useState<TaskFilter>("all")
  const [chatMessage, setChatMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([
    { role: "system", content: "Welkom bij The Profit Factory. Hoe kan ik je helpen?" },
  ])

  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => t.status === filter)
  const activeAgents = agents.filter((a) => a.status === "active").length

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return
    setChatMessages((prev) => [...prev, { role: "user", content: chatMessage }])
    setChatMessage("")
    // Simulate response
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { role: "system", content: "Ik verwerk je verzoek. Even geduld..." },
      ])
    }, 1000)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
          <Factory className="w-7 h-7 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">The Profit Factory</h1>
          <p className="text-muted text-sm">theprofitfactory.ai &middot; Company ID: {COMPANY_ID.slice(0, 8)}...</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card-bg border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted text-sm mb-2">
            <Users className="w-4 h-4" /> Team
          </div>
          <p className="text-2xl font-bold text-white">{agents.length}</p>
        </div>
        <div className="bg-card-bg border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted text-sm mb-2">
            <Bot className="w-4 h-4" /> Actieve Agents
          </div>
          <p className="text-2xl font-bold text-amber-400">{activeAgents}</p>
        </div>
        <div className="bg-card-bg border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted text-sm mb-2">
            <CheckCircle className="w-4 h-4" /> Tasks Klaar
          </div>
          <p className="text-2xl font-bold text-white">{tasks.filter((t) => t.status === "done").length}/{tasks.length}</p>
        </div>
        <div className="bg-card-bg border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted text-sm mb-2">
            <DollarSign className="w-4 h-4" /> Revenue
          </div>
          <p className="text-2xl font-bold text-amber-400">--</p>
          <p className="text-xs text-muted">Binnenkort beschikbaar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Team Overview */}
        <div className="bg-card-bg border border-card-border rounded-xl p-5">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" /> Team Overview
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {agents.map((agent) => (
              <div key={agent.name} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">{agent.name}</p>
                  <p className="text-xs text-muted">{agent.role}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  agent.status === "active"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-white/10 text-muted"
                }`}>
                  {agent.status === "active" ? "Actief" : "Idle"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Task Board */}
        <div className="bg-card-bg border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-amber-400" /> Task Board
            </h2>
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-muted" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as TaskFilter)}
                className="bg-white/5 border border-card-border rounded-md text-xs text-muted px-2 py-1 outline-none"
              >
                <option value="all">Alle</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Klaar</option>
              </select>
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                {task.status === "done" && <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />}
                {task.status === "in_progress" && <Clock className="w-4 h-4 text-amber-400 shrink-0" />}
                {task.status === "todo" && <AlertCircle className="w-4 h-4 text-muted shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{task.title}</p>
                  <p className="text-xs text-muted">{task.agent}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="bg-card-bg border border-card-border rounded-xl p-5 flex flex-col">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Bot className="w-4 h-4 text-amber-400" /> Agent Chat
          </h2>
          <div className="flex-1 space-y-3 max-h-80 overflow-y-auto mb-4">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm px-3 py-2 rounded-lg ${
                  msg.role === "user"
                    ? "bg-amber-500/10 text-amber-200 ml-8"
                    : "bg-white/5 text-white mr-8"
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Bericht aan agents..."
              className="flex-1 bg-white/5 border border-card-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted outline-none focus:border-amber-500/50"
            />
            <button
              onClick={handleSendMessage}
              className="bg-amber-500/20 text-amber-400 p-2 rounded-lg hover:bg-amber-500/30 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Revenue Tracker Placeholder */}
      <div className="mt-6 bg-card-bg border border-card-border rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" /> Revenue Tracker
        </h2>
        <div className="flex items-center justify-center h-40 text-muted text-sm">
          Revenue tracking wordt binnenkort toegevoegd
        </div>
      </div>
    </div>
  )
}
