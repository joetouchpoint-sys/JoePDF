const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4 MB
const MAX_DIMENSION = 3000 // pixels

export interface ImportedImage {
  src: string
  naturalWidth: number
  naturalHeight: number
}

export class ImageImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageImportError'
  }
}

/** Load an image File, validate it, return a data URL and dimensions. */
export async function importImage(file: File): Promise<ImportedImage> {
  if (!file.type.startsWith('image/')) {
    throw new ImageImportError('Only image files are accepted.')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new ImageImportError(
      `Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 4 MB.`,
    )
  }

  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new ImageImportError('Failed to read image file.'))
    reader.readAsDataURL(file)
  })

  const { width, height } = await getImageDimensions(src)

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return resizeImage(src, width, height)
  }

  return { src, naturalWidth: width, naturalHeight: height }
}

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new ImageImportError('Failed to load image.'))
    img.src = src
  })
}

async function resizeImage(
  src: string,
  originalWidth: number,
  originalHeight: number,
): Promise<ImportedImage> {
  const ratio = Math.min(MAX_DIMENSION / originalWidth, MAX_DIMENSION / originalHeight)
  const width = Math.round(originalWidth * ratio)
  const height = Math.round(originalHeight * ratio)

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new ImageImportError('Failed to resize image.'))
    i.src = src
  })

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new ImageImportError('Resize failed.'))
        const reader = new FileReader()
        reader.onload = () =>
          resolve({ src: reader.result as string, naturalWidth: width, naturalHeight: height })
        reader.onerror = () => reject(new ImageImportError('Failed to read resized image.'))
        reader.readAsDataURL(blob)
      },
      'image/png',
    )
  })
}
