import type { Product, RoomId } from './types/product'
import { formatTry } from './formatMoney'
import { ROOM_CATEGORY_STEPS, ROOM_ORDER } from './roomCategories'
import { displayColorName, isHarmonyMatch } from './smartWizard'

export { ROOM_ORDER } from './roomCategories'

export type MultiRoomSelections = Record<
  RoomId,
  Partial<Record<string, Product | null>>
>

const ACCENT_CATS = [
  'Halı',
  'Yemek Masası',
  'Aydınlatma',
  'Perde',
] as const

function pickSofa(rs: MultiRoomSelections): Product | undefined {
  for (const room of ROOM_ORDER) {
    const k = rs[room]?.['Koltuk']
    if (k) return k
  }
  return undefined
}

function harmonyHitsMulti(sofa: Product, rs: MultiRoomSelections): number {
  let n = 0
  for (const room of ROOM_ORDER) {
    for (const cat of ACCENT_CATS) {
      const p = rs[room]?.[cat]
      if (p && isHarmonyMatch(sofa, p.color)) n += 1
    }
  }
  return n
}

export function allSlotsComplete(rs: MultiRoomSelections): boolean {
  return ROOM_ORDER.every((room) =>
    ROOM_CATEGORY_STEPS[room].every((step) =>
      Boolean(rs[room]?.[step.category]),
    ),
  )
}

export function countSelectedProducts(rs: MultiRoomSelections): number {
  let n = 0
  for (const room of ROOM_ORDER) {
    for (const step of ROOM_CATEGORY_STEPS[room]) {
      if (rs[room]?.[step.category]) n += 1
    }
  }
  return n
}

export function countRoomsWithSelections(rs: MultiRoomSelections): number {
  let n = 0
  for (const room of ROOM_ORDER) {
    if (
      ROOM_CATEGORY_STEPS[room].some((step) => rs[room]?.[step.category])
    ) {
      n += 1
    }
  }
  return n
}

export function computeStyleScore(
  rs: MultiRoomSelections,
  overBudget: boolean,
): number {
  const sofa = pickSofa(rs)
  if (!sofa) return 5
  const hits = harmonyHitsMulti(sofa, rs)
  let raw = 5.2 + hits * 0.35 + (overBudget ? -1.2 : 0.9)
  if (sofa.style === 'Modern' && hits >= 4) raw += 0.35
  if (sofa.style === 'Klasik' && hits >= 4) raw += 0.4
  if (
    (sofa.style === 'Nötr' || sofa.style === 'Zamansız') &&
    hits >= 4
  ) {
    raw += 0.3
  }
  return Math.min(10, Math.max(1, Math.round(raw)))
}

export function buildInteriorNarrative(
  rs: MultiRoomSelections,
  overBudget: boolean,
  score: number,
): string {
  const picked = countSelectedProducts(rs)
  if (picked === 0) {
    return 'Henüz seçim yok; birkaç parça eklediğinde burada kısa bir özet göreceksin.'
  }

  if (!allSlotsComplete(rs)) {
    const budgetBit = overBudget
      ? ' Toplam bütçe şu an aşılıyor; seçimlerini veya tutarı gözden geçirebilirsin.'
      : ' Toplam bütçe tarafı şimdilik dengede görünüyor.'
    return `Şu ana kadar ${picked} parça seçtin; boş kalan kategoriler isteğe bağlı.${budgetBit} Stil puanı (${score}/10) şimdilik seçtiklerinin uyumunu yansıtıyor — listeyi genişlettikçe metin de zenginleşir.`
  }

  const sofa = pickSofa(rs)
  if (!sofa) {
    return 'Koltuk seçimi yok; tam özet metni için en az bir odada oturma grubu seçebilirsin. Diğer seçimlerin yine de bir arada değerlendirildi.'
  }

  const hits = harmonyHitsMulti(sofa, rs)
  const c = displayColorName(sofa.color)
  const st = sofa.style

  const salon = rs.Salon
  const mutfak = rs.Mutfak

  const openers = [
    `Dört odalı çeyiz konfigürasyonun, ${c.toLowerCase()} ${st.toLowerCase()} koltuk ekseninde birbirine bağlanıyor.`,
    `Geniş bir seçim yapmışsın: ${st.toLowerCase()} çizgide ${c.toLowerCase()} koltuk, diğer odaların stil dilini belirliyor.`,
    `Planın profesyonel bir konfigüratör disipliniyle ilerliyor; ${c.toLowerCase()} tonlu koltuk ana referansın.`,
  ]
  const opener = openers[hits % openers.length]

  let mid = ''
  if (salon?.Halı && mutfak?.['Yemek Masası']) {
    mid = ` Salon halısı (${displayColorName(salon.Halı.color).toLowerCase()}) ile mutfak yemek masası (${displayColorName(mutfak['Yemek Masası'].color).toLowerCase()}) arasında günlük yaşam akışı için güçlü bir zemin kurmuşsun.`
  } else {
    mid = ' Odalar arası geçişlerde renk ve stil tutarlılığına dikkat etmişsin.'
  }

  let harmonyBit = ''
  if (hits >= 8) {
    harmonyBit =
      ' Birçok parça koltuk paletiyle uyumlu; robot önerileriyle örtüşen seçimler baskın.'
  } else if (hits >= 3) {
    harmonyBit =
      ' Bazı odalarda koltuk rengine özellikle yakın tonlar seçmişsin; bu bütünlüğü güçlendiriyor.'
  } else {
    harmonyBit =
      ' Daha kontrastlı bir çizgi izleniyor; bu da her odaya ayrı karakter vermene yardım eder.'
  }

  const budgetBit = overBudget
    ? ' Toplam bütçe şu an aşılıyor; bir odada veya kategoride alternatif düşünmek dengeyi toparlar.'
    : ' Toplam bütçe şu an kontrol altında görünüyor.'

  const closer = ` Çoklu oda bütünlüğünü ${score}/10 olarak özetliyorum; skor renk uyumu ve stil tekrarlarına dayanıyor.`

  return `${opener}${mid}${harmonyBit}${budgetBit}${closer}`
}

const ROOM_LABELS: Record<RoomId, string> = {
  Salon: 'Salon',
  Mutfak: 'Mutfak',
  'Yatak Odası': 'Yatak odası',
  Antre: 'Antre',
}

export function buildListClipboardText(
  rs: MultiRoomSelections,
  totalBudget: number,
  spent: number,
  score: number,
  combinationCode: string,
): string {
  const lines: string[] = [
    'Çeyiz Robotu — Çoklu oda çeyiz listem',
    `Kombinasyon kodun: ${combinationCode}`,
    `Bütçe: ${formatTry(totalBudget)} | Harcama: ${formatTry(spent)}`,
    '',
  ]
  for (const room of ROOM_ORDER) {
    lines.push(`【 ${ROOM_LABELS[room]} 】`)
    for (const { category, title } of ROOM_CATEGORY_STEPS[room]) {
      const p = rs[room]?.[category]
      if (p) {
        lines.push(`• ${title}: ${p.name} (${p.brand}) — ${formatTry(p.price)}`)
        lines.push(`  Renk: ${p.color} | Stil: ${p.style}`)
      } else {
        lines.push(`• ${title}: — (isteğe bağlı)`)
      }
    }
    lines.push('')
  }
  lines.push(`Stil puanı (AI iç mimar): ${score}/10`)
  return lines.join('\n')
}
