import { useRef, useState } from 'react'
import { useStore } from '@/store'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'
import { AdminLogin, ChangeCredsForm } from '@/components/ui/AdminLogin'
import { isAdminSession, setAdminSession } from '@/lib/adminAuth'
import { commitBrandingConfig, loadGitHubSettings, saveGitHubSettings, verifyToken } from '@/lib/githubConfig'
import type { GitHubSettings } from '@/lib/githubConfig'
import { LogOut, ShieldCheck, Save, Github, CheckCircle2, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'

// ── GitHub token setup sub-panel ─────────────────────────────────────────────

function GitHubSetup({
  initial,
  onSaved,
  onCancel,
}: {
  initial: GitHubSettings | null
  onSaved: (s: GitHubSettings) => void
  onCancel: () => void
}) {
  const [owner, setOwner] = useState(initial?.owner ?? 'joetouchpoint-sys')
  const [repo, setRepo] = useState(initial?.repo ?? 'JoePDF')
  const [token, setToken] = useState(initial?.token ?? '')
  const [showToken, setShowToken] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const handleSave = async () => {
    if (!owner || !repo || !token) {
      showToast('Please fill in all fields.', 'error')
      return
    }
    const settings: GitHubSettings = { owner, repo, token }
    setVerifying(true)
    try {
      await verifyToken(settings)
      saveGitHubSettings(settings)
      onSaved(settings)
      showToast('GitHub connected. Branding will now save directly to your repo.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Token verification failed.', 'error')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <Github className="w-4 h-4 text-slate-600" />
        <p className="text-sm font-semibold text-slate-700">Connect to GitHub</p>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">
        Enter a GitHub token with <strong>Contents: Read &amp; Write</strong> access on this repo.
        Changes will commit directly without needing to download files.{' '}
        <a
          href="https://github.com/settings/tokens/new?scopes=&description=JoePDF+branding"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[--color-primary] underline inline-flex items-center gap-0.5"
        >
          Create token <ExternalLink className="w-3 h-3" />
        </a>
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-500 block mb-0.5">Repo owner</label>
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="e.g. joetouchpoint-sys"
            className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-0.5">Repo name</label>
          <input
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="e.g. JoePDF"
            className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 block mb-0.5">Personal access token</label>
        <div className="relative">
          <input
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="github_pat_..."
            className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs pr-8 font-mono"
          />
          <button
            type="button"
            onClick={() => setShowToken((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Stored only on this device's localStorage. Never sent anywhere except GitHub.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-slate-200 rounded py-1.5 text-xs text-slate-500 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={verifying}
          className="flex-1 rounded py-1.5 text-xs text-white font-medium disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {verifying ? 'Verifying…' : 'Connect'}
        </button>
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function BrandingConfigPanel() {
  const showPanel = useStore((s) => s.ui.showBrandingPanel)
  const setShowPanel = useStore((s) => s.setShowBrandingPanel)
  const branding = useStore((s) => s.branding)
  const setBranding = useStore((s) => s.setBranding)
  const resetBranding = useStore((s) => s.resetBranding)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [authed, setAuthed] = useState(() => isAdminSession())
  const [showChangeCreds, setShowChangeCreds] = useState(false)
  const [ghSettings, setGhSettings] = useState<GitHubSettings | null>(() => loadGitHubSettings())
  const [showGhSetup, setShowGhSetup] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast('Please select an image file.', 'error'); return }
    const reader = new FileReader()
    reader.onload = () => setBranding({ logoDataUrl: reader.result as string })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSave = async () => {
    if (!ghSettings) {
      showToast('Connect GitHub first to save globally. See the GitHub section below.', 'warning')
      return
    }
    setSaving(true)
    try {
      await commitBrandingConfig(branding, ghSettings)
      showToast('Saved! Deploying to all users — live in ~2 minutes.', 'success', 6000)
      setShowPanel(false)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    setAdminSession(false)
    setAuthed(false)
    setShowPanel(false)
  }

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
            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
          >
            <LogOut className="w-3 h-3" />
            Sign out
          </button>
        </div>

        {/* Org / App name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Organisation</label>
            <input
              type="text"
              value={branding.orgName}
              onChange={(e) => setBranding({ orgName: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">App name</label>
            <input
              type="text"
              value={branding.appName}
              onChange={(e) => setBranding({ appName: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
            />
          </div>
        </div>

        {/* Logo */}
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
          <p className="text-xs text-slate-400 mt-1">PNG or SVG — max 200×60 px recommended</p>
        </div>

        {/* Colours */}
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
                <span className="text-xs text-slate-500 font-mono">{branding[key]}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer / support */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Footer text</label>
            <input
              type="text"
              value={branding.footerText}
              onChange={(e) => setBranding({ footerText: e.target.value })}
              placeholder="Optional"
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
        </div>

        {/* GitHub integration status */}
        {!showGhSetup && (
          <div className={clsx(
            'flex items-center justify-between rounded-lg px-3 py-2 text-xs',
            ghSettings
              ? 'bg-green-50 border border-green-200'
              : 'bg-slate-50 border border-slate-200',
          )}>
            <div className="flex items-center gap-1.5">
              {ghSettings ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-700 font-medium">
                    GitHub connected — {ghSettings.owner}/{ghSettings.repo}
                  </span>
                </>
              ) : (
                <>
                  <Github className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-600">GitHub not connected — Save won't update all devices</span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowGhSetup(true)}
              className="text-[--color-primary] underline font-medium"
            >
              {ghSettings ? 'Change' : 'Connect'}
            </button>
          </div>
        )}

        {showGhSetup && (
          <GitHubSetup
            initial={ghSettings}
            onSaved={(s) => { setGhSettings(s); setShowGhSetup(false) }}
            onCancel={() => setShowGhSetup(false)}
          />
        )}

        {/* Change admin credentials */}
        {!showChangeCreds ? (
          <button
            type="button"
            onClick={() => setShowChangeCreds(true)}
            className="text-xs text-slate-400 hover:text-slate-600 underline text-left"
          >
            Change admin credentials
          </button>
        ) : (
          <ChangeCredsForm onDone={() => setShowChangeCreds(false)} />
        )}

        {/* Action buttons */}
        <div className="flex justify-between pt-2 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { resetBranding(); showToast('Reset to defaults.', 'success') }}
          >
            Reset defaults
          </Button>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowPanel(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={saving}
              disabled={saving}
            >
              <Save className="w-3.5 h-3.5" />
              {ghSettings ? 'Save for everyone' : 'Save (local only)'}
            </Button>
          </div>
        </div>

        {!ghSettings && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-2 border border-amber-200">
            Connect GitHub above to make changes apply to all devices. Currently only visible to you.
          </p>
        )}
      </div>
    </Dialog>
  )
}
