/**
 * Pure functions for page management.
 * These operate on the logical page order array stored in the Zustand store.
 * The actual PDF manipulation happens at export time in pdfExporter.
 */

/** Move a page from one logical index to another. */
export function reorderPages(
  order: number[],
  fromIndex: number,
  toIndex: number,
): number[] {
  if (fromIndex === toIndex) return order
  const next = [...order]
  const [moved] = next.splice(fromIndex, 1)
  if (moved !== undefined) {
    next.splice(toIndex, 0, moved)
  }
  return next
}

/** Remove a page at the given logical index. */
export function deletePageAt(order: number[], logicalIndex: number): number[] {
  return order.filter((_, i) => i !== logicalIndex)
}

/** Insert a duplicate of the page at logicalIndex immediately after it. */
export function duplicatePage(order: number[], logicalIndex: number): number[] {
  const next = [...order]
  const originalRef = next[logicalIndex]
  if (originalRef === undefined) return order
  next.splice(logicalIndex + 1, 0, originalRef)
  return next
}

/** Extract a range of pages (inclusive, 0-based logical indices). */
export function extractPageRange(
  order: number[],
  startIndex: number,
  endIndex: number,
): number[] {
  return order.slice(startIndex, endIndex + 1)
}

/** Insert a blank page after the given logical index (-1 = start). */
export function insertBlankPage(
  order: number[],
  afterIndex: number,
  blankOriginalRef: number,
): number[] {
  const next = [...order]
  next.splice(afterIndex + 1, 0, blankOriginalRef)
  return next
}
