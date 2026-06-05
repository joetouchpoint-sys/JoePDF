import type { StateCreator } from 'zustand'
import type { BrandingConfig } from '@/types/branding'
import { DEFAULT_BRANDING } from '@/types/branding'

export interface BrandingSlice {
  branding: BrandingConfig
  setBranding: (update: Partial<BrandingConfig>) => void
  resetBranding: () => void
}

export const createBrandingSlice: StateCreator<BrandingSlice> = (set) => ({
  branding: DEFAULT_BRANDING,

  setBranding: (update) =>
    set((state) => ({ branding: { ...state.branding, ...update } })),

  resetBranding: () => set({ branding: DEFAULT_BRANDING }),
})
