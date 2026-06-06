import { useEffect } from 'react'
import { useBranding } from '@/hooks/useBranding'

/** Generate a 32×32 favicon from an image src. Calls onDone with the data URL. */
function generateFaviconDataUrl(src: string, onDone: (dataUrl: string) => void) {
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const scale = Math.min(32 / img.width, 32 / img.height)
    const w = img.width * scale
    const h = img.height * scale
    ctx.drawImage(img, (32 - w) / 2, (32 - h) / 2, w, h)
    onDone(canvas.toDataURL('image/png'))
  }
  img.src = src
}

function applyFavicon(dataUrl: string | null) {
  // Remove any existing dynamic favicon tags
  document.querySelectorAll('link[data-joepdf-favicon]').forEach((el) => el.remove())

  if (!dataUrl) {
    try { localStorage.removeItem('joepdf_favicon') } catch { /* ok */ }
    return
  }

  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/png'
  link.setAttribute('data-joepdf-favicon', '1')
  link.href = dataUrl
  // Also remove any leftover static favicon so ours takes precedence
  document.querySelectorAll('link[rel*="icon"]:not([data-joepdf-favicon])').forEach((el) => el.remove())
  document.head.appendChild(link)

  // Persist for bookmarks — read by init.js before React mounts on the next load
  try { localStorage.setItem('joepdf_favicon', dataUrl) } catch { /* ok */ }
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { branding } = useBranding()

  useEffect(() => {
    document.title = branding.appName
  }, [branding.appName])

  // Favicon: use explicit faviconDataUrl if set; otherwise auto-generate from logo
  useEffect(() => {
    if (branding.faviconDataUrl) {
      applyFavicon(branding.faviconDataUrl)
    } else if (branding.logoDataUrl) {
      generateFaviconDataUrl(branding.logoDataUrl, (dataUrl) => applyFavicon(dataUrl))
    } else {
      applyFavicon(null)
    }
  }, [branding.faviconDataUrl, branding.logoDataUrl])

  return <>{children}</>
}
