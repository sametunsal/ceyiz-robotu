import {
  Copy,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react'
import type { Product } from '../types/product'
import { formatTry } from '../formatMoney'
import { ROOM_ORDER, ROOM_CATEGORY_STEPS } from '../roomCategories'
import {
  Armchair,
  Blinds,
  Lamp,
  LayoutGrid,
  RectangleHorizontal,
  UtensilsCrossed,
} from 'lucide-react'

function categoryIcon(category: string) {
  switch (category) {
    case 'Koltuk':
      return Armchair
    case 'Halı':
      return RectangleHorizontal
    case 'Yemek Masası':
      return UtensilsCrossed
    case 'Aydınlatma':
      return Lamp
    case 'Perde':
      return Blinds
    default:
      return LayoutGrid
  }
}

interface SpendingBreakdownRow {
  key: string
  label: string
  amount: number
  pct: number
  colorClass: string
}

interface SummaryModalProps {
  isOpen: boolean
  onClose: () => void
  selections: {
    Salon: Record<string, Product | null>
    Mutfak: Record<string, Product | null>
    'Yatak Odası': Record<string, Product | null>
    Antre: Record<string, Product | null>
  }
  totalBudget: number
  spent: number
  remaining: number
  styleScore: number
  interiorStory: string
  combinationCode: string | null
  copyFeedback: boolean
  onCopy: () => void
  onRestart: () => void
  spendingBreakdown: SpendingBreakdownRow[]
}

export function SummaryModal({
  isOpen,
  onClose,
  selections,
  totalBudget,
  spent,
  remaining,
  styleScore,
  interiorStory,
  combinationCode,
  copyFeedback,
  onCopy,
  onRestart,
  spendingBreakdown,
}: SummaryModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-stone-950/55 p-4 pb-24 backdrop-blur-sm sm:p-8 sm:pb-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-title"
      onClick={onClose}
    >
      <div
        className="relative my-4 w-full max-w-6xl rounded-3xl border border-stone-200/80 bg-gradient-to-b from-white to-stone-50 shadow-2xl shadow-stone-900/20"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-stone-200 bg-white p-2 text-stone-600 shadow-sm transition hover:bg-stone-50"
          aria-label="Kapat"
        >
          <X className="size-5" />
        </button>

        <div className="border-b border-stone-100 px-6 pb-6 pt-10 sm:px-10 sm:pt-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-rose-700">
            Özet ekranı
          </p>
          <h2
            id="summary-title"
            className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl"
          >
            Çeyiz kombinasyonun hazır
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            Toplam {formatTry(spent)} · Bütçe {formatTry(totalBudget)} · Kalan{' '}
            {formatTry(remaining)}
          </p>
          {combinationCode ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50/80 px-3 py-2 font-mono text-sm font-semibold text-rose-900">
              Kombinasyon kodun:{' '}
              <span className="tracking-wide">{combinationCode}</span>
            </p>
          ) : null}
        </div>

        <div className="space-y-10 px-4 py-6 sm:px-8">
          {ROOM_ORDER.map((room) => (
            <section key={room} aria-label={room}>
              <h3 className="mb-4 border-b border-stone-200 pb-2 text-sm font-bold uppercase tracking-widest text-rose-800">
                {room}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {ROOM_CATEGORY_STEPS[room].map((step) => {
                  const p = selections[room]?.[step.category]
                  const SIcon = categoryIcon(step.category)
                  return (
                    <article
                      key={`${room}-${step.category}`}
                      className={`flex flex-col overflow-hidden rounded-2xl border shadow-md transition-all hover:shadow-lg ${
                        p
                          ? 'border-stone-200 bg-white'
                          : 'border-dashed border-stone-300 bg-stone-50/80'
                      }`}
                    >
                      <div className="relative aspect-[4/3] bg-stone-100">
                        {p ? (
                          <img
                            src={p.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm font-medium text-stone-400">
                            İsteğe bağlı — henüz seçilmedi
                          </div>
                        )}
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-700 shadow">
                          <SIcon
                            className="size-3.5 text-rose-600"
                            aria-hidden
                          />
                          {step.title}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        {p ? (
                          <>
                            <p className="text-[11px] font-semibold uppercase text-stone-500">
                              {p.brand}
                            </p>
                            <h3 className="text-base font-semibold leading-snug text-stone-900">
                              {p.name}
                            </h3>
                            <p className="mt-auto text-lg font-bold text-rose-800">
                              {formatTry(p.price)}
                            </p>
                          </>
                        ) : (
                          <p className="mt-auto text-sm text-stone-500">
                            —
                          </p>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mx-4 mb-4 rounded-2xl border border-stone-200/90 bg-white/90 p-5 sm:mx-8 sm:p-6">
          <h3 className="text-sm font-semibold text-stone-900">
            Harcama dağılımı
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            Her oda ve kategori, toplam bütçene göre yüzde kaç yer kaplıyor?
          </p>
          <ul
            className="mt-4 space-y-3.5"
            aria-label="Kategori bazlı harcama yüzdeleri"
          >
            {spendingBreakdown.map((row) => (
              <li key={row.key}>
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-stone-800">
                    {row.label}
                  </span>
                  <span className="tabular-nums text-stone-600">
                    <span className="font-semibold text-stone-900">
                      %{row.pct.toLocaleString('tr-TR', {
                        minimumFractionDigits: row.pct % 1 ? 1 : 0,
                        maximumFractionDigits: 1,
                      })}
                    </span>
                    <span className="text-stone-400"> · </span>
                    {formatTry(row.amount)}
                  </span>
                </div>
                <div
                  className="h-2.5 overflow-hidden rounded-full bg-stone-100"
                  role="presentation"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${row.colorClass}`}
                    style={{
                      width: `${Math.min(100, row.pct)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-4 mb-4 rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-white p-6 sm:mx-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg">
              <Sparkles className="size-6" aria-hidden />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-stone-900">
                AI İç Mimar Yorumu
              </h3>
              <p className="text-sm text-stone-500">
                Seçimlerine göre otomatik üretildi — eğlenceli bir rehber
                niteliğindedir.
              </p>
            </div>
            <div className="ml-auto flex items-baseline gap-1 rounded-2xl bg-white px-4 py-2 shadow-inner ring-1 ring-violet-100">
              <span className="text-3xl font-bold tabular-nums text-violet-700">
                {styleScore}
              </span>
              <span className="text-sm font-medium text-violet-600/80">/10</span>
              <span className="sr-only">Stil puanı</span>
            </div>
          </div>
          <p className="mt-5 text-[15px] leading-relaxed text-stone-700">
            {interiorStory}
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-stone-100 bg-stone-50/80 px-4 py-5 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
          >
            <Copy className="size-4" aria-hidden />
            {copyFeedback ? 'Kopyalandı!' : 'Listeyi Kopyala'}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-stone-800"
          >
            <RotateCcw className="size-4" aria-hidden />
            Yeniden Başla
          </button>
        </div>
      </div>
    </div>
  )
}