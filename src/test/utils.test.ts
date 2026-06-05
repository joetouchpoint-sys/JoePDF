import { describe, it, expect } from 'vitest'
import { isPdfBuffer, generateId, formatFileSize } from '@/utils/fileUtils'
import { hexToRgb255, isLightColor } from '@/utils/colorUtils'
import { reorderPages, deletePageAt, duplicatePage, extractPageRange } from '@/lib/pageManager'

describe('fileUtils', () => {
  it('identifies valid PDF magic bytes', () => {
    const pdfMagic = new TextEncoder().encode('%PDF-1.5 rest of file')
    expect(isPdfBuffer(pdfMagic.buffer)).toBe(true)
  })

  it('rejects non-PDF buffers', () => {
    const notPdf = new TextEncoder().encode('PK\x03\x04 zip file')
    expect(isPdfBuffer(notPdf.buffer)).toBe(false)
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })

  it('formats file sizes', () => {
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB')
  })
})

describe('colorUtils', () => {
  it('parses hex to RGB', () => {
    expect(hexToRgb255('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
    expect(hexToRgb255('#1d4ed8')).toEqual({ r: 29, g: 78, b: 216 })
    expect(hexToRgb255('#fff')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('identifies light and dark colors', () => {
    expect(isLightColor('#ffffff')).toBe(true)
    expect(isLightColor('#000000')).toBe(false)
    expect(isLightColor('#ffff00')).toBe(true)
    expect(isLightColor('#1d4ed8')).toBe(false)
  })
})

describe('pageManager', () => {
  const order = [0, 1, 2, 3, 4]

  it('reorders pages correctly', () => {
    expect(reorderPages(order, 0, 4)).toEqual([1, 2, 3, 4, 0])
    expect(reorderPages(order, 2, 0)).toEqual([2, 0, 1, 3, 4])
    expect(reorderPages(order, 1, 1)).toEqual([0, 1, 2, 3, 4])
  })

  it('deletes a page', () => {
    expect(deletePageAt(order, 2)).toEqual([0, 1, 3, 4])
    expect(deletePageAt(order, 0)).toEqual([1, 2, 3, 4])
    expect(deletePageAt(order, 4)).toEqual([0, 1, 2, 3])
  })

  it('duplicates a page', () => {
    expect(duplicatePage(order, 0)).toEqual([0, 0, 1, 2, 3, 4])
    expect(duplicatePage(order, 4)).toEqual([0, 1, 2, 3, 4, 4])
  })

  it('extracts a page range', () => {
    expect(extractPageRange(order, 1, 3)).toEqual([1, 2, 3])
    expect(extractPageRange(order, 0, 0)).toEqual([0])
  })
})
