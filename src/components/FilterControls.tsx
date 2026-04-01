/**
 * FilterControls — Marka filtresi çip bileşeni.
 * Context'ten brandFilter ve brandOptions okur; prop drilling yok.
 */
import { memo } from 'react'
import { useConfigurator } from '../context/ConfiguratorContext'

export const FilterControls = memo(function FilterControls() {
  const { brandOptions, brandFilter, setBrandFilter } = useConfigurator()

  if (brandOptions.length === 0) return null

  return (
    <div className="mb-5">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
        Marka
      </p>
      <div
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="toolbar"
        aria-label="Marka filtresi"
      >
        <button
          type="button"
          onClick={() => setBrandFilter(null)}
          className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 ${
            brandFilter === null
              ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
              : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
          }`}
        >
          Hepsi
        </button>
        {brandOptions.map((brand) => (
          <button
            key={brand}
            type="button"
            onClick={() => setBrandFilter(brand)}
            className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 ${
              brandFilter === brand
                ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
            }`}
          >
            {brand}
          </button>
        ))}
      </div>
    </div>
  )
})
