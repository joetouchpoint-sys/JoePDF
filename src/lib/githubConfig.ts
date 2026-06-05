/**
 * GitHub Contents API integration for saving branding config directly from the browser.
 *
 * The admin stores a GitHub PAT (with contents:write on this repo) in their
 * browser's localStorage. When they click Save, this module commits the updated
 * brand-config.json to the repo via the API, triggering the deploy workflow.
 *
 * Security: The token lives only in the admin's localStorage (their device).
 *           Scope it to "Contents → Read and Write" on this repo only.
 */

import type { BrandingConfig } from '@/types/branding'

const GH_SETTINGS_KEY = 'joepdf_gh_settings'

export interface GitHubSettings {
  owner: string
  repo: string
  token: string
}

const BRAND_FILE_PATH = 'public/brand-config.json'

// ── Persist settings ──────────────────────────────────────────────────────────

export function loadGitHubSettings(): GitHubSettings | null {
  try {
    const raw = localStorage.getItem(GH_SETTINGS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as GitHubSettings
  } catch {
    return null
  }
}

export function saveGitHubSettings(settings: GitHubSettings): void {
  localStorage.setItem(GH_SETTINGS_KEY, JSON.stringify(settings))
}

export function clearGitHubSettings(): void {
  localStorage.removeItem(GH_SETTINGS_KEY)
}

// ── API helpers ───────────────────────────────────────────────────────────────

type GitHubFileResponse = { sha: string; content: string } | { message: string }

async function ghFetch(
  path: string,
  options: RequestInit,
  token: string,
): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) ?? {}),
    },
  })
}

/** Verify the token works by fetching the current file (or checking permissions). */
export async function verifyToken(settings: GitHubSettings): Promise<void> {
  const res = await ghFetch(
    `/repos/${settings.owner}/${settings.repo}/contents/${BRAND_FILE_PATH}`,
    { method: 'GET' },
    settings.token,
  )
  if (res.status === 401) throw new Error('GitHub token is invalid or expired.')
  if (res.status === 403) throw new Error('Token does not have write access to this repo.')
  if (res.status === 404) {
    // Repo not found or file doesn't exist yet — check the repo itself
    const repoRes = await ghFetch(
      `/repos/${settings.owner}/${settings.repo}`,
      { method: 'GET' },
      settings.token,
    )
    if (!repoRes.ok) throw new Error('Repository not found. Check owner and repo name.')
  }
}

/** Commit the branding config to public/brand-config.json in the GitHub repo. */
export async function commitBrandingConfig(
  config: BrandingConfig,
  settings: GitHubSettings,
): Promise<void> {
  const { owner, repo, token } = settings

  // 1. Get current file SHA (needed for updates; undefined for new file)
  let currentSha: string | undefined
  const getRes = await ghFetch(
    `/repos/${owner}/${repo}/contents/${BRAND_FILE_PATH}`,
    { method: 'GET' },
    token,
  )

  if (getRes.ok) {
    const data = await getRes.json() as GitHubFileResponse
    if ('sha' in data) currentSha = data.sha
  } else if (getRes.status !== 404) {
    const err = await getRes.json() as { message?: string }
    throw new Error(err.message ?? `GitHub API error ${getRes.status}`)
  }

  // 2. Base64-encode the config JSON
  const jsonContent = JSON.stringify(config, null, 2)
  const encoded = btoa(unescape(encodeURIComponent(jsonContent)))

  // 3. PUT to create or update the file
  const putRes = await ghFetch(
    `/repos/${owner}/${repo}/contents/${BRAND_FILE_PATH}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        message: 'chore: update branding config via JoePDF admin panel',
        content: encoded,
        ...(currentSha ? { sha: currentSha } : {}),
      }),
    },
    token,
  )

  if (!putRes.ok) {
    const err = await putRes.json() as { message?: string }
    throw new Error(err.message ?? `Failed to commit (${putRes.status})`)
  }
}
