import { useRef, useState } from 'react'
import { useStore } from '@/store'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'
import { AdminLogin, ChangeCredsForm } from '@/components/ui/AdminLogin'
import { isAdminSession, setAdminSession } from '@/lib/adminAuth'
import { downloadBrandingConfig } from '@/lib/brandingLoader'
import { LogOut, ShieldCheck, Download, Info } from 'lucide-react'

export function BrandingConfigPanel() {
  const showPanel = useStore((s) => s.ui.showBrandingPanel)
  const setShowPanel = useStore((s) => s.setShowBrandingPanel)
  const branding = useStore((s) => s.branding)
  const setBranding = useStore((s) => s.setBranding)
  const resetBranding = useStore((s) => s.resetBranding)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [authed, setAuthed] = useState(() => isAdminSession())
  const [showChangeCreds, setShowChangeCreds] = useState(false)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast('Please select an image file.', 'error'); return }
    const reader = new FileReader()
    reader.onload = () => setBranding({ logoDataUrl: reader.result as string })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleLogout = () => {
    setAdminSession(false)
    setAuthed(false)
    setShowPanel(false)
  }

  // Gate: show login if not authenticated
  if (showPanel && !authed) {
    return (
      <AdminLogin
        onSuccess={() => setAuthed(true)}
        onCancel={() => setShowPanel(false)}
      />
    )
  }

  return (
    <Dialog open={showPanel} onClose={() => setShowPanel(false)} title="Branding & Settings">
      <div className="flex flex-col gap-4">
        {/* Admin badge */}
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <div className="flex items-center gap-1.5 text-green-700 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin access
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Sign out
          </button>
        </div>

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
          <p className="text-xs text-slate-400 mt-1">PNG or SVG — recommended max 200×60 px.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(['primaryColor', 'secondaryColor', 'accentColor'] as const).map((key) => (
            <div key={key}>
              <label className="text-xs text-slate-500 block mb-1 capitalize">
                {key.replace('Color', '')}
              </label>
              <input
                type="color"
                value={branding[key]}
                onChange={(e) => setBranding({ [key]: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-slate-200"
              />
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

        {/* Change admin credentials */}
        {showChangeCreds ? (
          <ChangeCredsForm onDone={() => setShowChangeCreds(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setShowChangeCreds(true)}
            className="text-xs text-slate-400 hover:text-slate-600 underline text-left"
          >
            Change admin credentials
          </button>
        )}

        {/* How to make changes permanent across all devices */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          <div className="flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-500" />
            <div>
              <p className="font-semibold mb-1">To apply changes to all devices:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
                <li>Make your changes above</li>
                <li>Click <strong>Download brand-config.json</strong></li>
                <li>Commit the file to the <code className="bg-blue-100 px-0.5 rounded">public/</code> folder in GitHub</li>
                <li>The site redeploys and all users see the new branding</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              downloadBrandingConfig(branding)
              showToast('brand-config.json downloaded — commit it to public/ in GitHub to apply sitewide.', 'success', 8000)
            }}
          >
            <Download className="w-3.5 h-3.5" />
            Download brand-config.json
          </Button>
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => { resetBranding(); showToast('Reset to defaults.', 'success') }}>
              Reset defaults
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowPanel(false)}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
