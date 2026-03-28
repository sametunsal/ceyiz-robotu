import type { Product, ProductStyle } from './types/product'

/** Renk alanı: "Gri (#808080)" → "gri" */
export function parseColorName(colorField: string): string {
  const beforeParen = colorField.split('(')[0]?.trim() ?? colorField
  return beforeParen
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
}

const NEUTRAL_COLOR_KEYS = new Set([
  'beyaz',
  'bej',
  'gri',
  'krem',
  'antrasit',
])

export function isNeutralPalette(colorField: string): boolean {
  return NEUTRAL_COLOR_KEYS.has(parseColorName(colorField))
}

const DEFAULT_HARMONY = ['gri', 'beyaz', 'bej', 'krem', 'antrasit']

const SOFA_TO_HARMONY: Record<string, string[]> = {
  lacivert: ['gri', 'beyaz', 'bej', 'krem', 'antrasit'],
  mavi: ['gri', 'beyaz', 'bej', 'krem', 'antrasit'],
  bordo: ['krem', 'bej', 'gri', 'beyaz'],
  kirmizi: ['krem', 'bej', 'gri', 'beyaz'],
  krem: ['gri', 'lacivert', 'bej', 'beyaz', 'antrasit'],
  bej: ['gri', 'beyaz', 'lacivert', 'antrasit', 'krem'],
  beyaz: ['gri', 'bej', 'krem', 'lacivert', 'antrasit'],
  gri: ['beyaz', 'krem', 'bej', 'bordo', 'lacivert'],
  antrasit: ['beyaz', 'krem', 'bej', 'gri'],
  zeytin: ['krem', 'bej', 'beyaz', 'gri'],
  yesil: ['krem', 'bej', 'beyaz', 'gri'],
  hardal: ['gri', 'lacivert', 'antrasit', 'beyaz'],
}

export function harmonyColorNamesForSofa(sofa: Product | undefined): string[] {
  if (!sofa) return []
  const key = parseColorName(sofa.color)
  return SOFA_TO_HARMONY[key] ?? DEFAULT_HARMONY
}

export function isHarmonyMatch(
  sofa: Product | undefined,
  productColorField: string,
): boolean {
  if (!sofa) return false
  const palette = new Set(harmonyColorNamesForSofa(sofa))
  const name = parseColorName(productColorField)
  return palette.has(name)
}

export type StyleListFallback = 'none' | 'neutral-alternate' | 'all-category'

/**
 * Kategori + stil kilidi. Boş dönerse: nötr paletli alternatif çizgi, o da boşsa tüm kategori.
 */
export function resolveStepProducts(
  catalog: Product[],
  category: string,
  lockedStyle: Product['style'] | undefined,
  isSofaStep: boolean,
): { products: Product[]; fallback: StyleListFallback } {
  const inCat = catalog.filter((p) => p.category === category)

  if (isSofaStep || !lockedStyle) {
    return { products: inCat, fallback: 'none' }
  }

  if (lockedStyle === 'Nötr' || lockedStyle === 'Zamansız') {
    return { products: inCat, fallback: 'none' }
  }

  const lineMatch = (p: Product) =>
    p.style === lockedStyle || p.style === 'Nötr' || p.style === 'Zamansız'

  let list = inCat.filter(lineMatch)
  if (list.length > 0) {
    return { products: list, fallback: 'none' }
  }

  const alternateLine: Product['style'] =
    lockedStyle === 'Klasik' ? 'Modern' : 'Klasik'

  list = inCat.filter(
    (p) =>
      isNeutralPalette(p.color) &&
      (p.style === alternateLine ||
        p.style === 'Nötr' ||
        p.style === 'Zamansız'),
  )
  if (list.length > 0) {
    return { products: list, fallback: 'neutral-alternate' }
  }

  return { products: inCat, fallback: 'all-category' }
}

export function filterCatalogByCategoryAndStyle(
  catalog: Product[],
  category: string,
  lockedStyle: ProductStyle | undefined,
  isSofaStep: boolean,
): Product[] {
  return resolveStepProducts(catalog, category, lockedStyle, isSofaStep)
    .products
}

export function minPriceInCategory(
  catalog: Product[],
  category: string,
  lockedStyle: ProductStyle | undefined,
): number | null {
  const { products } = resolveStepProducts(
    catalog,
    category,
    lockedStyle,
    false,
  )
  if (products.length === 0) return null
  return Math.min(...products.map((p) => p.price))
}

export function sortWithHarmonyFirst(
  products: Product[],
  sofa: Product | undefined,
  currentStepIndex: number,
): Product[] {
  if (currentStepIndex === 0 || !sofa) {
    return [...products].sort((a, b) => a.price - b.price)
  }
  return [...products].sort((a, b) => {
    const ha = isHarmonyMatch(sofa, a.color)
    const hb = isHarmonyMatch(sofa, b.color)
    if (ha !== hb) return ha ? -1 : 1
    return a.price - b.price
  })
}

export function displayColorName(colorField: string): string {
  return (colorField.split('(')[0] ?? colorField).trim()
}
