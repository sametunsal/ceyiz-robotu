/**
 * BudgetPanel & DualPriceRangeSlider — Bütçe girişi ve fiyat aralığı filtresi.
 * Context'ten doğrudan okur; prop drilling tamamen kaldırıldı.
 */
import { memo } from 'react'
import { Check } from 'lucide-react'
import { useConfigurator } from '../context/ConfiguratorContext'
import { formatTry } from '../formatMoney'

// ─── DualPriceRangeSlider ────────────────────────────────────────────────────

interface DualPriceRangeSliderProps {
  minBound: number
  maxBound: number
  lo: number
  hi: number
  onLoChange: (v: number) => void
  onHiChange: (v: number) => void
}

export function DualPriceRangeSlider({
  minBound,
  maxBound,
  lo,
  hi,
  onLoChange,
  onHiChange,
}: DualPriceRangeSliderProps) {
  const span = Math.max(1, maxBound - minBound)
  const loClamped = Math.min(Math.max(lo, minBound), maxBound)
  const hiClamped = Math.min(Math.max(hi, minBound), maxBound)
  const loPct = ((loClamped - minBound) / span) * 100
  const hiPct = ((hiClamped - minBound) / span) * 100
  const left = Math.min(loPct, hiPct)
  const width = Math.max(0, Math.abs(hiPct - loPct))

  return (
    <div className="ceyiz-dual-range">
      <div className="ceyiz-dual-range__track" aria-hidden />
      <div
        className="ceyiz-dual-range__fill"
        style={{ left: `${left}%`, width: `${width}%` }}
      />
      <input
        className="ceyiz-dual-range__input--min"
        type="range"
        min={minBound}
        max={maxBound}
        step={1}
        value={loClamped}
        aria-label="Minimum fiyat"
        onChange={(e) => {
          const v = Number(e.target.value)
          onLoChange(Math.min(v, hiClamped))
        }}
      />
      <input
        className="ceyiz-dual-range__input--max"
        type="range"
        min={minBound}
        max={maxBound}
        step={1}
        value={hiClamped}
        aria-label="Maksimum fiyat"
        onChange={(e) => {
          const v = Number(e.target.value)
          onHiChange(Math.max(v, loClamped))
        }}
      />
    </div>
  )
}

// ─── BudgetPanel ─────────────────────────────────────────────────────────────

export const BudgetPanel = memo(function BudgetPanel() {
  const {
    budgetInput,
    budgetDirty,
    setBudgetInput,
    applyBudgetFromInput,
    priceRangeLo,
    priceRangeHi,
    priceBounds,
    setPriceRangeLo,
    setPriceRangeHi,
    resetPriceRange,
    loading,
    products,
  } = useConfigurator()

  const catalogLength = products.length
  const showDualPriceSlider =
    catalogLength > 0 && priceBounds.max > priceBounds.min

  return (
    <div className="space-y-6">
      {/* ── Bütçe girişi ──────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
          Toplam bütçem (TL)
        </p>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Örn: 100000"
          aria-label="Toplam bütçem (TL)"
          value={budgetInput}
          onChange={(e) => setBudgetInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applyBudgetFromInput()
          }}
          className="mt-2 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium tabular-nums outline-none ring-rose-500/25 focus:border-rose-400 focus:ring-2"
        />
        <button
          type="button"
          onClick={applyBudgetFromInput}
          className="mt-2 flex h-10 w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-stone-900 text-sm font-semibold text-white transition hover:bg-stone-800"
        >
          <Check className="size-4" aria-hidden />
          Güncelle
        </button>
        {budgetDirty && (
          <p className="mt-2 text-xs text-amber-700">
            Kaydetmek için Güncelle'ye bas.
          </p>
        )}
      </div>

      {/* ── Fiyat aralığı filtresi ─────────────────────────────────────── */}
      <div className="border-t border-stone-200/80 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
          Fiyat filtresi
        </p>
        <p className="mt-1 text-xs leading-relaxed text-stone-500">
          Tüm katalog fiyatlarına göre min–max. Grid anında güncellenir.
        </p>
        {showDualPriceSlider ? (
          <>
            <DualPriceRangeSlider
              minBound={priceBounds.min}
              maxBound={priceBounds.max}
              lo={priceRangeLo}
              hi={priceRangeHi}
              onLoChange={setPriceRangeLo}
              onHiChange={setPriceRangeHi}
            />
            <div className="mt-2 flex justify-between text-xs font-semibold tabular-nums text-stone-800">
              <span>{formatTry(Math.min(priceRangeLo, priceRangeHi))}</span>
              <span>{formatTry(Math.max(priceRangeLo, priceRangeHi))}</span>
            </div>
            <button
              type="button"
              onClick={resetPriceRange}
              className="mt-3 w-full rounded-lg border border-rose-200/80 bg-rose-50/80 py-2 text-xs font-semibold text-rose-900 transition hover:bg-rose-100/80"
            >
              Tüm fiyat aralığı
            </button>
          </>
        ) : loading ? (
          <p className="mt-3 text-xs text-stone-500">Yükleniyor…</p>
        ) : catalogLength > 0 ? (
          <p className="mt-3 text-xs text-stone-500">
            Tüm ürünler aynı fiyat bandında.
          </p>
        ) : null}
      </div>
    </div>
  )
})