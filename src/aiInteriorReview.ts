import type { Product } from './types/product'
import { displayColorName, isHarmonyMatch } from './smartWizard'

type Selections = Partial<Record<string, Product>>

function harmonyHits(sofa: Product, selections: Selections): number {
  let n = 0
  for (const cat of ['Halı', 'Yemek Masası', 'Aydınlatma'] as const) {
    const p = selections[cat]
    if (p && isHarmonyMatch(sofa, p.color)) n += 1
  }
  return n
}

export function computeStyleScore(
  selections: Selections,
  overBudget: boolean,
): number {
  const sofa = selections.Koltuk
  if (!sofa) return 5
  const hits = harmonyHits(sofa, selections)
  let raw = 5.5 + hits * 1.2 + (overBudget ? -1.5 : 1)
  if (sofa.style === 'Modern' && hits >= 2) raw += 0.3
  if (sofa.style === 'Klasik' && hits >= 2) raw += 0.4
  if (
    (sofa.style === 'Nötr' || sofa.style === 'Zamansız') &&
    hits >= 2
  ) {
    raw += 0.35
  }
  return Math.min(10, Math.max(1, Math.round(raw)))
}

export function buildInteriorNarrative(
  selections: Selections,
  overBudget: boolean,
  score: number,
): string {
  const sofa = selections.Koltuk
  const halı = selections.Halı
  const masa = selections['Yemek Masası']
  const lamba = selections.Aydınlatma
  if (!sofa || !halı || !masa || !lamba) {
    return 'Seçimlerin tamamlanınca burada samimi bir iç mimar yorumu göreceksin.'
  }

  const c = displayColorName(sofa.color)
  const st = sofa.style
  const hits = harmonyHits(sofa, selections)

  const openers = [
    `Harika bir seçim! ${c} ${st.toLowerCase()} koltuğun, ${displayColorName(halı.color).toLowerCase()} tonlarındaki halıyla birlikte dengeli bir zemin oluşturmuş.`,
    `Gözünüze güvenmişsiniz; ${st.toLowerCase()} çizgide ${c.toLowerCase()} koltuk, mekânın karakterini netleştiriyor.`,
    `Bu kombinasyon cesur ama kontrollü: ${c} koltuk merkezde, eşlik eden parçalar onu tamamlıyor.`,
  ]
  const opener = openers[hits % openers.length]

  let mid = ''
  if (st === 'Modern') {
    mid = ` ${displayColorName(masa.color)} yemek masası ve ${displayColorName(lamba.color).toLowerCase()} aydınlatmayla minimalist, hafif İskandinav bir esinti hissediliyor.`
  } else if (st === 'Klasik') {
    mid = ` ${displayColorName(masa.color)} masa ve ${displayColorName(lamba.color).toLowerCase()} ışık seçimi, klasik sıcaklığı çağdaş konforla birleştiriyor.`
  } else {
    mid = ` ${displayColorName(masa.color)} masa ve ${displayColorName(lamba.color).toLowerCase()} ışık seçimi, nötr-zamansız çizgiyi dengeli ve esnek tutuyor.`
  }

  let harmonyBit = ''
  if (hits === 3) {
    harmonyBit =
      ' Renk geçişleri birbirini yumuşatıyor; robot önerileriyle uyum neredeyse mükemmel örtüşüyor.'
  } else if (hits >= 1) {
    harmonyBit =
      ' Bazı parçalar koltuk paletiyle özellikle iyi konuşuyor; istersen tek bir aksesuarla kontrast ekleyebilirsin.'
  } else {
    harmonyBit =
      ' Daha çarpıcı bir kontrast tercih etmiş olabilirsin; bu da karakterli bir salon için gayet iddialı.'
  }

  let budgetBit = overBudget
    ? ' Bütçe tarafında hafif bir esneme var; uzun vadede önceliklendirme yapmak rahatlatır.'
    : ' Bütçeyi de akıllıca yönettin; planın hem göze hem cebe daha uyumlu.'

  const closer = ` Genel stil bütünlüğünü ${score}/10 olarak değerlendiriyorum; bu skor seçimlerinin tutarlılığını ve renk uyumunu yansıtıyor.`

  return `${opener}${mid}${harmonyBit}${budgetBit}${closer}`
}

function fmtTry(n: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n)
}

export function buildListClipboardText(
  selections: Selections,
  totalBudget: number,
  spent: number,
  score: number,
  combinationCode: string,
): string {
  const lines: string[] = [
    'Çeyiz Robotu — Çeyiz listem',
    `Kombinasyon kodun: ${combinationCode}`,
    `Bütçe: ${fmtTry(totalBudget)} | Harcama: ${fmtTry(spent)}`,
    '',
  ]
  for (const cat of ['Koltuk', 'Halı', 'Yemek Masası', 'Aydınlatma'] as const) {
    const p = selections[cat]
    if (p) {
      lines.push(`• ${cat}: ${p.name} (${p.brand}) — ${fmtTry(p.price)}`)
      lines.push(`  Renk: ${p.color} | Stil: ${p.style}`)
    }
  }
  lines.push('')
  lines.push(`Stil puanı (AI iç mimar): ${score}/10`)
  return lines.join('\n')
}
