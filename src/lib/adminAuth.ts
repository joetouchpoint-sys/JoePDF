/**
 * Simple admin credential store for the internal branding panel.
 * Uses localStorage to persist credentials between sessions.
 * Not cryptographically secure — suitable for internal access control only.
 */

const CREDS_KEY = 'joepdf_admin_creds'
const SESSION_KEY = 'joepdf_admin_session'

interface AdminCreds {
  username: string
  passwordHash: string
}

function obfuscate(value: string): string {
  return btoa(value + ':joepdf_internal_salt')
}

function defaultCreds(): AdminCreds {
  return {
    username: 'Joe',
    passwordHash: obfuscate('Joe917'),
  }
}

function loadCreds(): AdminCreds {
  try {
    const raw = localStorage.getItem(CREDS_KEY)
    if (raw) return JSON.parse(raw) as AdminCreds
  } catch {
    // Ignore parse errors, use defaults
  }
  return defaultCreds()
}

export function verifyAdmin(username: string, password: string): boolean {
  const creds = loadCreds()
  return creds.username === username && creds.passwordHash === obfuscate(password)
}

export function updateAdminCreds(username: string, newPassword: string): void {
  localStorage.setItem(
    CREDS_KEY,
    JSON.stringify({ username, passwordHash: obfuscate(newPassword) }),
  )
}

export function resetAdminCreds(): void {
  localStorage.removeItem(CREDS_KEY)
}

export function isAdminSession(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function setAdminSession(auth: boolean): void {
  if (auth) sessionStorage.setItem(SESSION_KEY, '1')
  else sessionStorage.removeItem(SESSION_KEY)
}
