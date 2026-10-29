// Pixeles que reciben los mismos eventos que el pixel principal del link.
// El token de cada uno va en la variable de entorno META_TOKEN_<pixelId>.
const LINKED_PIXELS: Record<string, string[]> = {
  // Aida Qui
  '1942441866476662': ['2327321628069315'],
}

export function pixelsFor(mainPixelId: string, extra: string[] = []): string[] {
  return Array.from(new Set([mainPixelId, ...(LINKED_PIXELS[mainPixelId] || []), ...extra].filter(Boolean)))
}
