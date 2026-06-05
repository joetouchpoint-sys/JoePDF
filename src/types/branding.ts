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
  orgName: 'Family Action',
  appName: 'JoePDF',
  logoDataUrl: null,
  primaryColor: '#178351',   // Family Action Green
  secondaryColor: '#292C4F', // Navy Blue
  accentColor: '#A0DA00',    // Lime Green
  footerText: '',
  supportEmail: '',
  privacyNotice: '',
}
