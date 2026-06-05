/**
 * Admin auth for the branding panel.
 *
 * Credential priority (highest wins):
 *   1. VITE_ADMIN_HASH build-time env var  — SHA-256 hex of (password + salt).
 *      Set as a GitHub Actions Secret → never committed to source.
 *   2. localStorage  — set via "Change credentials" form inside the app.
 *
 * No default credentials are shipped in source code.
 * Client-side checks are always bypassable with DevTools, so this is a
 * convenience gate only. Global branding changes still require the GitHub
 * PAT which is stored separately and never in source.
 */

const APP_SALT = 'joepdf-v1'
const CREDS_KEY = 'joepdf_admin_creds_v2'
const SESSION_KEY = 'joepdf_admin_session'

// Injected at build time via GitHub Actions Secret — never in source.
const ENV_HASH = (import.meta.env['VITE_ADMIN_HASH'] as string | undefined) ?? null

async function sha256hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

interface StoredCreds {
  username: string
  hash: string  // SHA-256 hex of (password + APP_SALT)
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

/** Returns true if any credentials are configured (env var or localStorage). */
export function hasAdminCredentials(): boolean {
  return ENV_HASH !== null || loadStoredCreds() !== null
}

/** Verify username + password. Returns true on success. */
export async function verifyAdmin(username: string, password: string): Promise<boolean> {
  const hash = await sha256hex(password + APP_SALT)

  if (ENV_HASH) {
    // Env-var mode: only the password hash is authoritative; username is informational only.
    return hash === ENV_HASH
  }

  const stored = loadStoredCreds()
  if (!stored) return false

  return username === stored.username && hash === stored.hash
}

/** Update credentials in localStorage. */
export async function updateAdminCreds(username: string, newPassword: string): Promise<void> {
  const hash = await sha256hex(newPassword + APP_SALT)
  const creds: StoredCreds = { username, hash }
  localStorage.setItem(CREDS_KEY, JSON.stringify(creds))
}

export function isAdminSession(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function setAdminSession(auth: boolean): void {
  if (auth) sessionStorage.setItem(SESSION_KEY, '1')
  else sessionStorage.removeItem(SESSION_KEY)
}

/**
 * Returns the SHA-256 hash for a given password — shown in the branding panel
 * so the admin can copy it into the VITE_ADMIN_HASH GitHub Secret.
 */
export async function computeAdminHash(password: string): Promise<string> {
  return sha256hex(password + APP_SALT)
}
