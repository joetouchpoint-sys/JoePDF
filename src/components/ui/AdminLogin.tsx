import { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { verifyAdmin, setAdminSession, updateAdminCreds } from '@/lib/adminAuth'
import { showToast } from './Toast'

interface AdminLoginProps {
  onSuccess: () => void
  onCancel: () => void
}

export function AdminLogin({ onSuccess, onCancel }: AdminLoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const ok = await verifyAdmin(username, password)
      if (ok) {
        setAdminSession(true)
        onSuccess()
      } else {
        setError('Incorrect username or password.')
        setPassword('')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-4 flex flex-col items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#178351' }}
          >
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div className="text-center">
            <h2
              className="text-lg font-bold"
              style={{ color: '#292C4F', fontFamily: "'Nunito', system-ui" }}
            >
              Admin access required
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Sign in to manage branding and settings</p>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 pb-6 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError('') }}
              autoFocus
              autoComplete="username"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#178351' } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                autoComplete="current-password"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#178351' } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-slate-200 rounded-lg py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="flex-1 rounded-lg py-2 text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: '#178351' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface ChangeCredsFormProps {
  onDone: () => void
}

export function ChangeCredsForm({ onDone }: ChangeCredsFormProps) {
  const [newUser, setNewUser] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!newUser.trim()) { showToast('Username cannot be empty.', 'error'); return }
    if (newPass.length < 4) { showToast('Password must be at least 4 characters.', 'error'); return }
    if (newPass !== confirmPass) { showToast('Passwords do not match.', 'error'); return }
    setSaving(true)
    try {
      await updateAdminCreds(newUser.trim(), newPass)
      showToast('Admin credentials updated.', 'success')
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Change credentials</p>
      <input
        type="text"
        placeholder="New username"
        value={newUser}
        onChange={(e) => setNewUser(e.target.value)}
        className="border border-slate-200 rounded-md px-2.5 py-1.5 text-sm"
      />
      <input
        type="password"
        placeholder="New password"
        value={newPass}
        onChange={(e) => setNewPass(e.target.value)}
        className="border border-slate-200 rounded-md px-2.5 py-1.5 text-sm"
      />
      <input
        type="password"
        placeholder="Confirm password"
        value={confirmPass}
        onChange={(e) => setConfirmPass(e.target.value)}
        className="border border-slate-200 rounded-md px-2.5 py-1.5 text-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={onDone}
          className="flex-1 text-xs py-1.5 border border-slate-200 rounded-md text-slate-500 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="flex-1 text-xs py-1.5 rounded-md text-white font-medium disabled:opacity-50"
          style={{ backgroundColor: '#178351' }}
        >
          {saving ? 'Saving…' : 'Save credentials'}
        </button>
      </div>
    </div>
  )
}
