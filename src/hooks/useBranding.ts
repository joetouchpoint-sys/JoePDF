import { useEffect } from 'react'
import { useStore } from '@/store'
import { loadBranding, saveBranding, applyBrandingToDom } from '@/lib/brandingLoader'

export function useBranding() {
  const branding = useStore((s) => s.branding)
  const setBranding = useStore((s) => s.setBranding)

  // Load persisted branding on mount
  useEffect(() => {
    const saved = loadBranding()
    setBranding(saved)
    applyBrandingToDom(saved)
  }, [setBranding])

  // Apply CSS vars and persist whenever branding changes
  useEffect(() => {
    applyBrandingToDom(branding)
    saveBranding(branding)
  }, [branding])

  return { branding, setBranding }
}
