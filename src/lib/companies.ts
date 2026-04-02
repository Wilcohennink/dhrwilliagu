// Company configuratie — IDs worden opgehaald van de VPS
// Deze mapping koppelt URL slugs aan Paperclip company IDs

export interface CompanyConfig {
  slug: string
  name: string
  fullName: string
  prefix: string
  color: string
  colorClass: string
  bgClass: string
  domain?: string
  description: string
}

export const COMPANIES: Record<string, CompanyConfig> = {
  board: {
    slug: 'board',
    name: 'Board of Directors',
    fullName: 'Board of Directors',
    prefix: 'WIL',
    color: '#C0C0C0',
    colorClass: 'text-silver',
    bgClass: 'bg-silver',
    description: 'Strategische beslissingen en holding governance',
  },
  the: {
    slug: 'the',
    name: 'Wall of Glory',
    fullName: 'The Wall of Glory',
    prefix: 'THE',
    color: '#D4AF37',
    colorClass: 'text-gold',
    bgClass: 'bg-gold',
    domain: 'thewallofglory.com',
    description: 'Viraal donatie-platform — claim je plek op de muur',
  },
  rev: {
    slug: 'rev',
    name: 'Revenue Lab',
    fullName: 'The Profit Factory',
    prefix: 'REV',
    color: '#22C55E',
    colorClass: 'text-green',
    bgClass: 'bg-green',
    domain: 'theprofitfactory.ai',
    description: 'AI Toolkits en digitale producten — doel: €1M in 10 dagen',
  },
  ksh: {
    slug: 'ksh',
    name: 'KSH',
    fullName: 'KSH Kantoorspecialisten',
    prefix: 'KSH',
    color: '#1A2332',
    colorClass: 'text-navy',
    bgClass: 'bg-navy',
    domain: 'ksh.nl',
    description: 'Kantoormeubelen en kantoorinrichting',
  },
  dos: {
    slug: 'dos',
    name: 'Officestunter',
    fullName: 'De Officestunter',
    prefix: 'DOS',
    color: '#F97316',
    colorClass: 'text-orange',
    bgClass: 'bg-orange',
    domain: 'deofficestunter.nl',
    description: 'Budget kantoormeubelen online',
  },
}

export const COMPANY_SLUGS = Object.keys(COMPANIES)

export function getCompanyBySlug(slug: string): CompanyConfig | undefined {
  return COMPANIES[slug]
}
