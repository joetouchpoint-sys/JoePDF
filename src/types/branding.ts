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
  // Heading font (UI — app name, org name in header bar and upload screen)
  headingFontFamily: string
  headingCustomFontBase64: string | null
  headingCustomFontName: string
  // Body font (text annotations added to PDFs)
  bodyFontFamily: string
  bodyCustomFontBase64: string | null  // renamed concept from customFontBase64
  bodyCustomFontName: string           // renamed concept from customFontName
  /** @deprecated use bodyCustomFontBase64 */
  customFontBase64: string | null
  /** @deprecated use bodyCustomFontName */
  customFontName: string
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
  headingFontFamily: "'Nunito', 'VAG Rounded', system-ui, sans-serif",
  headingCustomFontBase64: null,
  headingCustomFontName: '',
  bodyFontFamily: 'Helvetica',
  bodyCustomFontBase64: null,
  bodyCustomFontName: '',
  customFontBase64: null,
  customFontName: 'VAG Rounded',
  uploadDescription: 'Edit, redact, and manage PDF documents — entirely in your browser.',
  reportIssueUrl: '',
}
