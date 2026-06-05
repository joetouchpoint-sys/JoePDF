import { useEffect } from 'react'
import { useBranding } from '@/hooks/useBranding'

function setFavicon(src: string | null) {
  // Remove any existing dynamic favicon
  document.querySelectorAll('link[data-joepdf-favicon]').forEach((el) => el.remove())
  if (!src) {
    try { localStorage.removeItem('joepdf_favicon') } catch { /* ok */ }
    return
  }

  // Create a 32x32 canvas favicon from the logo image
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Scale to fit with letterboxing
    const scale = Math.min(32 / img.width, 32 / img.height)
    const w = img.width * scale
    const h = img.height * scale
    ctx.drawImage(img, (32 - w) / 2, (32 - h) / 2, w, h)
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    link.setAttribute('data-joepdf-favicon', '1')
    link.href = dataUrl
    document.head.appendChild(link)
    // Persist for bookmarks — read synchronously by init.js before React mounts
    try { localStorage.setItem('joepdf_favicon', dataUrl) } catch { /* ok */ }
  }
  img.src = src
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { branding } = useBranding()

  useEffect(() => {
    document.title = branding.appName
  }, [branding.appName])

  useEffect(() => {
    setFavicon(branding.logoDataUrl)
    return () => {
      // On unmount keep the favicon as-is (avoid flicker on hot reload)
    }
  }, [branding.logoDataUrl])

  return <>{children}</>
}
