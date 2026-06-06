import { useEffect } from 'react'
import { useStore } from '@/store'
import { fetchDeployedConfig, applyBrandingToDom } from '@/lib/brandingLoader'
import { DEFAULT_BRANDING } from '@/types/branding'

export function useBranding() {
  const branding = useStore((s) => s.branding)
  const setBranding = useStore((s) => s.setBranding)

  // On mount: load branding from the deployed brand-config.json (same for all devices).
  // Falls back to DEFAULT_BRANDING if the file isn't present or the fetch fails.
  useEffect(() => {
    applyBrandingToDom(DEFAULT_BRANDING) // apply defaults immediately to avoid flash
    fetchDeployedConfig().then((config) => {
      const resolved = config ?? DEFAULT_BRANDING
      setBranding(resolved)
      applyBrandingToDom(resolved)
      try { localStorage.setItem('joepdf_branding', JSON.stringify(resolved)) } catch { /* quota exceeded — ok */ }
    })
  }, [setBranding])

  // Apply CSS vars whenever branding changes (e.g. admin edits in the panel)
  useEffect(() => {
    applyBrandingToDom(branding)
  }, [branding])

  return { branding, setBranding }
}
