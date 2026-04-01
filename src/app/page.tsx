import Link from "next/link"
import { Factory, Trophy, Users, CheckCircle, Bot, ExternalLink } from "lucide-react"

const projects = [
  {
    name: "The Profit Factory",
    domain: "theprofitfactory.ai",
    href: "/profit-factory",
    icon: Factory,
    color: "amber",
    gradient: "from-amber-500/20 to-amber-600/5",
    borderColor: "border-amber-500/30",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    teamSize: 15,
    tasksDone: 42,
    tasksTotal: 67,
    agentsActive: 8,
  },
  {
    name: "The Wall of Glory",
    domain: "thewallofglory.com",
    href: "/wall-of-glory",
    icon: Trophy,
    color: "purple",
    gradient: "from-purple-500/20 to-purple-600/5",
    borderColor: "border-purple-500/30",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
    teamSize: 11,
    tasksDone: 28,
    tasksTotal: 45,
    agentsActive: 5,
  },
]

export default function DashboardPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-muted mt-1">Overzicht van alle projecten</p>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project) => {
          const Icon = project.icon
          return (
            <div
              key={project.name}
              className={`bg-card-bg border border-card-border rounded-xl p-6 hover:${project.borderColor} transition-colors`}
            >
              {/* Project Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${project.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${project.iconColor}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{project.name}</h2>
                    <a
                      href={`https://${project.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {project.domain}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-muted" />
                    <span className="text-xs text-muted">Team</span>
                  </div>
                  <p className="text-xl font-bold text-white">{project.teamSize}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-muted" />
                    <span className="text-xs text-muted">Tasks</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {project.tasksDone}<span className="text-sm text-muted font-normal">/{project.tasksTotal}</span>
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="w-4 h-4 text-muted" />
                    <span className="text-xs text-muted">Actief</span>
                  </div>
                  <p className="text-xl font-bold text-white">{project.agentsActive}</p>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted">Voortgang</span>
                  <span className="text-white font-medium">
                    {Math.round((project.tasksDone / project.tasksTotal) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${project.color === "amber" ? "bg-amber-500" : "bg-purple-500"}`}
                    style={{ width: `${(project.tasksDone / project.tasksTotal) * 100}%` }}
                  />
                </div>
              </div>

              {/* Quick Link */}
              <Link
                href={project.href}
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  project.color === "amber"
                    ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                    : "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                }`}
              >
                Open Project
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
