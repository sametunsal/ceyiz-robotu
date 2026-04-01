/**
 * App — Uygulamanın ince orkestratörü.
 *
 * Tüm state, hook kompozisyonu ve hesaplanan değerler ConfiguratorContext'te yaşar.
 * Bu bileşen sadece Provider + layout bileşenlerini bir araya getirir.
 *
 * Önceki app.tsx: 841 satır / 10 useEffect / inline render fonksiyonları
 * Bu dosya:       ~80 satır / 0 yerel state / saf kompozisyon
 */
import { useCallback } from 'react'
import { ConfiguratorProvider, useConfigurator } from './context/ConfiguratorContext'
import {
  AppHeader,
  SelectionsSidebar,
  MobileSelectionSheet,
  BottomBar,
} from './components/layout'
import {
  BudgetPanel,
  FilterControls,
  ProductGrid,
  ProductSkeleton,
  SummaryModal,
} from './components'
import { EmptyStateTip } from './components/EmptyStateTip'
import { PrintView } from './components/PrintView'

// ─── İçerik alanı (context'e erişim gerektiren) ──────────────────────────────

function ConfiguratorContent() {
  const {
    loading,
    error,
    stepProductsRaw,
    stepProducts,
    stepProductsAfterBrand,
    brandFilter,
    currentSelection,
    sofaForHarmony,
    activeCategory,
    dynamicStepTitle,
    stepMeta,
    handleSelectProduct,
    toggleFavorite,
    isFavorite,
  } = useConfigurator()

  // useCallback: ProductGrid'e geçen handler'lar re-render'da stable kalır
  const stableOnSelect = useCallback(handleSelectProduct, [handleSelectProduct])
  const stableOnFavorite = useCallback(toggleFavorite, [toggleFavorite])
  const stableIsFav = useCallback(isFavorite, [isFavorite])

  return (
    <main className="min-w-0 flex-1 py-0 lg:min-w-0">
      {loading ? (
        // Ürünler yüklenirken skeleton screen göster
        <div className="space-y-8">
          <div className="max-w-3xl">
            <div className="skeleton-shimmer mb-3 h-3 w-24 rounded-full" />
            <div className="skeleton-shimmer mb-2 h-8 w-64 rounded-xl" />
            <div className="skeleton-shimmer h-4 w-96 max-w-full rounded-full" />
          </div>
          <ProductSkeleton count={6} />
        </div>
      ) : error ? (
        <p className="py-12 text-center text-red-600">{error}</p>
      ) : (
        <div
          key={`${activeCategory}`}
          className="animate-fade-step"
        >
          {/* ── Başlık ─────────────────────────────────────────────────── */}
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-700">
              Konfigüratör
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
              {dynamicStepTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              {stepMeta.title} · Solda bütçe ve fiyat aralığı; sağda oda ve
              kategoriler. Koltuk seçimlerine göre uyumlu ürünler öne alınır.
            </p>
          </div>

          {/* ── Ürün yoksa uyarı ────────────────────────────────────────── */}
          {stepProductsRaw.length === 0 ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Bu oda ve kategoride ürün bulunamadı.
            </p>
          ) : (
            <>
              {/* Marka filtresi */}
              <FilterControls />

              {/* Filtre sonucu boşsa mesaj */}
              {stepProducts.length === 0 ? (
                <EmptyStateTip
                  reason={
                    brandFilter !== null && stepProductsAfterBrand.length === 0
                      ? 'brand-filter'
                      : 'price-filter'
                  }
                />
              ) : (
                <ProductGrid
                  products={stepProducts}
                  selectedProduct={currentSelection}
                  sofaForHarmony={sofaForHarmony}
                  activeCategory={activeCategory}
                  onSelect={stableOnSelect}
                  onToggleFavorite={stableOnFavorite}
                  isFavorite={stableIsFav}
                />
              )}
            </>
          )}
        </div>
      )}
    </main>
  )
}

// ─── Ana sayfa layout'u ───────────────────────────────────────────────────────

// ─── Share Onay Dialog'u ──────────────────────────────────────────────────────

function ShareDialog() {
  const { shareDialogVisible, pendingShareCount, loadSharedDesign, dismissShareDialog } =
    useConfigurator()

  if (!shareDialogVisible) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl shadow-stone-900/20">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
          <span className="text-2xl" aria-hidden>🔗</span>
        </div>
        <h2 id="share-dialog-title" className="text-lg font-semibold text-stone-900">
          Paylaşım Tasarımı Bulundu
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Bu link{' '}
          <span className="font-semibold text-rose-700">{pendingShareCount} ürün</span>{' '}
          seçimini içeriyor. Yüklensin mi? Mevcut seçimleriniz değiştirilecek
          (Geri Al ile kurtarabilirsiniz).
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={dismissShareDialog}
            className="flex-1 rounded-xl border border-stone-200 bg-white py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={loadSharedDesign}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Yükle ve Başla
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Ana sayfa layout'u ───────────────────────────────────────────────────────

function ConfiguratorLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf8f4] via-stone-50 to-stone-100 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] text-stone-900 lg:pb-24">
      <AppHeader />

      <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start lg:gap-6 lg:px-6 lg:py-8">
        {/* Sol panel — bütçe & fiyat filtresi (sadece masaüstü) */}
        <aside
          className="sticky top-14 z-30 hidden h-[calc(100dvh-3.5rem)] w-[min(18.5rem,22vw)] shrink-0 flex-col overflow-y-auto overscroll-contain rounded-2xl border border-stone-200/80 bg-white/50 p-5 shadow-sm shadow-stone-200/30 backdrop-blur-sm lg:flex"
          aria-label="Kontrol paneli"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-800/90">
            Kontrol paneli
          </p>
          <div className="mt-4">
            <BudgetPanel />
          </div>
        </aside>

        {/* Ana içerik */}
        <ConfiguratorContent />

        {/* Sağ panel — oda & kategori seçimleri (sadece masaüstü) */}
        <SelectionsSidebar />
      </div>

      {/* Alt navigasyon + mobil sheet'ler */}
      <BottomBar />
      <MobileSelectionSheet />
      <SummaryModal />
      {/* Print view — ekranda gizli, @media print'te görünür */}
      <PrintView />
      {/* Share confirmation dialog */}
      <ShareDialog />
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ConfiguratorProvider>
      <ConfiguratorLayout />
    </ConfiguratorProvider>
  )
}