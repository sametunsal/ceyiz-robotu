/**
 * AppHeader — Yapışkan üst navigasyon çubuğu.
 *
 * Bütçe göstergesi, geri al butonu ve ayarlar dropdown'ını içerir.
 * settingsWrapRef context'ten alınarak dropdown outside-click tespiti sağlanır.
 */
import {
  Bot,
  Home,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Undo2,
} from 'lucide-react'
import { useConfigurator } from '../../context/ConfiguratorContext'
import { formatTry } from '../../formatMoney'

export function AppHeader() {
  const {
    remaining,
    overBudget,
    remainingRatio,
    spent,
    canUndo,
    undo,
    settingsOpen,
    setSettingsOpen,
    setMobileControlOpen,
    settingsWrapRef,
    restartWizard,
  } = useConfigurator()

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b border-stone-200/90 bg-white/95 px-3 shadow-sm shadow-stone-200/30 backdrop-blur-md supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)] sm:gap-4 sm:px-5">
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-rose-800 text-white shadow-md shadow-rose-900/25 ring-2 ring-rose-200/60"
          aria-hidden
        >
          <span className="relative flex size-6 items-center justify-center">
            <Home className="size-[1.05rem]" strokeWidth={2.25} />
            <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-white text-rose-600 shadow-sm ring-1 ring-rose-100">
              <Bot className="size-2.5" strokeWidth={3} />
            </span>
          </span>
        </div>
        <span className="hidden max-w-[8rem] truncate font-semibold text-stone-900 sm:inline">
          Çeyiz Robotu
        </span>
      </div>

      {/* ── Mobil filtre butonu ───────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setMobileControlOpen(true)}
        className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:bg-stone-50 lg:hidden"
        aria-label="Kontrol paneli — bütçe ve fiyat filtresi"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
      </button>

      {/* ── Kalan bütçe göstergesi ────────────────────────────────────────── */}
      <div className="mx-auto flex min-w-0 max-w-[min(15rem,40vw)] flex-1 flex-col items-center justify-center px-1 sm:max-w-[min(15rem,46vw)]">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-stone-500">
          Kalan bütçe
        </p>
        <p
          className={`text-sm font-bold tabular-nums leading-tight sm:text-base ${
            overBudget ? 'text-red-600' : 'text-emerald-700'
          }`}
        >
          {formatTry(remaining)}
        </p>
        <div
          className="mt-0.5 h-1 w-full rounded-full bg-stone-200"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(remainingRatio * 100)}
          aria-label="Kalan bütçe oranı"
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              overBudget
                ? 'bg-red-500'
                : remainingRatio < 0.2
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${overBudget ? 100 : remainingRatio * 100}%` }}
          />
        </div>
      </div>

      {/* ── Sağ eylemler ─────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-2">
        {canUndo && (
          <button
            type="button"
            onClick={undo}
            className="flex h-9 w-9 touch-manipulation items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:bg-stone-50"
            title="Geri al"
            aria-label="Son seçimi geri al"
          >
            <Undo2 className="size-4" aria-hidden />
          </button>
        )}

        {/* Settings dropdown */}
        <div className="relative" ref={settingsWrapRef}>
          <button
            type="button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex h-9 w-9 touch-manipulation items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:bg-stone-50"
            aria-expanded={settingsOpen}
            aria-haspopup="true"
            title="Özet ve ayarlar"
          >
            <Settings className="size-4" aria-hidden />
            <span className="sr-only">Özet ve ayarlar</span>
          </button>

          {settingsOpen && (
            <div className="absolute right-0 top-11 z-[60] w-[min(calc(100vw-1.5rem),17rem)] rounded-xl border border-stone-200 bg-white p-3 text-xs shadow-xl shadow-stone-900/10 sm:w-64">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                Özet
              </p>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Bütçe ve fiyat aralığı için masaüstünde sol{' '}
                <span className="font-medium text-stone-800">Kontrol paneli</span>
                ni, mobilde{' '}
                <span className="font-medium text-stone-800">Filtreler</span>{' '}
                ikonunu kullan.
              </p>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                Harcanan
              </p>
              <p className="mt-0.5 font-semibold tabular-nums text-stone-900">
                {formatTry(spent)}
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                Kalan
              </p>
              <p
                className={`mt-0.5 font-semibold tabular-nums ${
                  overBudget ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {formatTry(remaining)}
              </p>
              {overBudget && (
                <p className="mt-2 text-red-600">
                  Bütçe aşıldı; tutarı artır veya seçimleri gözden geçir.
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  restartWizard()
                  setSettingsOpen(false)
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-stone-50 py-2.5 font-semibold text-stone-800 transition hover:bg-stone-100"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Sıfırla
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
