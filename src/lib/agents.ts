// Agent persona definities met emoji-avatars en visuele kenmerken

export interface AgentPersona {
  name: string
  role: string
  title: string
  emoji: string
  bgGradient: string
  accentColor: string
  props: string[] // Visuele props naast het karakter
  description: string
}

export const AGENT_PERSONAS: Record<string, AgentPersona> = {
  michel: {
    name: 'Michel',
    role: 'ceo',
    title: 'CEO',
    emoji: '\u{1F935}',
    bgGradient: 'from-amber-900/30 to-yellow-900/20',
    accentColor: '#EAB308',
    props: ['\u{1F454}', '\u{1F4BC}'],
    description: 'Strategisch leider, overziet alle operaties',
  },
  sandra: {
    name: 'Sandra',
    role: 'qa',
    title: 'QA Manager',
    emoji: '\u{1F575}\u{FE0F}\u{200D}\u{2640}\u{FE0F}',
    bgGradient: 'from-purple-900/30 to-indigo-900/20',
    accentColor: '#A855F7',
    props: ['\u{1F50D}', '\u{2705}'],
    description: 'Kwaliteitsbewaker, test alles tot het perfect is',
  },
  thomas: {
    name: 'Thomas',
    role: 'cto',
    title: 'CTO',
    emoji: '\u{1F468}\u{200D}\u{1F4BB}',
    bgGradient: 'from-blue-900/30 to-cyan-900/20',
    accentColor: '#3B82F6',
    props: ['\u{1F4BB}', '\u{2699}\u{FE0F}'],
    description: 'Tech architect, bouwt de infrastructuur',
  },
  rick: {
    name: 'Rick',
    role: 'engineer',
    title: 'Engineer',
    emoji: '\u{1F477}',
    bgGradient: 'from-orange-900/30 to-red-900/20',
    accentColor: '#F97316',
    props: ['\u{1F527}', '\u{1F6E0}\u{FE0F}'],
    description: 'Bouwt en repareert, hands-on developer',
  },
  dennis: {
    name: 'Dennis',
    role: 'devops',
    title: 'DevOps',
    emoji: '\u{1F468}\u{200D}\u{1F4BB}',
    bgGradient: 'from-emerald-900/30 to-teal-900/20',
    accentColor: '#10B981',
    props: ['\u{1F5A5}\u{FE0F}', '\u{1F4CA}'],
    description: 'Server guardian, monitoring en deployment',
  },
  eva: {
    name: 'Eva',
    role: 'ads',
    title: 'Advertising',
    emoji: '\u{1F469}\u{200D}\u{1F4BC}',
    bgGradient: 'from-pink-900/30 to-rose-900/20',
    accentColor: '#EC4899',
    props: ['\u{1F4E3}', '\u{1F4C8}'],
    description: 'Ads specialist, Meta & Google campagnes',
  },
  lars: {
    name: 'Lars',
    role: 'seo',
    title: 'SEO Specialist',
    emoji: '\u{1F50E}',
    bgGradient: 'from-cyan-900/30 to-blue-900/20',
    accentColor: '#06B6D4',
    props: ['\u{1F310}', '\u{1F4DD}'],
    description: 'Zoekwoorden expert, organisch verkeer groei',
  },
  linda: {
    name: 'Linda',
    role: 'sales',
    title: 'Sales Manager',
    emoji: '\u{1F469}\u{200D}\u{1F4BC}',
    bgGradient: 'from-green-900/30 to-emerald-900/20',
    accentColor: '#22C55E',
    props: ['\u{1F91D}', '\u{1F4DE}'],
    description: 'Verkoopster, bouwt klantrelaties',
  },
  jasper: {
    name: 'Jasper',
    role: 'business',
    title: 'New Business',
    emoji: '\u{1F468}\u{200D}\u{1F680}',
    bgGradient: 'from-violet-900/30 to-purple-900/20',
    accentColor: '#8B5CF6',
    props: ['\u{1F680}', '\u{1F52D}'],
    description: 'Verkent nieuwe markten en kansen',
  },
  femke: {
    name: 'Femke',
    role: 'support',
    title: 'Klantenservice',
    emoji: '\u{1F469}\u{200D}\u{1F4BB}',
    bgGradient: 'from-sky-900/30 to-blue-900/20',
    accentColor: '#0EA5E9',
    props: ['\u{1F3A7}', '\u{1F4AC}'],
    description: 'Helpt klanten met een glimlach',
  },
  tom: {
    name: 'Tom',
    role: 'finance',
    title: 'Finance',
    emoji: '\u{1F468}\u{200D}\u{1F4BC}',
    bgGradient: 'from-slate-800/30 to-gray-900/20',
    accentColor: '#64748B',
    props: ['\u{1F4B0}', '\u{1F9EE}'],
    description: 'Financieel beheer, facturen en boekhouding',
  },
  daphne: {
    name: 'Daphne',
    role: 'logistics',
    title: 'Logistiek',
    emoji: '\u{1F469}\u{200D}\u{1F4CB}',
    bgGradient: 'from-amber-900/30 to-orange-900/20',
    accentColor: '#D97706',
    props: ['\u{1F4CB}', '\u{1F69A}'],
    description: 'Regelt leveringen en voorraadbeheer',
  },
  koen: {
    name: 'Koen',
    role: 'purchasing',
    title: 'Inkoop',
    emoji: '\u{1F468}\u{200D}\u{1F4BC}',
    bgGradient: 'from-teal-900/30 to-emerald-900/20',
    accentColor: '#14B8A6',
    props: ['\u{1F6D2}', '\u{1F91D}'],
    description: 'Inkoopspecialist, leveranciersrelaties',
  },
  julia: {
    name: 'Julia',
    role: 'designer',
    title: 'Designer',
    emoji: '\u{1F469}\u{200D}\u{1F3A8}',
    bgGradient: 'from-fuchsia-900/30 to-pink-900/20',
    accentColor: '#D946EF',
    props: ['\u{1F3A8}', '\u{270F}\u{FE0F}'],
    description: 'Creatief brein, ontwerpt alles visueel',
  },
  sanne: {
    name: 'Sanne',
    role: 'marketplace',
    title: 'Marketplace',
    emoji: '\u{1F6CD}\u{FE0F}',
    bgGradient: 'from-rose-900/30 to-red-900/20',
    accentColor: '#F43F5E',
    props: ['\u{1F6CD}\u{FE0F}', '\u{1F4E6}'],
    description: 'Beheert Bol.com en Amazon kanalen',
  },
}

export const AGENT_NAMES = Object.keys(AGENT_PERSONAS)

export function getPersonaByName(name: string): AgentPersona | undefined {
  const key = name.toLowerCase()
  return AGENT_PERSONAS[key]
}
