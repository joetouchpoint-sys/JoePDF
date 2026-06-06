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

function pdfFontToCss(family: string): string {
  switch (family.toLowerCase()) {
    case 'helvetica': return "'Helvetica Neue', Helvetica, Arial, sans-serif"
    case 'times-roman': case 'times': return "'Times New Roman', Times, serif"
    case 'courier': return "'Courier New', Courier, monospace"
    case 'arial': return 'Arial, Helvetica, sans-serif'
    case 'georgia': return "Georgia, 'Times New Roman', serif"
    case 'verdana': return 'Verdana, Geneva, sans-serif'
    default: return family
  }
}

/** Apply branding config to CSS custom properties on :root and inject custom font if set */
export function applyBrandingToDom(config: BrandingConfig): void {
  const root = document.documentElement
  root.style.setProperty('--color-primary', config.primaryColor)
  root.style.setProperty('--color-secondary', config.secondaryColor)
  root.style.setProperty('--color-accent', config.accentColor)

  // Font custom properties — used globally via index.css
  root.style.setProperty('--font-heading', config.headingFontFamily)
  const bodyBase64 = config.bodyCustomFontBase64 ?? config.customFontBase64
  const bodyName = (config.bodyCustomFontBase64 ? config.bodyCustomFontName : config.customFontName) || ''
  root.style.setProperty('--font-body', bodyBase64 && bodyName ? bodyName : pdfFontToCss(config.bodyFontFamily))

  // Inject custom @font-face rules for heading and body fonts
  document.getElementById('joepdf-custom-font')?.remove()

  const headingBase64 = config.headingCustomFontBase64
  const headingName = config.headingCustomFontName || ''

  const faces: string[] = []
  if (bodyBase64 && bodyName) {
    faces.push(`@font-face { font-family: "${bodyName}"; src: url("data:font/truetype;base64,${bodyBase64}") format("truetype"); font-weight: normal; font-style: normal; font-display: swap; }`)
  }
  if (headingBase64 && headingName && headingName !== bodyName) {
    faces.push(`@font-face { font-family: "${headingName}"; src: url("data:font/truetype;base64,${headingBase64}") format("truetype"); font-weight: normal; font-style: normal; font-display: swap; }`)
  }
  if (faces.length > 0) {
    const style = document.createElement('style')
    style.id = 'joepdf-custom-font'
    style.textContent = faces.join('\n')
    document.head.appendChild(style)
  }
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
