# Branding Configuration Guide

## Accessing branding settings

Click the **settings icon** (⚙) in the top-right corner of the application to open the Branding & Settings panel.

Changes take effect immediately and are saved to the browser's `localStorage` — they persist across page reloads on the same device.

## Configurable options

| Option | Description |
|---|---|
| **Organisation name** | Displayed in the settings panel; used as the site title prefix |
| **Application name** | Replaces "JoePDF" in the header and browser tab title |
| **Logo** | Replaces the default icon in the header |
| **Primary colour** | Used for buttons, active states, and focus rings |
| **Secondary colour** | Used for hover states and secondary UI elements |
| **Accent colour** | Used for highlights and links |
| **Footer text** | Optional footer label (displayed in the settings panel) |
| **Support email** | Contact address shown in the settings panel |

## Logo specifications

| Use | Recommended dimensions | Formats |
|---|---|---|
| Header logo | 120 × 32 px or 200 × 48 px | PNG (transparent background), SVG |
| Favicon | 32 × 32 px | SVG (preferred), PNG |

The logo is displayed at up to 28px height in the header. Use a horizontal ("landscape") logo for best results. PNG files should have a transparent background.

Logos are stored as data URLs in `localStorage` — they are not uploaded to any server.

## Colours

Colours are applied as CSS custom properties on `:root`:

```css
--color-primary: #1d4ed8;    /* Main brand colour */
--color-secondary: #1e40af;  /* Darker variant */
--color-accent: #3b82f6;     /* Lighter variant */
```

Components use these via `bg-[--color-primary]` (Tailwind), so every button, active tool, and focus ring inherits the primary colour automatically.

## Programmatic / environment configuration

For deployment-time branding (so the app opens already branded), set the defaults in `src/types/branding.ts`:

```ts
export const DEFAULT_BRANDING: BrandingConfig = {
  orgName: 'Acme Charity',
  appName: 'Acme PDF Editor',
  logoDataUrl: null,
  primaryColor: '#006633',
  secondaryColor: '#004d26',
  accentColor: '#00994d',
  footerText: 'Internal tool — do not distribute',
  supportEmail: 'it@acme.org',
  privacyNotice: '',
}
```

After changing `DEFAULT_BRANDING`, rebuild the application (`npm run build`). Users who have never set their own branding (or who clear their localStorage) will see the new defaults.
