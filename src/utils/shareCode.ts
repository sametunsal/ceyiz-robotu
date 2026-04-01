/**
 * shareCode — Seçimleri base64url'e encode/decode eder.
 * URL parametresi: ?share=<base64url>
 */
import type { Product, RoomId } from '../types/product'
import type { MultiRoomSelections } from '../hooks/useSelections'
import { ROOM_ORDER, ROOM_CATEGORY_STEPS } from '../roomCategories'

function emptySelections(): MultiRoomSelections {
  return { Salon: {}, Mutfak: {}, 'Yatak Odası': {}, Antre: {} }
}

/** Seçimleri sadece ID bazlı compact JSON'a → base64url'e dönüştür */
export function encodeSelections(selections: MultiRoomSelections): string {
  const obj: Record<string, Record<string, number | null>> = {}
  for (const room of ROOM_ORDER) {
    obj[room] = {}
    for (const step of ROOM_CATEGORY_STEPS[room]) {
      const p = selections[room as RoomId]?.[step.category]
      obj[room][step.category] = p ? p.id : null
    }
  }
  try {
    return btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  } catch {
    return ''
  }
}

/** base64url kodunu çöz → ID'leri Product'lara eşle */
export function decodeShareCode(
  code: string,
  products: Product[],
): MultiRoomSelections | null {
  try {
    const base64 = code.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const obj = JSON.parse(atob(padded)) as Record<
      string,
      Record<string, number | null>
    >
    const productMap = new Map(products.map((p) => [p.id, p]))
    const result = emptySelections()
    for (const room of ROOM_ORDER) {
      if (!obj[room]) continue
      for (const [cat, id] of Object.entries(obj[room])) {
        if (typeof id === 'number') {
          const product = productMap.get(id)
          if (product) result[room as RoomId][cat] = product
        }
      }
    }
    return result
  } catch {
    return null
  }
}

/** Paylaşılan seçimdeki ürün sayısını say */
export function countDecodedProducts(decoded: MultiRoomSelections): number {
  let n = 0
  for (const room of ROOM_ORDER) {
    for (const step of ROOM_CATEGORY_STEPS[room]) {
      if (decoded[room as RoomId]?.[step.category]) n++
    }
  }
  return n
}

/** Tam paylaşım URL'si oluştur */
export function buildShareUrl(selections: MultiRoomSelections): string {
  const code = encodeSelections(selections)
  if (!code) return ''
  return `${window.location.origin}${window.location.pathname}?share=${code}`
}
