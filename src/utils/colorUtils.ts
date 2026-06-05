import { rgb } from 'pdf-lib'
import type { RGB } from 'pdf-lib'

/** Parse a hex color string to {r, g, b} in [0, 255] range. */
export function hexToRgb255(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean
  const num = parseInt(full, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

/** Convert hex color to pdf-lib RGB (values in [0, 1]). */
export function hexToPdfRgb(hex: string): RGB {
  const { r, g, b } = hexToRgb255(hex)
  return rgb(r / 255, g / 255, b / 255)
}

/** Convert hex + opacity (0-1) to a CSS rgba string. */
export function hexToRgba(hex: string, opacity: number): string {
  const { r, g, b } = hexToRgb255(hex)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/** Returns true if the color is considered "light" (for contrast decisions). */
export function isLightColor(hex: string): boolean {
  const { r, g, b } = hexToRgb255(hex)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}
