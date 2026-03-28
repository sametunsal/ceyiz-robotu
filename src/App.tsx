import confetti from 'canvas-confetti'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Armchair,
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Copy,
  Home,
  Lamp,
  LayoutGrid,
  Loader2,
  RectangleHorizontal,
  RotateCcw,
  Sparkles,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react'
import productsUrl from '../products.json?url'
import type { Product } from './types/product'
import {
  buildInteriorNarrative,
  buildListClipboardText,
  computeStyleScore,
} from './aiInteriorReview'
import { generateCombinationCode } from './combinationCode'
import {
  displayColorName,
  isHarmonyMatch,
  minPriceInCategory,
  resolveStepProducts,
  sortWithHarmonyFirst,
  type StyleListFallback,
} from './smartWizard'

const SPEND_BAR_COLORS = [
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-violet-500',
] as const

const WIZARD_STEPS = [
  { category: 'Koltuk', title: 'Koltuk Takımı' },
  { category: 'Halı', title: 'Halı' },
  { category: 'Yemek Masası', title: 'Yemek Masası' },
  { category: 'Aydınlatma', title: 'Aydınlatma' },
] as const

type WizardCategory = (typeof WIZARD_STEPS)[number]['category']

type Selections = Partial<Record<WizardCategory, Product>>

const categoryIcon = (category: string) => {
  switch (category) {
    case 'Koltuk':
      return Armchair
    case 'Halı':
      return RectangleHorizontal
    case 'Yemek Masası':
      return UtensilsCrossed
    case 'Aydınlatma':
      return Lamp
    default:
      return LayoutGrid
  }
}

function formatTry(n: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n)
}

function parseBudgetInput(raw: string): number {
  const cleaned = raw.replace(/\./g, '').replace(/\s/g, '').replace(',', '.')
  const n = Number(cleaned)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
}

function fallbackNotice(
  lockedStyle: Product['style'] | undefined,
  kind: StyleListFallback,
): string | null {
  if (kind === 'none' || !lockedStyle) return null
  if (kind === 'neutral-alternate') {
    const alt = lockedStyle === 'Klasik' ? 'Modern' : 'Klasik'
    return `${lockedStyle} stilinde ürün bulamadık; senin için nötr renkli (Beyaz, Bej, Gri, Krem) ${alt} ve evrensel çizgide uyumlu parçaları listeledik.`
  }
  return 'Stil filtresi bu adımda sonuç vermedi; kategorideki tüm ürünleri gösteriyoruz — yine de paletine uygun bir seçim yapabilirsin.'
}

export default function App() {
  const [catalog, setCatalog] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [budgetInput, setBudgetInput] = useState('100000')
  const [totalBudget, setTotalBudget] = useState(100_000)
  const [budgetDirty, setBudgetDirty] = useState(false)

  const [currentStep, setCurrentStep] = useState(0)
  const [selections, setSelections] = useState<Selections>({})
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [combinationCode, setCombinationCode] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(productsUrl)
      .then((r) => {
        if (!r.ok) throw new Error('Ürün listesi alınamadı')
        return r.json() as Promise<Product[]>
      })
      .then((data) => {
        if (!cancelled) setCatalog(data)
      })
      .catch(() => {
        if (!cancelled) setError('Veri yüklenirken bir hata oluştu.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const applyBudgetFromInput = useCallback(() => {
    const next = parseBudgetInput(budgetInput)
    if (next > 0) setTotalBudget(next)
    setBudgetDirty(false)
  }, [budgetInput])

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

  const spent = useMemo(() => {
    return Object.values(selections).reduce((sum, p) => sum + (p?.price ?? 0), 0)
  }, [selections])

  const remaining = totalBudget - spent
  const safeTotal = totalBudget > 0 ? totalBudget : 1
  const remainingRatio = Math.min(1, Math.max(0, remaining / safeTotal))
  const overBudget = remaining < 0

  const stepMeta = WIZARD_STEPS[currentStep]
  const stepCategory = stepMeta.category

  const sofa = selections.Koltuk
  const lockedStyle = sofa?.style

  const { stepProductsRaw, styleListFallback } = useMemo(() => {
    const r = resolveStepProducts(
      catalog,
      stepCategory,
      lockedStyle,
      currentStep === 0,
    )
    return { stepProductsRaw: r.products, styleListFallback: r.fallback }
  }, [catalog, stepCategory, lockedStyle, currentStep])

  const stepProducts = useMemo(
    () => sortWithHarmonyFirst(stepProductsRaw, sofa, currentStep),
    [stepProductsRaw, sofa, currentStep],
  )

  const fallbackMessage = fallbackNotice(lockedStyle, styleListFallback)

  const currentSelection = selections[stepCategory]

  const nextCategory =
    currentStep < WIZARD_STEPS.length - 1
      ? WIZARD_STEPS[currentStep + 1].category
      : null

  const nextCategoryMinPrice = useMemo(() => {
    if (!nextCategory) return null
    return minPriceInCategory(catalog, nextCategory, lockedStyle)
  }, [catalog, nextCategory, lockedStyle])

  const budgetBlocksNext =
    Boolean(currentSelection) &&
    nextCategoryMinPrice !== null &&
    remaining < nextCategoryMinPrice

  const canGoPrev = currentStep > 0
  const canGoNext =
    Boolean(currentSelection) &&
    currentStep < WIZARD_STEPS.length - 1 &&
    !budgetBlocksNext

  const canJumpToStep = (index: number) => {
    if (index === currentStep) return true
    if (index < currentStep) return true
    for (let i = 0; i < index; i++) {
      const cat = WIZARD_STEPS[i].category
      if (!selections[cat]) return false
    }
    return true
  }

  const selectProduct = (product: Product) => {
    setSelections((prev) => {
      if (stepCategory === 'Koltuk') {
        return { Koltuk: product }
      }
      return { ...prev, [stepCategory]: product }
    })
  }

  const dynamicStepTitle = useMemo(() => {
    if (currentStep === 0) return stepMeta.title
    if (!sofa) return stepMeta.title
    const color = displayColorName(sofa.color)
    return `${color} ${sofa.style} koltuğuna uygun ${stepMeta.title} seçimi`
  }, [currentStep, sofa, stepMeta.title])

  const goPrev = () => {
    if (canGoPrev) setCurrentStep((s) => s - 1)
  }

  const goNext = () => {
    if (canGoNext) setCurrentStep((s) => s + 1)
  }

  const allStepsComplete = WIZARD_STEPS.every((s) => Boolean(selections[s.category]))

  const styleScore = useMemo(
    () => computeStyleScore(selections, overBudget),
    [selections, overBudget],
  )

  const interiorStory = useMemo(
    () => buildInteriorNarrative(selections, overBudget, styleScore),
    [selections, overBudget, styleScore],
  )

  const spendingBreakdown = useMemo(() => {
    const base = totalBudget > 0 ? totalBudget : 1
    return WIZARD_STEPS.map((step, i) => {
      const p = selections[step.category]
      const amount = p?.price ?? 0
      const pct = Math.round((amount / base) * 1000) / 10
      return {
        key: step.category,
        label: step.title,
        amount,
        pct,
        colorClass: SPEND_BAR_COLORS[i % SPEND_BAR_COLORS.length],
      }
    })
  }, [selections, totalBudget])

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

  const copyList = async () => {
    const code = combinationCode ?? generateCombinationCode()
    if (!combinationCode) setCombinationCode(code)
    const text = buildListClipboardText(
      selections,
      totalBudget,
      spent,
      styleScore,
      code,
    )
    try {
      await navigator.clipboard.writeText(text)
      setCopyFeedback(true)
      window.setTimeout(() => setCopyFeedback(false), 2200)
    } catch {
      setCopyFeedback(false)
    }
  }

  const restartWizard = () => {
    setSelections({})
    setCurrentStep(0)
    setSummaryOpen(false)
    setCopyFeedback(false)
    setCombinationCode(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf8f4] via-stone-50 to-stone-100 pb-40 text-stone-900 lg:pb-28">
      <div className="sticky top-0 z-40 border-b border-stone-200/90 bg-white/95 shadow-md shadow-stone-200/40 backdrop-blur-md supports-[padding:max(0px)]:pt-[max(0.35rem,env(safe-area-inset-top))]">
        <div className="mx-auto max-w-6xl space-y-4 px-4 pb-4 pt-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 border-b border-stone-200/70 pb-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-rose-800 text-white shadow-lg shadow-rose-900/30 ring-2 ring-rose-200/70"
              aria-hidden
            >
              <span className="relative flex size-8 items-center justify-center">
                <Home className="size-[1.35rem]" strokeWidth={2.25} />
                <span className="absolute -bottom-0.5 -right-0.5 flex size-[1.05rem] items-center justify-center rounded-full bg-white text-rose-600 shadow-sm ring-1 ring-rose-100">
                  <Bot className="size-[0.65rem]" strokeWidth={3} />
                </span>
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold tracking-tight text-stone-900 sm:text-xl">
                Çeyiz Robotu
              </p>
              <p className="truncate text-[11px] text-stone-500 sm:text-xs">
                AI destekli ev dizme asistanı
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,20rem)] lg:items-start">
            <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 sm:size-10">
                <Wallet className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                  Bütçe
                </p>
                <p className="text-sm text-stone-600">
                  Toplam bütçeni gir; seçtikçe kalan tutar güncellenir.
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[280px]">
              <label className="sr-only" htmlFor="budget-input">
                Toplam bütçe (TL)
              </label>
              <div className="flex gap-2">
                <input
                  id="budget-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Örn: 100000"
                  value={budgetInput}
                  onChange={(e) => {
                    setBudgetInput(e.target.value)
                    setBudgetDirty(true)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applyBudgetFromInput()
                  }}
                  className="min-h-11 min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-base outline-none ring-rose-500/30 focus:border-rose-400 focus:ring-2 sm:min-h-10 sm:py-2 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={applyBudgetFromInput}
                  className="min-h-11 min-w-[5.5rem] shrink-0 touch-manipulation rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white active:bg-stone-950 sm:min-h-10 sm:min-w-0 sm:px-3 sm:py-2"
                >
                  Uygula
                </button>
              </div>
              {budgetDirty ? (
                <p className="text-xs text-amber-700">Kaydetmek için Uygula’ya bas.</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2">
              <p className="text-xs text-stone-500">Toplam bütçe</p>
              <p className="text-lg font-semibold tabular-nums text-stone-900">
                {formatTry(totalBudget)}
              </p>
            </div>
            <div className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2">
              <p className="text-xs text-stone-500">Harcanan</p>
              <p className="text-lg font-semibold tabular-nums text-stone-900">
                {formatTry(spent)}
              </p>
            </div>
            <div
              className={`rounded-xl border px-3 py-2 ${
                overBudget
                  ? 'border-red-200 bg-red-50'
                  : 'border-stone-100 bg-stone-50'
              }`}
            >
              <p className="text-xs text-stone-500">Kalan</p>
              <p
                className={`text-lg font-semibold tabular-nums ${
                  overBudget ? 'text-red-700' : 'text-emerald-700'
                }`}
              >
                {formatTry(remaining)}
              </p>
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs text-stone-500">
              <span>Kalan bütçe doluluğu</span>
              <span className="tabular-nums">{Math.round(remainingRatio * 100)}%</span>
            </div>
            <div
              className="h-4 w-full min-h-[14px] overflow-hidden rounded-full bg-stone-200 sm:h-3"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(remainingRatio * 100)}
              aria-label="Kalan bütçe oranı"
            >
              <div
                className={`h-full min-h-[14px] rounded-full transition-all duration-300 sm:min-h-0 ${
                  overBudget
                    ? 'bg-red-500'
                    : remainingRatio < 0.2
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${overBudget ? 100 : remainingRatio * 100}%` }}
              />
            </div>
            {overBudget ? (
              <p className="mt-1 text-xs text-red-600">
                Seçimlerin bütçeyi aşıyor; bütçeyi artır veya ürünleri gözden geçir.
              </p>
            ) : null}
          </div>
            </div>

            <aside
              className="hidden rounded-2xl border border-stone-200/80 bg-gradient-to-br from-amber-50/90 via-white to-stone-50 p-4 shadow-sm ring-1 ring-stone-100 lg:block"
              aria-label="Oda önizlemesi"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-800/80">
                Odanız oluşuyor
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Seçtikçe parçalar burada bir araya gelir.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {WIZARD_STEPS.map((step) => {
                  const p = selections[step.category]
                  const StepIcon = categoryIcon(step.category)
                  return (
                    <div
                      key={step.category}
                      className="flex min-w-[calc(50%-0.25rem)] flex-1 flex-col gap-1.5 rounded-xl border border-stone-200/70 bg-white/90 px-2.5 py-2 text-center shadow-sm sm:min-w-[5.5rem]"
                    >
                      <StepIcon
                        className={`mx-auto size-5 ${p ? 'text-rose-600' : 'text-stone-300'}`}
                        aria-hidden
                      />
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                        {step.title}
                      </span>
                      {p ? (
                        <span className="line-clamp-2 text-left text-[11px] font-medium leading-snug text-stone-800">
                          {p.name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-400">Bekliyor</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </aside>
          </div>
        </div>
      </div>

      <header className="border-b border-stone-200/70 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-widest text-rose-700">
            Adım adım çeyiz
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Seçim sihirbazı
          </h1>
          <ol className="mt-4 flex flex-wrap gap-2">
            {WIZARD_STEPS.map((step, i) => {
              const done = Boolean(selections[step.category])
              const active = i === currentStep
              return (
                <li key={step.category}>
                  <button
                    type="button"
                    disabled={!canJumpToStep(i)}
                    onClick={() => canJumpToStep(i) && setCurrentStep(i)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      active
                        ? 'border-rose-500 bg-rose-50 text-rose-900'
                        : done
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <span className="flex size-6 items-center justify-center rounded-full bg-white text-xs font-bold text-stone-700 shadow-sm">
                      {done ? <Check className="size-3.5 text-emerald-600" /> : i + 1}
                    </span>
                    {step.title}
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-stone-500">
            <Loader2 className="size-6 animate-spin" aria-hidden />
            <span>Ürünler yükleniyor</span>
          </div>
        ) : error ? (
          <p className="py-12 text-center text-red-600">{error}</p>
        ) : (
          <>
            <div key={currentStep} className="animate-fade-step">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-stone-900">
                Adım {currentStep + 1} / {WIZARD_STEPS.length}: {dynamicStepTitle}
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                {currentStep > 0 && lockedStyle ? (
                  lockedStyle === 'Nötr' || lockedStyle === 'Zamansız' ? (
                    <>
                      Nötr / zamansız koltuk seçtin; bu kategorideki tüm çizgileri
                      görebilirsin. Uyumlu renkler yine öne alınır.
                    </>
                  ) : styleListFallback === 'none' ? (
                    <>
                      Koltuk seçimine göre{' '}
                      <span className="font-medium text-stone-800">
                        {lockedStyle}
                      </span>
                      , Nötr ve Zamansız ürünler öncelikli. Uyumlu renkler öne
                      alındı.
                    </>
                  ) : (
                    <>
                      Dar stil filtresi sonuç vermedi; aşağıdaki bilgiyle
                      genişletilmiş listeyi inceliyorsun.
                    </>
                  )
                ) : (
                  <>
                    Bu adımda bir ürün seç; stilin (veya nötr çizgin) çeyiz için
                    referans olur.
                  </>
                )}
              </p>
            </div>
            {fallbackMessage ? (
              <div
                className="mb-4 rounded-xl border border-sky-200 bg-sky-50/95 px-4 py-3 text-sm leading-relaxed text-sky-950 shadow-sm"
                role="status"
              >
                {fallbackMessage}
              </div>
            ) : null}
            {stepProducts.length === 0 ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Bu kategoride ürün bulunamadı. Veri veya filtreleri kontrol et.
              </p>
            ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stepProducts.map((p) => {
                const Icon = categoryIcon(p.category)
                const selected = currentSelection?.id === p.id
                const harmony =
                  currentStep > 0 && sofa
                    ? isHarmonyMatch(sofa, p.color)
                    : false
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => selectProduct(p)}
                      className={`group flex w-full flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-300/40 ${
                        selected
                          ? 'border-rose-500 ring-2 ring-rose-400/90 ring-offset-2 ring-offset-[#faf8f4] shadow-lg shadow-rose-900/15'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="relative aspect-[4/3] bg-stone-100">
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          width={400}
                          height={300}
                        />
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-700 shadow-sm backdrop-blur">
                          <Icon className="size-3.5 text-rose-600" aria-hidden />
                          {p.category}
                        </span>
                        {harmony ? (
                          <span className="absolute bottom-3 left-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-full bg-violet-600/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-md backdrop-blur">
                            <span aria-hidden>🤖</span>
                            Robotun Önerisi
                            <span className="rounded bg-white/20 px-1 py-0.5 text-[9px] font-bold normal-case">
                              Uyumlu
                            </span>
                          </span>
                        ) : null}
                        {selected ? (
                          <span
                            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg ring-2 ring-white/95"
                            title="Seçildi"
                          >
                            <Check
                              className="size-4"
                              strokeWidth={2.75}
                              aria-hidden
                            />
                            <span className="sr-only">Seçildi</span>
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-4">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                            {p.brand}
                          </p>
                          <h3 className="text-lg font-semibold leading-snug text-stone-900">
                            {p.name}
                          </h3>
                        </div>
                        <div className="mt-auto flex flex-wrap gap-2 text-xs text-stone-600">
                          <span className="rounded-md bg-stone-100 px-2 py-1">
                            {p.style}
                          </span>
                          <span className="rounded-md bg-stone-100 px-2 py-1">
                            {p.color}
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-rose-800">
                          {formatTry(p.price)}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
            )}
            </div>
          </>
        )}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur-md supports-[padding:max(0px)]:pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        aria-label="Sihirbaz navigasyonu"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={goPrev}
            disabled={!canGoPrev}
            className="inline-flex min-h-11 min-w-[44px] touch-manipulation items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Önceki Adım
          </button>
          <p className="hidden text-sm text-stone-500 sm:block">
            {currentStep + 1} / {WIZARD_STEPS.length}
          </p>
          {budgetBlocksNext &&
          currentSelection &&
          nextCategoryMinPrice !== null ? (
            <div className="max-w-md rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-right shadow-sm">
              <p className="text-sm font-bold text-amber-950">
                Bütçeni Aşabilirsin!
              </p>
              <p className="mt-1 text-xs text-amber-900">
                Kalan {formatTry(remaining)}, bir sonraki adımda (
                {WIZARD_STEPS[currentStep + 1]?.title}) en uygun ürün bile{' '}
                {formatTry(nextCategoryMinPrice)}. Önceki adıma dönüp daha uygun
                fiyatlı bir seçenek denemen iyi olur.
              </p>
            </div>
          ) : allStepsComplete ? (
            <button
              type="button"
              onClick={openSummary}
              className="inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-900/20 transition hover:from-rose-700 hover:to-rose-800"
            >
              <Sparkles className="size-4" aria-hidden />
              Kombinasyonu Tamamla
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              className="inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
            >
              Sonraki Adım
              <ArrowRight className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </nav>

      <div
        className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 border-t border-stone-200/90 bg-white/95 px-3 py-2 shadow-[0_-6px_24px_rgba(0,0,0,0.06)] backdrop-blur-md lg:hidden"
        aria-label="Oda önizlemesi — mobil"
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-rose-800/90">
          Odanız oluşuyor
        </p>
        <div className="mt-1.5 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {WIZARD_STEPS.map((step) => {
            const p = selections[step.category]
            const StepIcon = categoryIcon(step.category)
            return (
              <div
                key={`m-${step.category}`}
                className="flex min-w-[4.5rem] shrink-0 flex-col items-center gap-0.5 rounded-lg border border-stone-200/80 bg-white/95 px-2 py-1.5 text-center shadow-sm"
              >
                <StepIcon
                  className={`size-4 ${p ? 'text-rose-600' : 'text-stone-300'}`}
                  aria-hidden
                />
                <span className="line-clamp-2 w-full text-[9px] font-medium leading-tight text-stone-700">
                  {p ? p.name : '—'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {summaryOpen && allStepsComplete ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-950/55 p-4 pb-24 backdrop-blur-sm sm:p-8 sm:pb-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="summary-title"
          onClick={() => setSummaryOpen(false)}
        >
          <div
            className="relative my-4 w-full max-w-6xl rounded-3xl border border-stone-200/80 bg-gradient-to-b from-white to-stone-50 shadow-2xl shadow-stone-900/20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSummaryOpen(false)}
              className="absolute right-4 top-4 rounded-full border border-stone-200 bg-white p-2 text-stone-600 shadow-sm transition hover:bg-stone-50"
              aria-label="Kapat"
            >
              <X className="size-5" />
            </button>

            <div className="border-b border-stone-100 px-6 pb-6 pt-10 sm:px-10 sm:pt-12">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-rose-700">
                Özet ekranı
              </p>
              <h2
                id="summary-title"
                className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl"
              >
                Çeyiz kombinasyonun hazır
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-stone-600">
                Toplam {formatTry(spent)} · Bütçe {formatTry(totalBudget)} · Kalan{' '}
                {formatTry(remaining)}
              </p>
              {combinationCode ? (
                <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50/80 px-3 py-2 font-mono text-sm font-semibold text-rose-900">
                  Kombinasyon kodun:{' '}
                  <span className="tracking-wide">{combinationCode}</span>
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 px-4 py-6 sm:grid-cols-2 sm:gap-5 sm:px-8 lg:grid-cols-4">
              {WIZARD_STEPS.map((step) => {
                const p = selections[step.category]!
                const SIcon = categoryIcon(step.category)
                return (
                  <article
                    key={step.category}
                    className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-md transition-all hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/3] bg-stone-100">
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        width={400}
                        height={300}
                      />
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-700 shadow">
                        <SIcon className="size-3.5 text-rose-600" aria-hidden />
                        {step.title}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <p className="text-[11px] font-semibold uppercase text-stone-500">
                        {p.brand}
                      </p>
                      <h3 className="text-base font-semibold leading-snug text-stone-900">
                        {p.name}
                      </h3>
                      <p className="mt-auto text-lg font-bold text-rose-800">
                        {formatTry(p.price)}
                      </p>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="mx-4 mb-4 rounded-2xl border border-stone-200/90 bg-white/90 p-5 sm:mx-8 sm:p-6">
              <h3 className="text-sm font-semibold text-stone-900">
                Harcama dağılımı
              </h3>
              <p className="mt-1 text-xs text-stone-500">
                Her kategori, toplam bütçene göre yüzde kaç yer kaplıyor?
              </p>
              <ul
                className="mt-4 space-y-3.5"
                aria-label="Kategori bazlı harcama yüzdeleri"
              >
                {spendingBreakdown.map((row) => (
                  <li key={row.key}>
                    <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium text-stone-800">
                        {row.label}
                      </span>
                      <span className="tabular-nums text-stone-600">
                        <span className="font-semibold text-stone-900">
                          %{row.pct.toLocaleString('tr-TR', {
                            minimumFractionDigits: row.pct % 1 ? 1 : 0,
                            maximumFractionDigits: 1,
                          })}
                        </span>
                        <span className="text-stone-400"> · </span>
                        {formatTry(row.amount)}
                      </span>
                    </div>
                    <div
                      className="h-2.5 overflow-hidden rounded-full bg-stone-100"
                      role="presentation"
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${row.colorClass}`}
                        style={{
                          width: `${Math.min(100, row.pct)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mx-4 mb-4 rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-white p-6 sm:mx-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg">
                  <Sparkles className="size-6" aria-hidden />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-stone-900">
                    AI İç Mimar Yorumu
                  </h3>
                  <p className="text-sm text-stone-500">
                    Seçimlerine göre otomatik üretildi — eğlenceli bir rehber
                    niteliğindedir.
                  </p>
                </div>
                <div className="ml-auto flex items-baseline gap-1 rounded-2xl bg-white px-4 py-2 shadow-inner ring-1 ring-violet-100">
                  <span className="text-3xl font-bold tabular-nums text-violet-700">
                    {styleScore}
                  </span>
                  <span className="text-sm font-medium text-violet-600/80">/10</span>
                  <span className="sr-only">Stil puanı</span>
                </div>
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-stone-700">
                {interiorStory}
              </p>
            </div>

            <div className="flex flex-col gap-3 border-t border-stone-100 bg-stone-50/80 px-4 py-5 sm:flex-row sm:justify-end sm:px-8">
              <button
                type="button"
                onClick={copyList}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
              >
                <Copy className="size-4" aria-hidden />
                {copyFeedback ? 'Kopyalandı!' : 'Listeyi Kopyala'}
              </button>
              <button
                type="button"
                onClick={restartWizard}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-stone-800"
              >
                <RotateCcw className="size-4" aria-hidden />
                Yeniden Başla
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
