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
}

export const DEFAULT_BRANDING: BrandingConfig = {
  orgName: 'Your Organisation',
  appName: 'JoePDF',
  logoDataUrl: null,
  primaryColor: '#1d4ed8',
  secondaryColor: '#1e40af',
  accentColor: '#3b82f6',
  footerText: '',
  supportEmail: '',
  privacyNotice: '',
}
