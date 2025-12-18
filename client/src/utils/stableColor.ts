import { chartColorPalette } from '../theme'

function fnv1aHash32(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export function getStableColorForLabel(
  label: string | null | undefined,
  palette: readonly string[] = chartColorPalette
): string {
  if (!palette.length) return '#9e9e9e'

  const normalized = (label ?? '').trim().toLowerCase()
  const key = normalized.length > 0 ? normalized : 'unknown'
  const idx = fnv1aHash32(key) % palette.length
  return palette[idx] ?? '#9e9e9e'
}


