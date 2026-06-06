export interface BrandingConfig {
  orgName: string
  appName: string
  logoDataUrl: string | null        // upload screen logo
  headerLogoDataUrl: string | null  // header bar logo (falls back to logoDataUrl)
  faviconDataUrl: string | null     // browser tab / bookmark favicon (falls back to auto-generate from logo)
  primaryColor: string
  secondaryColor: string
  accentColor: string
  footerText: string
  supportEmail: string
  privacyNotice: string
  customFontBase64: string | null
  customFontName: string
  headingFontFamily: string
  uploadDescription: string
  reportIssueUrl: string
}

export const DEFAULT_BRANDING: BrandingConfig = {
  orgName: 'Family Action',
  appName: 'JoePDF',
  logoDataUrl: null,
  headerLogoDataUrl: null,
  faviconDataUrl: null,
  primaryColor: '#178351',
  secondaryColor: '#292C4F',
  accentColor: '#A0DA00',
  footerText: '',
  supportEmail: '',
  privacyNotice: '',
  customFontBase64: null,
  customFontName: 'VAG Rounded',
  headingFontFamily: "'Nunito', 'VAG Rounded', system-ui, sans-serif",
  uploadDescription: 'Edit, redact, and manage PDF documents — entirely in your browser.',
  reportIssueUrl: '',
}
