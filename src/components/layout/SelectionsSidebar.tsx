/**
 * SelectionsSidebar — Oda & kategori navigasyon paneli.
 *
 * - Desktop: Sağ `<aside>` içinde her zaman görünür
 * - Mobile: Bottom sheet dialog olarak açılır
 *
 * Her ikisi de aynı `<SelectionSummaryContent>` iç bileşenini kullanır.
 * `onClose` prop'u sadece mobile sheet için gereklidir.
 */
import { Check } from 'lucide-react'
import { useConfigurator } from '../../context/ConfiguratorContext'
import { CategoryTabs } from '../CategoryTabs'

// ─── İç içerik bileşeni ──────────────────────────────────────────────────────

function SelectionSummaryContent({ onClose }: { onClose?: () => void }) {
  const {
    selectedCount,
    totalCategorySlots,
    selectionProgressPct,
    activeRoomComplete,
    mobileSummaryOpen,
  } = useConfigurator()

  // Mobile sheet'te kategori seçilince sheet'i kapat
  const handleCategoryClick = () => {
    if (onClose && mobileSummaryOpen) {
      onClose()
    }
  }
  void handleCategoryClick // CategoryTabs context-aware olduğu için doğrudan kullanılmıyor

  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-3"
      aria-label="Konfigüratör menüsü"
    >
      {/* ── İlerleme göstergesi ─────────────────────────────────────────── */}
      <div className="shrink-0 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-800/90">
            Odalar ve kategoriler
          </p>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
              Toplam seçim
            </p>
            <p
              className="text-sm font-bold tabular-nums text-stone-800"
              aria-live="polite"
            >
              <span className="text-emerald-600">{selectedCount}</span>
              <span className="text-stone-400"> / </span>
              {totalCategorySlots}
            </p>
            <p className="text-[10px] font-medium text-emerald-700/90">
              %{selectionProgressPct}
            </p>
          </div>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200/80"
          role="progressbar"
          aria-valuenow={selectionProgressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Seçim ilerlemesi"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-500 ease-out"
            style={{ width: `${Math.min(100, selectionProgressPct)}%` }}
          />
        </div>
      </div>

      {/* ── Oda tamamlandı bildirimi ─────────────────────────────────────── */}
      {activeRoomComplete && (
        <div
          className="shrink-0 flex items-start gap-2.5 rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/95 via-emerald-50/70 to-teal-50/50 px-3 py-2.5 text-emerald-950 shadow-sm transition-all duration-300 ease-out"
          role="status"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100/90 text-emerald-600 ring-1 ring-emerald-200/60">
            <Check className="size-4" strokeWidth={2.75} aria-hidden />
          </span>
          <p className="min-w-0 text-xs leading-snug">
            <span className="font-semibold text-emerald-900">
              Bu oda için seçimlerin hazır!
            </span>
            <span className="mt-0.5 block font-normal text-emerald-800/85">
              Diğer odalara geçebilir veya alttan özeti kaydedebilirsin.
            </span>
          </p>
        </div>
      )}

      {/* ── Kategori sekmeleri ───────────────────────────────────────────── */}
      <CategoryTabs />
    </div>
  )
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────

export function SelectionsSidebar() {
  return (
    <aside
      className="sticky top-14 z-30 hidden h-[calc(100dvh-3.5rem)] w-[min(21rem,30vw)] shrink-0 flex-col overflow-hidden overscroll-contain rounded-2xl border border-stone-200/80 bg-[#faf8f4]/80 py-5 pl-4 shadow-sm shadow-stone-200/20 backdrop-blur-sm lg:flex"
      aria-label="Oda ve kategori menüsü — masaüstü"
    >
      <SelectionSummaryContent />
    </aside>
  )
}

// ─── Mobile Bottom Sheet ──────────────────────────────────────────────────────

export function MobileSelectionSheet() {
  const { mobileSummaryOpen, setMobileSummaryOpen } = useConfigurator()

  if (!mobileSummaryOpen) return null

  return (
    <div
      className="fixed inset-0 z-[55] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Seçim özeti"
    >
      <button
        type="button"
        className="absolute inset-0 bg-stone-950/45 backdrop-blur-[2px]"
        onClick={() => setMobileSummaryOpen(false)}
        aria-label="Kapat"
      />
      {/* Mobile: bottom sheet | Tablet sm+: right side drawer */}
      <div
        className={[
          'absolute border border-stone-200/90 bg-gradient-to-b from-white to-stone-50 px-4 pb-6 pt-2',
          'shadow-[0_-16px_48px_rgba(0,0,0,0.14)]',
          'overflow-y-auto overscroll-contain',
          'supports-[padding:max(0px)]:pb-[max(1.25rem,env(safe-area-inset-bottom))]',
          // Mobile (xs): bottom sheet
          'inset-x-0 bottom-0 max-h-[min(82vh,36rem)] rounded-t-3xl',
          // Tablet (sm+): right drawer
          'sm:inset-x-auto sm:right-0 sm:top-14 sm:bottom-0 sm:max-h-none sm:h-[calc(100dvh-3.5rem)] sm:w-[min(22rem,85vw)] sm:rounded-l-2xl sm:rounded-tr-none ceyiz-drawer-right',
        ].join(' ')}
      >
        <div
          className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-stone-300 sm:hidden"
          aria-hidden
        />
        <SelectionSummaryContent onClose={() => setMobileSummaryOpen(false)} />
      </div>
    </div>
  )
}
