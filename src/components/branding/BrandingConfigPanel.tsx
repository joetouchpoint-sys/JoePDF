import { useRef, useState, useCallback } from 'react'
import { HexColorInput } from '@/components/ui/HexColorInput'
import { useStore } from '@/store'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'
import { AdminLogin, ChangeCredsForm } from '@/components/ui/AdminLogin'
import { isAdminSession, setAdminSession } from '@/lib/adminAuth'
import { commitBrandingConfig, loadGitHubSettings, saveGitHubSettings, verifyToken } from '@/lib/githubConfig'
import { downloadBrandingConfig } from '@/lib/brandingLoader'
import type { GitHubSettings } from '@/lib/githubConfig'
import type { BrandingConfig } from '@/types/branding'
import { DEFAULT_BRANDING } from '@/types/branding'
import { LogOut, ShieldCheck, Save, Github, CheckCircle2, Eye, EyeOff, ExternalLink, Download, Upload as UploadIcon } from 'lucide-react'
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
  const headerLogoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const headingFontInputRef = useRef<HTMLInputElement>(null)
  const bodyFontInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const [authed, setAuthed] = useState(() => isAdminSession())
  const [showChangeCreds, setShowChangeCreds] = useState(false)
  const [ghSettings, setGhSettings] = useState<GitHubSettings | null>(() => loadGitHubSettings())
  const [showGhSetup, setShowGhSetup] = useState(false)
  const [saving, setSaving] = useState(false)

  const readImageFile = (file: File, onDone: (dataUrl: string) => void) => {
    if (!file.type.startsWith('image/')) { showToast('Please select an image file.', 'error'); return }
    const reader = new FileReader()
    reader.onload = () => onDone(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    readImageFile(file, (dataUrl) => setBranding({ logoDataUrl: dataUrl }))
    e.target.value = ''
  }

  const handleHeaderLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    readImageFile(file, (dataUrl) => setBranding({ headerLogoDataUrl: dataUrl }))
    e.target.value = ''
  }

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    readImageFile(file, (dataUrl) => setBranding({ faviconDataUrl: dataUrl }))
    e.target.value = ''
  }

  const handleExportConfig = () => {
    downloadBrandingConfig(branding)
    showToast('Config exported as brand-config.json', 'success')
  }

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as Partial<BrandingConfig>
        setBranding({ ...DEFAULT_BRANDING, ...parsed })
        showToast('Config imported successfully.', 'success')
      } catch {
        showToast('Invalid JSON file. Please export a valid brand-config.json.', 'error')
      }
    }
    reader.onerror = () => showToast('Failed to read file.', 'error')
    reader.readAsText(file)
    e.target.value = ''
  }

  const readFontFile = useCallback((file: File, onDone: (base64: string) => void) => {
    if (!file.name.match(/\.(ttf|otf|woff|woff2)$/i)) {
      showToast('Please select a font file (.ttf, .otf, .woff, .woff2).', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1] ?? ''
      onDone(base64)
    }
    reader.onerror = () => showToast('Failed to read font file.', 'error')
    reader.readAsDataURL(file)
  }, [])

  const handleHeadingFontUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const name = file.name.replace(/\.[^.]+$/, '')
    readFontFile(file, (base64) => {
      setBranding({ headingCustomFontBase64: base64, headingCustomFontName: name })
      showToast(`Heading font "${name}" uploaded.`, 'success')
    })
    e.target.value = ''
  }, [setBranding, readFontFile])

  const handleBodyFontUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const name = file.name.replace(/\.[^.]+$/, '')
    readFontFile(file, (base64) => {
      setBranding({ bodyCustomFontBase64: base64, bodyCustomFontName: name })
      showToast(`Body font "${name}" uploaded.`, 'success')
    })
    e.target.value = ''
  }, [setBranding, readFontFile])

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
            <label className="text-xs font-medium text-slate-600 block mb-1">
              Organisation
              <span className="text-[10px] text-slate-400 font-normal ml-1">(home screen)</span>
            </label>
            <input
              type="text"
              value={branding.orgName}
              onChange={(e) => setBranding({ orgName: e.target.value })}
              aria-label="Organisation name"
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              App name
              <span className="text-[10px] text-slate-400 font-normal ml-1">(header &amp; home screen)</span>
            </label>
            <input
              type="text"
              value={branding.appName}
              onChange={(e) => setBranding({ appName: e.target.value })}
              aria-label="App name"
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
            />
          </div>
        </div>

        {/* Icons — three separate controls */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-600">Icons &amp; logos</label>
          <p className="text-[11px] text-slate-400 -mt-1">Set each separately, or leave Header/Favicon blank to reuse the main logo.</p>

          {/* Upload screen logo */}
          <div className="flex items-center gap-2 py-1.5 border-b border-slate-100 dark:border-slate-700">
            <span className="text-xs text-slate-500 w-28 flex-shrink-0">Upload screen</span>
            {branding.logoDataUrl && (
              <img src={branding.logoDataUrl} alt="Logo" className="h-7 w-auto rounded border border-slate-100" />
            )}
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              {branding.logoDataUrl ? 'Change' : 'Upload'}
            </Button>
            {branding.logoDataUrl && (
              <Button variant="ghost" size="sm" onClick={() => setBranding({ logoDataUrl: null })}>Remove</Button>
            )}
          </div>

          {/* Header bar logo */}
          <div className="flex items-center gap-2 py-1.5 border-b border-slate-100 dark:border-slate-700">
            <span className="text-xs text-slate-500 w-28 flex-shrink-0">Header bar</span>
            {(branding.headerLogoDataUrl ?? branding.logoDataUrl) && (
              <img src={branding.headerLogoDataUrl ?? branding.logoDataUrl!} alt="Header logo" className="h-7 w-auto rounded border border-slate-100" />
            )}
            <Button variant="secondary" size="sm" onClick={() => headerLogoInputRef.current?.click()}>
              {branding.headerLogoDataUrl ? 'Change' : 'Upload'}
            </Button>
            {branding.headerLogoDataUrl && (
              <Button variant="ghost" size="sm" onClick={() => setBranding({ headerLogoDataUrl: null })}>
                {branding.logoDataUrl ? 'Use main logo' : 'Remove'}
              </Button>
            )}
          </div>

          {/* Favicon */}
          <div className="flex items-center gap-2 py-1.5">
            <span className="text-xs text-slate-500 w-28 flex-shrink-0">Favicon</span>
            {branding.faviconDataUrl && (
              <img src={branding.faviconDataUrl} alt="Favicon" className="h-7 w-7 rounded border border-slate-100 object-contain" />
            )}
            <Button variant="secondary" size="sm" onClick={() => faviconInputRef.current?.click()}>
              {branding.faviconDataUrl ? 'Change' : 'Upload'}
            </Button>
            {branding.faviconDataUrl && (
              <Button variant="ghost" size="sm" onClick={() => setBranding({ faviconDataUrl: null })}>
                {branding.logoDataUrl ? 'Auto from logo' : 'Remove'}
              </Button>
            )}
            {!branding.faviconDataUrl && (
              <span className="text-[11px] text-slate-400">
                {branding.logoDataUrl ? 'Auto-generated from main logo' : 'Default favicon'}
              </span>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} aria-label="Upload main logo image" />
          <input ref={headerLogoInputRef} type="file" accept="image/*" className="sr-only" onChange={handleHeaderLogoUpload} aria-label="Upload header bar logo image" />
          <input ref={faviconInputRef} type="file" accept="image/*" className="sr-only" onChange={handleFaviconUpload} aria-label="Upload favicon image" />
          <p className="text-[11px] text-slate-400">PNG or SVG recommended. Favicon: square image works best (e.g. 64×64 px).</p>
        </div>

        {/* Colours */}
        <div className="grid grid-cols-3 gap-3">
          {(['primaryColor', 'secondaryColor'] as const).map((key) => (
            <div key={key}>
              <label className="text-xs text-slate-500 block mb-1 capitalize">
                {key.replace('Color', '')}
              </label>
              <HexColorInput
                value={branding[key]}
                onChange={(hex) => setBranding({ [key]: hex })}
                label={key.replace('Color', '') + ' colour'}
              />
            </div>
          ))}
        </div>

        {/* Upload page description */}
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">
            Upload page tagline
            <span className="text-[10px] text-slate-400 font-normal ml-1">(shown below app name on home screen)</span>
          </label>
          <textarea
            value={branding.uploadDescription}
            onChange={(e) => setBranding({ uploadDescription: e.target.value })}
            rows={2}
            placeholder="Edit, redact, and manage PDF documents — entirely in your browser."
            aria-label="Upload page tagline"
            className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] resize-none"
          />
        </div>

        {/* Report issue URL */}
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">
            Report issue / feedback URL
            <span className="text-[10px] text-slate-400 font-normal ml-1">(leave blank to hide)</span>
          </label>
          <input
            type="url"
            value={branding.reportIssueUrl}
            onChange={(e) => setBranding({ reportIssueUrl: e.target.value })}
            placeholder="https://forms.office.com/… or GitHub Issues URL"
            aria-label="Report issue / feedback URL"
            className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
          />
          <p className="text-xs text-slate-400 mt-1">Opens in a new tab. Shown in the app footer and on the upload screen.</p>
        </div>

        {/* OneDrive integration */}
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">
            OneDrive App Client ID
            <span className="text-[10px] text-slate-400 font-normal ml-1">(leave blank to hide the OneDrive save button)</span>
          </label>
          <input
            type="text"
            value={branding.oneDriveClientId}
            onChange={(e) => setBranding({ oneDriveClientId: e.target.value })}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            aria-label="OneDrive App Client ID"
            className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
          />
          <p className="text-xs text-slate-400 mt-1">Azure AD app registration client ID with Files.ReadWrite permission.</p>
        </div>

        {/* Footer / support */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              Footer text
              <span className="text-[10px] text-slate-400 font-normal ml-1">(bottom of app)</span>
            </label>
            <input
              type="text"
              value={branding.footerText}
              onChange={(e) => setBranding({ footerText: e.target.value })}
              placeholder="Optional"
              aria-label="Footer text"
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Support email</label>
            <input
              type="email"
              value={branding.supportEmail}
              onChange={(e) => setBranding({ supportEmail: e.target.value })}
              placeholder="support@example.com"
              aria-label="Support email"
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
            />
          </div>
        </div>

        {/* Heading font */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Heading font
            <span className="text-[10px] text-slate-400 font-normal ml-1">(app name &amp; org name in header &amp; home screen)</span>
          </label>
          <select
            value={branding.headingFontFamily}
            onChange={(e) => setBranding({ headingFontFamily: e.target.value })}
            aria-label="Heading font family"
            className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
          >
            <option value="'DM Sans', system-ui, sans-serif">DM Sans (default)</option>
            <option value="system-ui, sans-serif">System default</option>
            <option value="'Arial', sans-serif">Arial</option>
            <option value="'Georgia', serif">Georgia</option>
            <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
            <option value="'Verdana', sans-serif">Verdana</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
            <option value="'Courier New', monospace">Courier New</option>
            {branding.headingCustomFontBase64 && branding.headingCustomFontName && (
              <option value={`'${branding.headingCustomFontName}', system-ui, sans-serif`}>
                {branding.headingCustomFontName} (custom uploaded)
              </option>
            )}
          </select>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => headingFontInputRef.current?.click()}>
              {branding.headingCustomFontBase64 ? 'Replace custom font' : 'Upload custom .ttf / .otf'}
            </Button>
            {branding.headingCustomFontBase64 && (
              <>
                <input
                  type="text"
                  value={branding.headingCustomFontName}
                  onChange={(e) => {
                    const newName = e.target.value
                    // The dropdown's "(custom uploaded)" option bakes the name into
                    // headingFontFamily at selection time. Keep it in sync on rename —
                    // otherwise it goes stale and points at a family the @font-face
                    // (re-registered under the new name) no longer provides, silently
                    // breaking the heading font.
                    const wasActive = branding.headingFontFamily === `'${branding.headingCustomFontName}', system-ui, sans-serif`
                    setBranding({
                      headingCustomFontName: newName,
                      ...(wasActive ? { headingFontFamily: `'${newName}', system-ui, sans-serif` } : {}),
                    })
                  }}
                  placeholder="Font name"
                  aria-label="Heading custom font name"
                  className="border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded px-2 py-1 text-xs w-32"
                />
                <Button variant="ghost" size="sm" onClick={() => setBranding({ headingCustomFontBase64: null, headingCustomFontName: '' })}>Remove</Button>
              </>
            )}
          </div>
          {branding.headingCustomFontBase64 && (
            <p className="text-[11px] text-slate-400">Font loaded — select &ldquo;{branding.headingCustomFontName} (custom uploaded)&rdquo; in the dropdown above to apply it.</p>
          )}
          <input ref={headingFontInputRef} type="file" accept=".ttf,.otf,.woff,.woff2" className="sr-only" onChange={handleHeadingFontUpload} aria-label="Upload heading font file" />
        </div>

        {/* Body / annotation font */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Body / annotation font
            <span className="text-[10px] text-slate-400 font-normal ml-1">(default font for text added to PDFs)</span>
          </label>
          <select
            value={branding.bodyFontFamily}
            onChange={(e) => setBranding({ bodyFontFamily: e.target.value })}
            aria-label="Body / annotation font family"
            className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
          >
            <option value="Helvetica">Helvetica (default)</option>
            <option value="Arial">Arial</option>
            <option value="Times-Roman">Times New Roman</option>
            <option value="Courier">Courier</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            {(branding.bodyCustomFontBase64 ?? branding.customFontBase64) && (branding.bodyCustomFontName || branding.customFontName) && (
              <option value={branding.bodyCustomFontName || branding.customFontName}>
                {branding.bodyCustomFontName || branding.customFontName} (custom uploaded)
              </option>
            )}
          </select>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => bodyFontInputRef.current?.click()}>
              {(branding.bodyCustomFontBase64 ?? branding.customFontBase64) ? 'Replace custom font' : 'Upload custom .ttf / .otf'}
            </Button>
            {(branding.bodyCustomFontBase64 ?? branding.customFontBase64) && (
              <>
                <input
                  type="text"
                  value={branding.bodyCustomFontName || branding.customFontName}
                  onChange={(e) => {
                    const newName = e.target.value
                    const oldName = branding.bodyCustomFontName || branding.customFontName
                    // The dropdown's "(custom uploaded)" option bakes the name into
                    // bodyFontFamily at selection time (and the exporter matches
                    // ann.fontFamily against the live bodyCustomFontName — see
                    // Header.tsx's customFont.name). Keep bodyFontFamily in sync on
                    // rename so existing/new text annotations keep matching the
                    // re-embedded custom font instead of silently falling back to
                    // Helvetica on export.
                    const wasActive = branding.bodyFontFamily === oldName
                    setBranding({
                      bodyCustomFontName: newName,
                      ...(wasActive ? { bodyFontFamily: newName } : {}),
                    })
                  }}
                  placeholder="Font name"
                  aria-label="Body custom font name"
                  className="border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded px-2 py-1 text-xs w-32"
                />
                <Button variant="ghost" size="sm" onClick={() => setBranding({ bodyCustomFontBase64: null, bodyCustomFontName: '', customFontBase64: null })}>Remove</Button>
              </>
            )}
          </div>
          {(branding.bodyCustomFontBase64 ?? branding.customFontBase64) && (
            <p className="text-[11px] text-slate-400">Font loaded — select &ldquo;{branding.bodyCustomFontName || branding.customFontName} (custom uploaded)&rdquo; above. Embedded in exported PDFs.</p>
          )}
          <input ref={bodyFontInputRef} type="file" accept=".ttf,.otf,.woff,.woff2" className="sr-only" onChange={handleBodyFontUpload} aria-label="Upload body font file" />
          <p className="text-[11px] text-slate-400">Preset fonts use standard PDF fonts (no extra embedding). Custom font is embedded in every exported PDF.</p>
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

        {/* Export / Import config */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
          <span className="text-xs text-slate-400 flex-shrink-0">Local config:</span>
          <Button variant="secondary" size="sm" onClick={handleExportConfig}>
            <Download className="w-3 h-3" />
            Export
          </Button>
          <Button variant="secondary" size="sm" onClick={() => importInputRef.current?.click()}>
            <UploadIcon className="w-3 h-3" />
            Import
          </Button>
          <input ref={importInputRef} type="file" accept=".json,application/json" className="sr-only" onChange={handleImportConfig} aria-label="Import branding config JSON" />
          <span className="text-[11px] text-slate-400">Save/load configs without pushing to GitHub.</span>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
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
