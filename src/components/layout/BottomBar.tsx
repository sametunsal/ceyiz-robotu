/**
 * BottomBar — Sabit alt navigasyon + mobil kontrol paneli sheet'i.
 *
 * - Mobil menü butonu (seçim özeti sheet)
 * - Merkez mesaj (bütçe durumu)
 * - "Çeyizi Tamamla" ana eylem butonu
 * - Mobil kontrol sheet (BudgetPanel)
 */
import { ListOrdered, Sparkles } from 'lucide-react'
import { useConfigurator } from '../../context/ConfiguratorContext'
import { BudgetPanel } from '../BudgetPanel'

// ─── Mobil Kontrol Sheet ──────────────────────────────────────────────────────

function MobileControlSheet() {
  const { mobileControlOpen, setMobileControlOpen } = useConfigurator()

  if (!mobileControlOpen) return null

  return (
    <div
      className="fixed inset-0 z-[55] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Kontrol paneli"
    >
      <button
        type="button"
        className="absolute inset-0 bg-stone-950/45 backdrop-blur-[2px]"
        onClick={() => setMobileControlOpen(false)}
        aria-label="Kapat"
      />
      {/* Mobile: bottom sheet | Tablet sm+: left drawer */}
      <div
        className={[
          'absolute border border-stone-200/90 bg-gradient-to-b from-white to-stone-50 px-4 pb-6 pt-2',
          'shadow-[0_-16px_48px_rgba(0,0,0,0.14)]',
          'overflow-y-auto overscroll-contain',
          'supports-[padding:max(0px)]:pb-[max(1.25rem,env(safe-area-inset-bottom))]',
          // Mobile (xs): bottom sheet
          'inset-x-0 bottom-0 max-h-[min(88vh,42rem)] rounded-t-3xl',
          // Tablet (sm+): left drawer
          'sm:inset-x-auto sm:left-0 sm:top-14 sm:bottom-0 sm:max-h-none sm:h-[calc(100dvh-3.5rem)] sm:w-[min(20rem,85vw)] sm:rounded-r-2xl sm:rounded-tl-none ceyiz-drawer-left',
        ].join(' ')}
      >
        <div
          className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-stone-300 sm:hidden"
          aria-hidden
        />
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-800/90">
          Kontrol paneli
        </p>
        <BudgetPanel />
        <button
          type="button"
          onClick={() => setMobileControlOpen(false)}
          className="mt-6 w-full rounded-xl border border-stone-200 bg-white py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
        >
          Kapat
        </button>
      </div>
    </div>
  )
}

// ─── BottomBar ────────────────────────────────────────────────────────────────

export function BottomBar() {
  const {
    setMobileSummaryOpen,
    overBudget,
    hasAnySelection,
    completeButtonLabel,
    openSummary,
  } = useConfigurator()

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur-md supports-[padding:max(0px)]:pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        aria-label="Konfigüratör alt çubuğu"
      >
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-3 px-3 py-2.5 sm:px-6 lg:px-8">
          {/* Mobil menü butonu */}
          <button
            type="button"
            onClick={() => setMobileSummaryOpen(true)}
            className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 lg:hidden"
            aria-label="Odalar ve kategoriler"
          >
            <ListOrdered className="size-4 shrink-0" aria-hidden />
            Menü
          </button>

          <div className="hidden min-w-0 flex-1 lg:block" aria-hidden />

          {/* Durum mesajı */}
          <div className="min-w-0 flex-1 text-center lg:flex-none lg:text-left">
            {overBudget ? (
              <p className="text-xs font-medium text-red-600 sm:text-sm">
                Toplam bütçe aşıldı; kontrol panelinden tutarı veya seçimleri güncelle.
              </p>
            ) : (
              <p className="text-xs text-stone-500 sm:text-sm">
                Boş kategoriler isteğe bağlı; en az bir ürün seçerek özetini kaydedebilirsin.
              </p>
            )}
          </div>

          {/* Ana eylem butonu */}
          <button
            type="button"
            onClick={openSummary}
            disabled={!hasAnySelection}
            className="inline-flex min-h-11 max-w-[min(100%,14rem)] shrink-0 touch-manipulation items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-rose-900/20 transition hover:from-rose-700 hover:to-rose-800 disabled:cursor-not-allowed disabled:opacity-45 sm:max-w-none sm:px-5 sm:text-sm"
          >
            <Sparkles className="size-4 shrink-0" aria-hidden />
            <span
              className={`truncate ${!hasAnySelection ? 'normal-case tracking-normal' : ''}`}
            >
              {completeButtonLabel}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobil kontrol sheet */}
      <MobileControlSheet />
    </>
  )
}
