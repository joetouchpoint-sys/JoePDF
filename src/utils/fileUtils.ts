const PDF_MAGIC = '%PDF'

/** Check if an ArrayBuffer starts with the PDF magic bytes. */
export function isPdfBuffer(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer, 0, 4)
  const magic = String.fromCharCode(...bytes)
  return magic === PDF_MAGIC
}

/** Convert ArrayBuffer → Uint8Array */
export function toUint8Array(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer)
}

/** Convert Uint8Array → ArrayBuffer */
export function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

/** Convert Blob → ArrayBuffer */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer()
}

/** Convert ArrayBuffer → data URL (for images etc.) */
export function arrayBufferToDataUrl(
  buffer: ArrayBuffer,
  mimeType: string,
): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return `data:${mimeType};base64,${btoa(binary)}`
}

/** Generate a unique ID for annotations. */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Trigger browser download of a Uint8Array as a file. */
export function downloadFile(bytes: Uint8Array, fileName: string, mimeType = 'application/pdf'): void {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

/** Format file size for display. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
