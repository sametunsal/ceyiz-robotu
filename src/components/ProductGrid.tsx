/**
 * ProductGrid & ProductCard — Context-aware ürün ızgarası.
 *
 * - ProductCard: React.memo ile gereksiz re-render engellenir
 * - Premium seçili durum: rose glow shadow + ring efekti
 * - Harmony badge ve favori butonu korundu
 */
import { memo } from 'react'
import { Check, Heart } from 'lucide-react'
import type { Product } from '../types/product'
import { formatTry } from '../formatMoney'
import { isHarmonyMatch } from '../smartWizard'
import { categoryIcon } from '../utils/categoryIcon'

// ─── ProductCard ─────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product
  selected: boolean
  harmony: boolean
  isFavorite: boolean
  onSelect: (product: Product) => void
  onToggleFavorite: (productId: number) => void
}

export const ProductCard = memo(function ProductCard({
  product,
  selected,
  harmony,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: ProductCardProps) {
  const Icon = categoryIcon(product.category)

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(product)}
        className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-300/40 ${
          selected
            ? 'border-rose-400/80 ring-2 ring-rose-400/60 ring-offset-2 ring-offset-[#faf8f4] shadow-[0_0_20px_rgba(225,29,72,0.18),0_4px_12px_rgba(225,29,72,0.12)]'
            : 'border-stone-200 hover:border-stone-300'
        }`}
      >
        <div className="relative aspect-[4/3] bg-stone-100">
          <img
            src={product.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            width={400}
            height={300}
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-700 shadow-sm backdrop-blur">
            <Icon className="size-3.5 text-rose-600" aria-hidden />
            {product.room} · {product.category}
          </span>
          {harmony && (
            <span className="absolute bottom-3 left-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-full bg-violet-600/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-md backdrop-blur">
              <span aria-hidden>🤖</span>
              Robotun Önerisi
              <span className="rounded bg-white/20 px-1 py-0.5 text-[9px] font-bold normal-case">
                Uyumlu
              </span>
            </span>
          )}
          {selected && (
            <span
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg ring-2 ring-white/95"
              title="Seçildi"
            >
              <Check className="size-4" strokeWidth={2.75} aria-hidden />
              <span className="sr-only">Seçildi</span>
            </span>
          )}
          {/* div+role=button: button içinde button (nested) hatasını önler */}
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite(product.id)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                onToggleFavorite(product.id)
              }
            }}
            className={`absolute right-3 top-12 flex size-8 cursor-pointer items-center justify-center rounded-full transition-all duration-200 ${
              isFavorite
                ? 'bg-rose-500 text-white shadow-lg'
                : 'bg-white/90 text-stone-400 hover:bg-white hover:text-rose-500'
            }`}
            title={isFavorite ? 'Favorilerden kaldır' : 'Favorilere ekle'}
            aria-label={isFavorite ? 'Favorilerden kaldır' : 'Favorilere ekle'}
          >
            <Heart
              className="size-4"
              fill={isFavorite ? 'currentColor' : 'none'}
              aria-hidden
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              {product.brand}
            </p>
            <h3 className="text-lg font-semibold leading-snug text-stone-900">
              {product.name}
            </h3>
          </div>
          <div className="mt-auto flex flex-wrap gap-2 text-xs text-stone-600">
            <span className="rounded-md bg-stone-100 px-2 py-1">{product.style}</span>
            <span className="rounded-md bg-stone-100 px-2 py-1">{product.color}</span>
          </div>
          <p className="text-lg font-semibold text-rose-800">{formatTry(product.price)}</p>
        </div>
      </button>
    </li>
  )
})

// ─── ProductGrid ──────────────────────────────────────────────────────────────

interface ProductGridProps {
  products: Product[]
  selectedProduct: Product | undefined | null
  sofaForHarmony: Product | undefined
  activeCategory: string
  onSelect: (product: Product) => void
  onToggleFavorite: (productId: number) => void
  isFavorite: (productId: number) => boolean
}

export const ProductGrid = memo(function ProductGrid({
  products,
  selectedProduct,
  sofaForHarmony,
  activeCategory,
  onSelect,
  onToggleFavorite,
  isFavorite,
}: ProductGridProps) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => {
        const harmony =
          activeCategory !== 'Koltuk' && sofaForHarmony
            ? isHarmonyMatch(sofaForHarmony, product.color)
            : false

        return (
          <ProductCard
            key={product.id}
            product={product}
            selected={selectedProduct?.id === product.id}
            harmony={harmony}
            isFavorite={isFavorite(product.id)}
            onSelect={onSelect}
            onToggleFavorite={onToggleFavorite}
          />
        )
      })}
    </ul>
  )
})