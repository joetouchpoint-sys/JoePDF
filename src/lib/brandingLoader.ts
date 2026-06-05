import type { BrandingConfig } from '@/types/branding'
import { DEFAULT_BRANDING } from '@/types/branding'

/**
 * Branding priority (highest wins):
 * 1. Deployed brand-config.json  — committed to repo, same for every device
 * 2. DEFAULT_BRANDING            — code-level fallback
 *
 * localStorage is NO LONGER used as the primary store because it is
 * device-specific and causes branding to differ between machines.
 * Admins set branding in the panel, download brand-config.json, and
 * commit it to the repo. The next deployment makes it universal.
 */

const CONFIG_URL = `${import.meta.env.BASE_URL}brand-config.json`

/** Fetch the deployed branding config file. Returns null if not found. */
export async function fetchDeployedConfig(): Promise<BrandingConfig | null> {
  try {
    const res = await fetch(`${CONFIG_URL}?_=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json() as Partial<BrandingConfig>
    return { ...DEFAULT_BRANDING, ...data }
  } catch {
    return null
  }
}

/** Apply branding config to CSS custom properties on :root */
export function applyBrandingToDom(config: BrandingConfig): void {
  const root = document.documentElement
  root.style.setProperty('--color-primary', config.primaryColor)
  root.style.setProperty('--color-secondary', config.secondaryColor)
  root.style.setProperty('--color-accent', config.accentColor)
}

/** Download the current branding config as a brand-config.json file.
 *  Admin commits this file to the repo and redeploys to apply sitewide. */
export function downloadBrandingConfig(config: BrandingConfig): void {
  const json = JSON.stringify(config, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'brand-config.json'
  a.click()
  URL.revokeObjectURL(url)
}
