import type { StateCreator } from 'zustand'
import type { BrandingConfig } from '@/types/branding'
import { DEFAULT_BRANDING } from '@/types/branding'

export interface BrandingSlice {
  branding: BrandingConfig
  setBranding: (update: Partial<BrandingConfig>) => void
  resetBranding: () => void
}

function loadCachedBranding(): BrandingConfig {
  try {
    const raw = localStorage.getItem('joepdf_branding')
    if (raw) return { ...DEFAULT_BRANDING, ...JSON.parse(raw) as Partial<BrandingConfig> }
  } catch { /* ok */ }
  return DEFAULT_BRANDING
}

export const createBrandingSlice: StateCreator<BrandingSlice> = (set) => ({
  branding: loadCachedBranding(),

  setBranding: (update) =>
    set((state) => ({ branding: { ...state.branding, ...update } })),

  resetBranding: () => set({ branding: DEFAULT_BRANDING }),
})
