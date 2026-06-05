import { useEffect } from 'react'
import { useBranding } from '@/hooks/useBranding'

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { branding } = useBranding()

  useEffect(() => {
    document.title = branding.appName
  }, [branding.appName])

  return <>{children}</>
}
