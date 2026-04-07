// Company configuratie — alleen KSH (B2B + B2C via De Officestunter)

export interface CompanyConfig {
  slug: string
  name: string
  fullName: string
  prefix: string
  color: string
  accentColor: string
  domain?: string
  description: string
}

export const COMPANY: CompanyConfig = {
  slug: 'ksh',
  name: 'KSH',
  fullName: 'KSH Kantoorspecialisten',
  prefix: 'KSH',
  color: '#1A2332',
  accentColor: '#22C55E',
  domain: 'ksh.nl',
  description: 'Kantoormeubelen B2B + De Officestunter B2C',
}

// Backward compat
export const COMPANIES: Record<string, CompanyConfig> = {
  ksh: COMPANY,
}

export const COMPANY_SLUGS = ['ksh']

export function getCompanyBySlug(slug: string): CompanyConfig | undefined {
  return COMPANIES[slug]
}
