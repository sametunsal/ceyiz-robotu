/**
 * roomAnalysis — Oda başı uyum ve stil analizi.
 * Tüm kategorileri (Koltuk, Halı, Yemek Masası, Aydınlatma, Perde) kapsar.
 */
import type { Product, RoomId } from '../types/product'
import type { MultiRoomSelections } from '../hooks/useSelections'
import { ROOM_CATEGORY_STEPS } from '../roomCategories'
import { isHarmonyMatch, displayColorName } from '../smartWizard'

export interface RoomAnalysis {
  room: RoomId
  label: string
  selectedCount: number
  totalSlots: number
  completionPct: number
  spent: number
  /** Koltuk rengiyle eşleşen ürün sayısı (Koltuk hariç seçilmiş olanlar içinden) */
  harmonyCount: number
  /** Koltuk hariç seçilmiş ürün sayısı */
  harmonyTotal: number
  /** Seçilen ürünlerin renk listesi (display adı) */
  colors: string[]
  products: Array<{
    category: string
    title: string
    product: Product | null
    isHarmony: boolean
  }>
}

const ROOM_LABELS: Record<RoomId, string> = {
  Salon: 'Salon',
  Mutfak: 'Mutfak',
  'Yatak Odası': 'Yatak Odası',
  Antre: 'Antre',
}

export function computeRoomAnalysis(
  room: RoomId,
  selections: MultiRoomSelections,
  sofa: Product | undefined,
): RoomAnalysis {
  const steps = ROOM_CATEGORY_STEPS[room]
  let selectedCount = 0
  let spent = 0
  let harmonyCount = 0
  let harmonyTotal = 0
  const colors: string[] = []
  const products: RoomAnalysis['products'] = []

  for (const step of steps) {
    const p = selections[room]?.[step.category] ?? null
    const isHarmony =
      p !== null && step.category !== 'Koltuk' && sofa != null
        ? isHarmonyMatch(sofa, p.color)
        : false

    products.push({
      category: step.category,
      title: step.title,
      product: p,
      isHarmony,
    })

    if (p) {
      selectedCount++
      spent += p.price
      colors.push(displayColorName(p.color))
      if (step.category !== 'Koltuk') {
        harmonyTotal++
        if (isHarmony) harmonyCount++
      }
    }
  }

  return {
    room,
    label: ROOM_LABELS[room],
    selectedCount,
    totalSlots: steps.length,
    completionPct:
      steps.length > 0 ? Math.round((selectedCount / steps.length) * 100) : 0,
    spent,
    harmonyCount,
    harmonyTotal,
    colors,
    products,
  }
}

export function computeAllRoomAnalyses(
  selections: MultiRoomSelections,
  sofa: Product | undefined,
  rooms: readonly RoomId[],
): RoomAnalysis[] {
  return rooms.map((room) => computeRoomAnalysis(room, selections, sofa))
}
