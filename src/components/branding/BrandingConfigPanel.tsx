import { useRef } from 'react'
import { useStore } from '@/store'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'

export function BrandingConfigPanel() {
  const showPanel = useStore((s) => s.ui.showBrandingPanel)
  const setShowPanel = useStore((s) => s.setShowBrandingPanel)
  const branding = useStore((s) => s.branding)
  const setBranding = useStore((s) => s.setBranding)
  const resetBranding = useStore((s) => s.resetBranding)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file.', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setBranding({ logoDataUrl: reader.result as string })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <Dialog open={showPanel} onClose={() => setShowPanel(false)} title="Branding & Settings" className="max-w-sm">
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Organisation name</label>
          <input
            type="text"
            value={branding.orgName}
            onChange={(e) => setBranding({ orgName: e.target.value })}
            className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Application name</label>
          <input
            type="text"
            value={branding.appName}
            onChange={(e) => setBranding({ appName: e.target.value })}
            className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Logo</label>
          <div className="flex items-center gap-2">
            {branding.logoDataUrl && (
              <img src={branding.logoDataUrl} alt="Logo" className="h-8 w-auto rounded" />
            )}
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              Upload logo
            </Button>
            {branding.logoDataUrl && (
              <Button variant="ghost" size="sm" onClick={() => setBranding({ logoDataUrl: null })}>
                Remove
              </Button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} />
          <p className="text-xs text-slate-400 mt-1">PNG or SVG, max 200×60 px recommended.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(['primaryColor', 'secondaryColor', 'accentColor'] as const).map((key) => (
            <div key={key}>
              <label className="text-xs text-slate-500 block mb-1 capitalize">
                {key.replace('Color', '')}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={branding[key]}
                  onChange={(e) => setBranding({ [key]: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border border-slate-200"
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Footer text</label>
          <input
            type="text"
            value={branding.footerText}
            onChange={(e) => setBranding({ footerText: e.target.value })}
            placeholder="Optional footer text"
            className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Support email</label>
          <input
            type="email"
            value={branding.supportEmail}
            onChange={(e) => setBranding({ supportEmail: e.target.value })}
            placeholder="support@example.com"
            className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
          />
        </div>

        <div className="flex justify-between pt-2 border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={() => { resetBranding(); showToast('Branding reset.', 'success') }}>
            Reset defaults
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setShowPanel(false); showToast('Settings saved.', 'success') }}
          >
            Save
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
