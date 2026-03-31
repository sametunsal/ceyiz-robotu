import confetti from 'canvas-confetti'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bot,
  Check,
  Home,
  ListOrdered,
  Loader2,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Undo2,
} from 'lucide-react'
import type { Product, RoomId } from './types/product'
import {
  buildInteriorNarrative,
  buildListClipboardText,
  computeStyleScore,
  ROOM_ORDER,
} from './aiInteriorReview'
import { formatTry } from './formatMoney'
import { generateCombinationCode } from './combinationCode'
import { ROOM_CATEGORY_STEPS } from './roomCategories'
import { resolveStepProducts, sortWithHarmonyFirst } from './smartWizard'
import { useBudget } from './hooks/useBudget'
import { useCatalog } from './hooks/useCatalog'
import { useSelections, isRoomFullySelected } from './hooks/useSelections'
import { BudgetPanel, ProductGrid, CategoryTabs, SummaryModal } from './components'

const SPEND_BAR_COLORS = [
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-violet-500',
] as const

const CONFIG_ROOMS: { id: RoomId; tab: string }[] = [
  { id: 'Salon', tab: 'SALON' },
  { id: 'Mutfak', tab: 'MUTFAK' },
  { id: 'Yatak Odası', tab: 'YATAK ODASI' },
  { id: 'Antre', tab: 'ANTRE' },
]

export default function App() {
  const { products, loading, error, bounds: priceBounds } = useCatalog()
  const {
    budget,
    budgetInput,
    budgetDirty,
    setBudgetInput,
    applyBudgetFromInput,
  } = useBudget()

  const [activeRoom, setActiveRoom] = useState<RoomId>('Salon')
  const [activeCategory, setActiveCategory] = useState<string>('Koltuk')
  const [brandFilter, setBrandFilter] = useState<string | null>(null)
  const [priceRangeLo, setPriceRangeLo] = useState(0)
  const [priceRangeHi, setPriceRangeHi] = useState(0)

  const {
    selections,
    selectProduct,
    reset: resetSelections,
    undo,
    canUndo,
    toggleFavorite,
    isFavorite,
    selectedCount,
    allSlotsComplete: allSlotsCompleteFlag,
    roomsWithSelections,
    hasAnySelection,
    totalCategorySlots,
  } = useSelections()

  const [summaryOpen, setSummaryOpen] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [combinationCode, setCombinationCode] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false)
  const [mobileControlOpen, setMobileControlOpen] = useState(false)
  const settingsWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const steps = ROOM_CATEGORY_STEPS[activeRoom]
    setActiveCategory((prev) =>
      steps.some((s) => s.category === prev) ? prev : steps[0].category,
    )
  }, [activeRoom])

  useEffect(() => {
    setBrandFilter(null)
  }, [activeRoom, activeCategory])

  useEffect(() => {
    if (products.length === 0) return
    setPriceRangeLo(priceBounds.min)
    setPriceRangeHi(priceBounds.max)
  }, [products.length, priceBounds.min, priceBounds.max])

  useEffect(() => {
    if (!summaryOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [summaryOpen])

  useEffect(() => {
    if (!summaryOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSummaryOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [summaryOpen])

  useEffect(() => {
    if (!summaryOpen) return
    const id = requestAnimationFrame(() => {
      void confetti({
        particleCount: 130,
        spread: 78,
        startVelocity: 36,
        decay: 0.92,
        scalar: 0.95,
        ticks: 220,
        origin: { x: 0.5, y: 0.32 },
        colors: ['#e11d48', '#f59e0b', '#8b5cf6', '#10b981', '#fef3c7', '#fda4af'],
      })
    })
    return () => cancelAnimationFrame(id)
  }, [summaryOpen])

  useEffect(() => {
    if (!settingsOpen) return
    const onDoc = (e: MouseEvent) => {
      if (
        settingsWrapRef.current &&
        !settingsWrapRef.current.contains(e.target as Node)
      ) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [settingsOpen])

  useEffect(() => {
    if (!mobileSummaryOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileSummaryOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [mobileSummaryOpen])

  useEffect(() => {
    if (!mobileControlOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileControlOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [mobileControlOpen])

  const spent = useMemo(() => {
    let sum = 0
    for (const room of ROOM_ORDER) {
      for (const p of Object.values(selections[room])) {
        if (p) sum += p.price
      }
    }
    return sum
  }, [selections])

  const remaining = budget - spent
  const safeTotal = budget > 0 ? budget : 1
  const remainingRatio = Math.min(1, Math.max(0, remaining / safeTotal))
  const overBudget = remaining < 0

  const perRoomBudgetShare = budget > 0 ? budget / ROOM_ORDER.length : 0

  const roomSpent = useCallback(
    (room: RoomId) =>
      Object.values(selections[room]).reduce(
        (a, p) => a + (p?.price ?? 0),
        0,
      ),
    [selections],
  )

  const roomOverShare = useCallback(
    (room: RoomId) =>
      perRoomBudgetShare > 0 && roomSpent(room) > perRoomBudgetShare,
    [perRoomBudgetShare, roomSpent],
  )

  const stepsForActiveRoom = ROOM_CATEGORY_STEPS[activeRoom]
  const stepMeta =
    stepsForActiveRoom.find((s) => s.category === activeCategory) ??
    stepsForActiveRoom[0]

  const catalogSlice = useMemo(
    () =>
      products.filter(
        (p) => p.room === activeRoom && p.category === activeCategory,
      ),
    [products, activeRoom, activeCategory],
  )

  const sofaForHarmony = useMemo(() => {
    for (const room of ROOM_ORDER) {
      const k = selections[room]?.['Koltuk']
      if (k) return k
    }
    return undefined
  }, [selections])

  const stepProductsRaw = useMemo(() => {
    const r = resolveStepProducts(catalogSlice, activeCategory, undefined, true)
    return r.products
  }, [catalogSlice, activeCategory])

  const harmonyStepIndex = activeCategory === 'Koltuk' ? 0 : 1

  const brandOptions = useMemo(() => {
    const uniq = new Set(stepProductsRaw.map((p: Product) => p.brand))
    return [...uniq].sort((a, b) =>
      a.localeCompare(b, 'tr', { sensitivity: 'base' }),
    )
  }, [stepProductsRaw])

  const stepProductsSorted = useMemo(
    () =>
      sortWithHarmonyFirst(stepProductsRaw, sofaForHarmony, harmonyStepIndex),
    [stepProductsRaw, sofaForHarmony, harmonyStepIndex],
  )

  const stepProductsAfterBrand = useMemo(() => {
    if (!brandFilter) return stepProductsSorted
    return stepProductsSorted.filter((p: Product) => p.brand === brandFilter)
  }, [stepProductsSorted, brandFilter])

  const stepProducts = useMemo(() => {
    if (products.length === 0) return []
    const lo = Math.min(priceRangeLo, priceRangeHi)
    const hi = Math.max(priceRangeLo, priceRangeHi)
    return stepProductsAfterBrand.filter(
      (p: Product) => p.price >= lo && p.price <= hi,
    )
  }, [stepProductsAfterBrand, priceRangeLo, priceRangeHi, products.length])

  const currentSelection = selections[activeRoom]?.[activeCategory]

  const handleSelectProduct = useCallback(
    (product: Product) => {
      selectProduct(activeRoom, activeCategory, product)
    },
    [activeRoom, activeCategory, selectProduct],
  )

  const roomLabel = CONFIG_ROOMS.find((r) => r.id === activeRoom)?.tab ?? ''
  const dynamicStepTitle = `${roomLabel} · ${stepMeta.title}`

  const selectionProgressPct = totalCategorySlots
    ? Math.round((selectedCount / totalCategorySlots) * 100)
    : 0

  const activeRoomComplete = useMemo(
    () => isRoomFullySelected(activeRoom, selections),
    [activeRoom, selections],
  )

  const completeButtonLabel = !hasAnySelection
    ? 'Seçim yap'
    : allSlotsCompleteFlag
      ? 'ÇEYİZİ KAYDET'
      : roomsWithSelections <= 1
        ? 'ODAYI TAMAMLA'
        : 'ÇEYİZİMİ TAMAMLA'

  const styleScore = useMemo(
    () => computeStyleScore(selections, overBudget),
    [selections, overBudget],
  )

  const interiorStory = useMemo(
    () => buildInteriorNarrative(selections, overBudget, styleScore),
    [selections, overBudget, styleScore],
  )

  const spendingBreakdown = useMemo(() => {
    const base = budget > 0 ? budget : 1
    let idx = 0
    const rows: {
      key: string
      label: string
      amount: number
      pct: number
      colorClass: string
    }[] = []
    for (const room of ROOM_ORDER) {
      for (const step of ROOM_CATEGORY_STEPS[room]) {
        const p = selections[room]?.[step.category]
        const amount = p?.price ?? 0
        const pct = Math.round((amount / base) * 1000) / 10
        rows.push({
          key: `${room}-${step.category}`,
          label: `${room} · ${step.title}`,
          amount,
          pct,
          colorClass: SPEND_BAR_COLORS[idx % SPEND_BAR_COLORS.length],
        })
        idx += 1
      }
    }
    return rows
  }, [selections, budget])

  const openSummary = useCallback(() => {
    setCombinationCode((prev) => prev ?? generateCombinationCode())
    setSummaryOpen(true)
    void confetti({
      particleCount: 45,
      spread: 50,
      origin: { x: 0.85, y: 0.95 },
      colors: ['#e11d48', '#fbbf24', '#c084fc'],
    })
  }, [])

  const copyList = useCallback(async () => {
    const code = combinationCode ?? generateCombinationCode()
    if (!combinationCode) setCombinationCode(code)
    const text = buildListClipboardText(selections, budget, spent, styleScore, code)
    try {
      await navigator.clipboard.writeText(text)
      setCopyFeedback(true)
      window.setTimeout(() => setCopyFeedback(false), 2200)
    } catch {
      setCopyFeedback(false)
    }
  }, [combinationCode, selections, budget, spent, styleScore])

  const restartWizard = useCallback(() => {
    resetSelections()
    setActiveRoom('Salon')
    setActiveCategory('Koltuk')
    setSummaryOpen(false)
    setCopyFeedback(false)
    setCombinationCode(null)
    setSettingsOpen(false)
    setMobileSummaryOpen(false)
    setMobileControlOpen(false)
    setPriceRangeLo(priceBounds.min)
    setPriceRangeHi(priceBounds.max)
  }, [priceBounds, resetSelections])

  const controlPanelBody = (
    <BudgetPanel
      budgetInput={budgetInput}
      budgetDirty={budgetDirty}
      priceRangeLo={priceRangeLo}
      priceRangeHi={priceRangeHi}
      priceBounds={priceBounds}
      loading={loading}
      catalogLength={products.length}
      onBudgetInputChange={setBudgetInput}
      onBudgetApply={applyBudgetFromInput}
      onPriceLoChange={setPriceRangeLo}
      onPriceHiChange={setPriceRangeHi}
      onResetPriceRange={() => {
        setPriceRangeLo(priceBounds.min)
        setPriceRangeHi(priceBounds.max)
      }}
    />
  )

  const selectionSummary = (onAfterNavigate?: () => void) => (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-3"
      aria-label="Konfigüratör menüsü"
    >
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
            style={{
              width: `${Math.min(100, selectionProgressPct)}%`,
            }}
          />
        </div>
      </div>

      {activeRoomComplete ? (
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
      ) : null}

      <CategoryTabs
        activeRoom={activeRoom}
        activeCategory={activeCategory}
        selections={selections}
        onRoomChange={setActiveRoom}
        onCategoryChange={setActiveCategory}
        isRoomFullySelected={(room) => isRoomFullySelected(room, selections)}
        roomOverShare={roomOverShare}
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf8f4] via-stone-50 to-stone-100 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] text-stone-900 lg:pb-24">
      <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b border-stone-200/90 bg-white/95 px-3 shadow-sm shadow-stone-200/30 backdrop-blur-md supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)] sm:gap-4 sm:px-5">
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

        <button
          type="button"
          onClick={() => setMobileControlOpen(true)}
          className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:bg-stone-50 lg:hidden"
          aria-label="Kontrol paneli — bütçe ve fiyat filtresi"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
        </button>

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
          <div className="relative" ref={settingsWrapRef}>
            <button
              type="button"
              onClick={() => setSettingsOpen((o) => !o)}
              className="flex h-9 w-9 touch-manipulation items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:bg-stone-50"
              aria-expanded={settingsOpen}
              aria-haspopup="true"
              title="Özet ve ayarlar"
            >
              <Settings className="size-4" aria-hidden />
              <span className="sr-only">Özet ve ayarlar</span>
            </button>
            {settingsOpen ? (
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
                {overBudget ? (
                  <p className="mt-2 text-red-600">
                    Bütçe aşıldı; tutarı artır veya seçimleri gözden geçir.
                  </p>
                ) : null}
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
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start lg:gap-6 lg:px-6 lg:py-8">
        <aside
          className="sticky top-14 z-30 hidden h-[calc(100dvh-3.5rem)] w-[min(18.5rem,22vw)] shrink-0 flex-col overflow-y-auto overscroll-contain rounded-2xl border border-stone-200/80 bg-white/50 p-5 shadow-sm shadow-stone-200/30 backdrop-blur-sm lg:flex"
          aria-label="Kontrol paneli"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-800/90">
            Kontrol paneli
          </p>
          {controlPanelBody}
        </aside>

        <main className="min-w-0 flex-1 py-0 lg:min-w-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-24 text-stone-500">
              <Loader2 className="size-6 animate-spin" aria-hidden />
              <span>Ürünler yükleniyor</span>
            </div>
          ) : error ? (
            <p className="py-12 text-center text-red-600">{error}</p>
          ) : (
            <>
              <div
                key={`${activeRoom}-${activeCategory}`}
                className="animate-fade-step"
              >
                <div className="mb-8 max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-widest text-rose-700">
                    Konfigüratör
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                    {dynamicStepTitle}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    Solda bütçe ve fiyat aralığı; ortada marka ve ürün ızgarası;
                    sağda oda ve kategoriler. Grid, oda/kategori, marka ve fiyat
                    süzgeçlerinin hepsine aynı anda uyar. Koltuk seçimlerine göre
                    uyumlu ürünler öne alınır.
                  </p>
                </div>
                {stepProductsRaw.length === 0 ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Bu oda ve kategoride ürün bulunamadı.
                  </p>
                ) : (
                  <>
                    {brandOptions.length > 0 ? (
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
                          {brandOptions.map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => setBrandFilter(b)}
                              className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 ${
                                brandFilter === b
                                  ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                                  : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                              }`}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {stepProducts.length === 0 ? (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        {stepProductsAfterBrand.length === 0 && brandFilter ? (
                          <>
                            Seçili marka için bu listede ürün yok; &quot;Hepsi&quot; ile
                            tümünü görebilirsin.
                          </>
                        ) : (
                          <>
                            Seçilen fiyat aralığında ürün yok; sol paneldeki
                            kaydırıcıyı genişlet veya &quot;Tüm fiyat aralığı&quot;na
                            dön.
                          </>
                        )}
                      </p>
                    ) : (
                      <ProductGrid
                        products={stepProducts}
                        selectedProduct={currentSelection}
                        sofaForHarmony={sofaForHarmony}
                        activeCategory={activeCategory}
                        onSelect={handleSelectProduct}
                        onToggleFavorite={toggleFavorite}
                        isFavorite={isFavorite}
                      />
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </main>

        <aside
          className="sticky top-14 z-30 hidden h-[calc(100dvh-3.5rem)] w-[min(21rem,30vw)] shrink-0 flex-col overflow-hidden overscroll-contain rounded-2xl border border-stone-200/80 bg-[#faf8f4]/80 py-5 pl-4 shadow-sm shadow-stone-200/20 backdrop-blur-sm lg:flex"
          aria-label="Oda ve kategori menüsü — masaüstü"
        >
          {selectionSummary()}
        </aside>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur-md supports-[padding:max(0px)]:pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        aria-label="Konfigüratör alt çubuğu"
      >
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-3 px-3 py-2.5 sm:px-6 lg:px-8">
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
          <div className="min-w-0 flex-1 text-center lg:flex-none lg:text-left">
            {overBudget ? (
              <p className="text-xs font-medium text-red-600 sm:text-sm">
                Toplam bütçe aşıldı; kontrol panelinden tutarı veya seçimleri
                güncelle.
              </p>
            ) : (
              <p className="text-xs text-stone-500 sm:text-sm">
                Boş kategoriler isteğe bağlı; en az bir ürün seçerek özetini
                kaydedebilirsin.
              </p>
            )}
          </div>
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

      {mobileSummaryOpen ? (
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
          <div className="ceyiz-sheet-panel absolute inset-x-0 bottom-0 max-h-[min(82vh,36rem)] overflow-y-auto overscroll-contain rounded-t-3xl border border-stone-200/90 bg-gradient-to-b from-white to-stone-50 px-4 pb-6 pt-2 shadow-[0_-16px_48px_rgba(0,0,0,0.14)] supports-[padding:max(0px)]:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div
              className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-stone-300"
              aria-hidden
            />
            {selectionSummary(() => setMobileSummaryOpen(false))}
          </div>
        </div>
      ) : null}

      {mobileControlOpen ? (
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
          <div className="ceyiz-sheet-panel absolute inset-x-0 bottom-0 max-h-[min(88vh,42rem)] overflow-y-auto overscroll-contain rounded-t-3xl border border-stone-200/90 bg-gradient-to-b from-white to-stone-50 px-4 pb-6 pt-2 shadow-[0_-16px_48px_rgba(0,0,0,0.14)] supports-[padding:max(0px)]:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div
              className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-stone-300"
              aria-hidden
            />
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-800/90">
              Kontrol paneli
            </p>
            {controlPanelBody}
            <button
              type="button"
              onClick={() => setMobileControlOpen(false)}
              className="mt-6 w-full rounded-xl border border-stone-200 bg-white py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
            >
              Kapat
            </button>
          </div>
        </div>
      ) : null}

      <SummaryModal
        isOpen={summaryOpen && hasAnySelection}
        onClose={() => setSummaryOpen(false)}
        selections={selections}
        totalBudget={budget}
        spent={spent}
        remaining={remaining}
        styleScore={styleScore}
        interiorStory={interiorStory}
        combinationCode={combinationCode}
        copyFeedback={copyFeedback}
        onCopy={copyList}
        onRestart={restartWizard}
        spendingBreakdown={spendingBreakdown}
      />
    </div>
  )
}