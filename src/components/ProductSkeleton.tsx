/**
 * ProductSkeleton — Ürün listesi yüklenirken gösterilen shimmer kartları.
 * ProductCard ile aynı aspect ratio ve layout yapısını taklit eder.
 */

interface ProductSkeletonProps {
  count?: number
}

function SkeletonCard() {
  return (
    <li className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      {/* Görsel alanı */}
      <div className="skeleton-shimmer aspect-[4/3] w-full" />
      {/* İçerik alanı */}
      <div className="flex flex-col gap-3 p-4">
        {/* Marka */}
        <div className="skeleton-shimmer h-3 w-1/3 rounded-full" />
        {/* Ürün adı */}
        <div className="skeleton-shimmer h-5 w-4/5 rounded-full" />
        <div className="skeleton-shimmer h-5 w-3/5 rounded-full" />
        {/* Etiketler */}
        <div className="flex gap-2">
          <div className="skeleton-shimmer h-6 w-16 rounded-md" />
          <div className="skeleton-shimmer h-6 w-16 rounded-md" />
        </div>
        {/* Fiyat */}
        <div className="skeleton-shimmer mt-1 h-6 w-2/5 rounded-full" />
      </div>
    </li>
  )
}

export function ProductSkeleton({ count = 6 }: ProductSkeletonProps) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </ul>
  )
}
