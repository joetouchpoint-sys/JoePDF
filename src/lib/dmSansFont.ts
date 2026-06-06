export interface DmSansFontSet {
  regular: Uint8Array
  bold: Uint8Array
  italic: Uint8Array
  boldItalic: Uint8Array
}

let cache: DmSansFontSet | null = null

async function fetchFont(variant: string): Promise<Uint8Array> {
  const url = `${import.meta.env.BASE_URL}fonts/dm-sans-${variant}.woff2`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load DM Sans font (${variant}): ${res.status}`)
  return new Uint8Array(await res.arrayBuffer())
}

export async function loadDmSansFonts(): Promise<DmSansFontSet> {
  if (cache) return cache
  const [regular, bold, italic, boldItalic] = await Promise.all([
    fetchFont('400-normal'),
    fetchFont('700-normal'),
    fetchFont('400-italic'),
    fetchFont('700-italic'),
  ])
  cache = { regular, bold, italic, boldItalic }
  return cache
}
