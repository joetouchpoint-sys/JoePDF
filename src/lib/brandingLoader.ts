import type { BrandingConfig } from '@/types/branding'
import { DEFAULT_BRANDING } from '@/types/branding'

const STORAGE_KEY = 'joepdf_branding'

export function loadBranding(): BrandingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_BRANDING
    const parsed = JSON.parse(raw) as Partial<BrandingConfig>
    return { ...DEFAULT_BRANDING, ...parsed }
  } catch {
    return DEFAULT_BRANDING
  }
}

export function saveBranding(config: BrandingConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // Ignore storage quota errors
  }
}

export function clearBranding(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/** Apply branding config to CSS custom properties on :root */
export function applyBrandingToDom(config: BrandingConfig): void {
  const root = document.documentElement
  root.style.setProperty('--color-primary', config.primaryColor)
  root.style.setProperty('--color-secondary', config.secondaryColor)
  root.style.setProperty('--color-accent', config.accentColor)
}
