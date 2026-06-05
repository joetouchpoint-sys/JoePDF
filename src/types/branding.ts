export interface BrandingConfig {
  orgName: string
  appName: string
  logoDataUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  footerText: string
  supportEmail: string
  privacyNotice: string
  customFontBase64: string | null
  customFontName: string
  uploadDescription: string
  reportIssueUrl: string
}

export const DEFAULT_BRANDING: BrandingConfig = {
  orgName: 'Family Action',
  appName: 'JoePDF',
  logoDataUrl: null,
  primaryColor: '#178351',   // Family Action Green
  secondaryColor: '#292C4F', // Navy Blue
  accentColor: '#A0DA00',    // Lime Green
  footerText: '',
  supportEmail: '',
  privacyNotice: '',
  customFontBase64: null,
  customFontName: 'VAG Rounded',
  uploadDescription: 'Edit, redact, and manage PDF documents — entirely in your browser.',
  reportIssueUrl: '',
}
