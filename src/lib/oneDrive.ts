import { PublicClientApplication } from '@azure/msal-browser'
import type { AuthenticationResult } from '@azure/msal-browser'

let msalApp: PublicClientApplication | null = null
let msalClientId = ''

async function getMsalApp(clientId: string): Promise<PublicClientApplication> {
  if (!msalApp || clientId !== msalClientId) {
    const app = new PublicClientApplication({
      auth: {
        clientId,
        redirectUri: window.location.origin,
      },
      cache: { cacheLocation: 'sessionStorage' },
    })
    await app.initialize()
    msalClientId = clientId
    msalApp = app
  }
  return msalApp
}

const SCOPES = ['Files.ReadWrite']

export async function uploadToOneDrive(
  clientId: string,
  fileName: string,
  bytes: Uint8Array,
): Promise<string> {
  const app = await getMsalApp(clientId)

  let result: AuthenticationResult
  const accounts = app.getAllAccounts()
  if (accounts.length > 0) {
    try {
      result = await app.acquireTokenSilent({ scopes: SCOPES, account: accounts[0] })
    } catch {
      result = await app.acquireTokenPopup({ scopes: SCOPES })
    }
  } else {
    result = await app.acquireTokenPopup({ scopes: SCOPES })
  }

  const safeName = encodeURIComponent(fileName)
  const url = `https://graph.microsoft.com/v1.0/me/drive/root:/Documents/${safeName}:/content`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${result.accessToken}`,
      'Content-Type': 'application/pdf',
    },
    body: bytes.buffer as ArrayBuffer,
  })

  if (!res.ok) throw new Error(`OneDrive upload failed (${res.status} ${res.statusText})`)
  const data = await res.json() as { webUrl?: string }
  return data.webUrl ?? 'https://onedrive.live.com'
}
