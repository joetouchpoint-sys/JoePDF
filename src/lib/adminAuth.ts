const APP_SALT = 'joepdf-v1'
const CREDS_KEY = 'joepdf_admin_creds_v2'
const SESSION_KEY = 'joepdf_admin_session'

const DEFAULT_USERNAME = 'Admin'
const DEFAULT_PASSWORD = 'AdminPDF!'

async function sha256hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

interface StoredCreds {
  username: string
  hash: string
}

function loadStoredCreds(): StoredCreds | null {
  try {
    const raw = localStorage.getItem(CREDS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredCreds>
      if (parsed.username && parsed.hash) return parsed as StoredCreds
    }
  } catch { /* ignore */ }
  return null
}

export async function verifyAdmin(username: string, password: string): Promise<boolean> {
  const hash = await sha256hex(password + APP_SALT)
  const stored = loadStoredCreds()

  if (stored) {
    return username.toLowerCase() === stored.username.toLowerCase() && hash === stored.hash
  }

  // Default credentials (Admin / AdminPDF!)
  const defaultHash = await sha256hex(DEFAULT_PASSWORD + APP_SALT)
  return username.toLowerCase() === DEFAULT_USERNAME.toLowerCase() && hash === defaultHash
}

export async function updateAdminCreds(username: string, newPassword: string): Promise<void> {
  const hash = await sha256hex(newPassword + APP_SALT)
  localStorage.setItem(CREDS_KEY, JSON.stringify({ username, hash } satisfies StoredCreds))
}

export function isAdminSession(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function setAdminSession(auth: boolean): void {
  if (auth) sessionStorage.setItem(SESSION_KEY, '1')
  else sessionStorage.removeItem(SESSION_KEY)
}
