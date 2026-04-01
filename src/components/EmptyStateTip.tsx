/**
 * EmptyStateTip — Boş kategori/filtreleme durumlarında gösterilen zengin ipucu kartı.
 * - 'brand-filter': Seçili marka sonuç vermedi
 * - 'price-filter': Fiyat filtresi çok dar
 * - 'no-products': Bu oda/kategoride ürün yok
 * - 'first-visit': Kullanıcı henüz seçim yapmadı (marka önerileri göster)
 */
import { memo } from 'react'
import { Search, SlidersHorizontal, Tag, Compass } from 'lucide-react'
import { useConfigurator } from '../context/ConfiguratorContext'

type EmptyReason = 'brand-filter' | 'price-filter' | 'no-products' | 'first-visit'

interface EmptyStateTipProps {
  reason: EmptyReason
}

export const EmptyStateTip = memo(function EmptyStateTip({
  reason,
}: EmptyStateTipProps) {
  const {
    setBrandFilter,
    resetPriceRange,
    stepProductsRaw,
    brandFilter,
    activeCategory,
    activeRoom,
  } = useConfigurator()

  // Mevcut kategorideki benzersiz markaları al
  const topBrands = [...new Set(stepProductsRaw.map((p) => p.brand))].slice(0, 5)

  if (reason === 'no-products') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-stone-200 bg-stone-50 px-6 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
          <Search className="size-7" />
        </span>
        <div>
          <p className="font-semibold text-stone-700">
            Bu oda ve kategoride ürün bulunamadı
          </p>
          <p className="mt-1 text-sm text-stone-500">
            {activeRoom} · {activeCategory} için henüz katalogda ürün yok.
          </p>
        </div>
      </div>
    )
  }

  if (reason === 'brand-filter') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50/60 px-6 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <Tag className="size-7" />
        </span>
        <div>
          <p className="font-semibold text-amber-900">
            &quot;{brandFilter}&quot; markasında bu kategoride ürün yok
          </p>
          <p className="mt-1 text-sm text-amber-800/80">
            Diğer markaları görmek için &quot;Hepsi&quot;ni seçebilirsin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBrandFilter(null)}
          className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          Tüm markaları göster
        </button>
      </div>
    )
  }

  if (reason === 'price-filter') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-violet-200 bg-violet-50/50 px-6 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
          <SlidersHorizontal className="size-7" />
        </span>
        <div>
          <p className="font-semibold text-violet-900">
            Bu fiyat aralığında ürün bulunamadı
          </p>
          <p className="mt-1 text-sm text-violet-800/80">
            Sol paneldeki kaydırıcıyı genişleterek daha fazla ürün görebilirsin.
          </p>
        </div>
        <button
          type="button"
          onClick={resetPriceRange}
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
        >
          Tüm fiyat aralığına dön
        </button>
      </div>
    )
  }

  // first-visit: marka önerileri
  return (
    <div className="flex flex-col items-start gap-5 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/60 via-white to-stone-50 px-6 py-8">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
          <Compass className="size-5" />
        </span>
        <div>
          <p className="font-semibold text-stone-800">
            Henüz bir seçim yapmadın
          </p>
          <p className="text-sm text-stone-500">
            {activeRoom} · {activeCategory} — {stepProductsRaw.length} ürün
            seni bekliyor
          </p>
        </div>
      </div>

      {topBrands.length > 0 && (
        <div className="w-full">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-stone-500">
            Bu kategorinin popüler markaları
          </p>
          <div className="flex flex-wrap gap-2">
            {topBrands.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => setBrandFilter(brand)}
                className="rounded-full border border-rose-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-800 shadow-sm transition hover:border-rose-300 hover:bg-rose-50"
              >
                {brand}
              </button>
            ))}
            {topBrands.length > 0 && (
              <button
                type="button"
                onClick={() => setBrandFilter(null)}
                className="rounded-full border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-xs font-semibold text-stone-600 shadow-sm transition hover:bg-stone-100"
              >
                Hepsini gör →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
})
