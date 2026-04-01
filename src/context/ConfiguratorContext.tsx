/**
 * ConfiguratorContext — Tek merkezi state yönetimi.
 *
 * Tüm hook kompozisyonu (useBudget, useSelections, useCatalog),
 * navigasyon state'i (activeRoom, activeCategory), filtreler,
 * UI state'leri ve hesaplanan değerler burada yaşar.
 * Bileşenler prop drilling yerine `useConfigurator()` hook'u ile bağlanır.
 */
import confetti from 'canvas-confetti'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import type { Product, RoomId } from '../types/product'
import {
  buildInteriorNarrative,
  buildListClipboardText,
  computeStyleScore,
  ROOM_ORDER,
} from '../aiInteriorReview'
import { generateCombinationCode } from '../combinationCode'
import { ROOM_CATEGORY_STEPS } from '../roomCategories'
import { resolveStepProducts, sortWithHarmonyFirst } from '../smartWizard'
import { useBudget } from '../hooks/useBudget'
import { useCatalog } from '../hooks/useCatalog'
import { useSelections, isRoomFullySelected } from '../hooks/useSelections'
import type { MultiRoomSelections } from '../hooks/useSelections'
import { formatTry } from '../formatMoney'
import {
  buildShareUrl,
  decodeShareCode,
  countDecodedProducts,
} from '../utils/shareCode'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SpendingBreakdownRow {
  key: string
  label: string
  amount: number
  pct: number
  colorClass: string
}

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

export { CONFIG_ROOMS, formatTry }
export type { MultiRoomSelections }

interface ConfiguratorContextValue {
  // ── Catalog ─────────────────────────────────────────────────────────────
  products: Product[]
  loading: boolean
  error: string | null
  priceBounds: { min: number; max: number }

  // ── Budget ──────────────────────────────────────────────────────────────
  budget: number
  budgetInput: string
  budgetDirty: boolean
  setBudgetInput: (value: string) => void
  applyBudgetFromInput: () => boolean
  resetBudget: (defaultBudget?: number) => void

  // ── Selections ──────────────────────────────────────────────────────────
  selections: MultiRoomSelections
  selectProduct: (room: RoomId, category: string, product: Product) => void
  removeProduct: (room: RoomId, category: string) => void
  resetSelections: () => void
  undo: () => void
  canUndo: boolean
  toggleFavorite: (productId: number) => void
  isFavorite: (productId: number) => boolean
  selectedCount: number
  allSlotsComplete: boolean
  roomsWithSelections: number
  hasAnySelection: boolean
  totalCategorySlots: number

  // ── Navigation ──────────────────────────────────────────────────────────
  activeRoom: RoomId
  setActiveRoom: (room: RoomId) => void
  activeCategory: string
  setActiveCategory: (category: string) => void

  // ── Filters ─────────────────────────────────────────────────────────────
  brandFilter: string | null
  setBrandFilter: (brand: string | null) => void
  priceRangeLo: number
  setPriceRangeLo: (v: number) => void
  priceRangeHi: number
  setPriceRangeHi: (v: number) => void
  resetPriceRange: () => void

  // ── Computed: Budget & Spend ─────────────────────────────────────────────
  spent: number
  remaining: number
  overBudget: boolean
  remainingRatio: number
  perRoomBudgetShare: number
  roomSpent: (room: RoomId) => number
  roomOverShare: (room: RoomId) => boolean

  // ── Computed: Products ───────────────────────────────────────────────────
  stepProducts: Product[]
  stepProductsRaw: Product[]
  stepProductsAfterBrand: Product[]
  brandOptions: string[]
  currentSelection: Product | null | undefined
  sofaForHarmony: Product | undefined

  // ── Computed: UI metadata ─────────────────────────────────────────────────
  stepMeta: { category: string; title: string }
  dynamicStepTitle: string
  selectionProgressPct: number
  activeRoomComplete: boolean
  completeButtonLabel: string
  styleScore: number
  interiorStory: string
  spendingBreakdown: SpendingBreakdownRow[]

  // ── UI State ─────────────────────────────────────────────────────────────
  summaryOpen: boolean
  setSummaryOpen: (open: boolean) => void
  mobileSummaryOpen: boolean
  setMobileSummaryOpen: (open: boolean) => void
  mobileControlOpen: boolean
  setMobileControlOpen: (open: boolean) => void
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  copyFeedback: boolean
  combinationCode: string | null

  // ── Share ─────────────────────────────────────────────────────────────────
  shareUrl: string
  shareToastVisible: boolean
  shareDialogVisible: boolean
  pendingShareCount: number
  copyShareLink: () => Promise<void>
  loadSharedDesign: () => void
  dismissShareDialog: () => void

  // ── Refs ─────────────────────────────────────────────────────────────────
  settingsWrapRef: RefObject<HTMLDivElement | null>

  // ── Handlers ─────────────────────────────────────────────────────────────
  handleSelectProduct: (product: Product) => void
  openSummary: () => void
  copyList: () => Promise<void>
  copyListFeedback: boolean
  restartWizard: () => void
  triggerPrint: () => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ConfiguratorContext = createContext<ConfiguratorContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function ConfiguratorProvider({ children }: { children: ReactNode }) {
  // ── Hooks ──────────────────────────────────────────────────────────────
  const { products, loading, error, bounds: priceBounds } = useCatalog()
  const {
    budget,
    budgetInput,
    budgetDirty,
    setBudgetInput,
    applyBudgetFromInput,
    resetBudget,
  } = useBudget()
  const {
    selections,
    selectProduct,
    removeProduct,
    reset: resetSelections,
    undo,
    canUndo,
    toggleFavorite,
    isFavorite,
    selectedCount,
    allSlotsComplete,
    roomsWithSelections,
    hasAnySelection,
    totalCategorySlots,
    loadSelections,
  } = useSelections()

  // ── Navigation state ──────────────────────────────────────────────────
  const [activeRoom, setActiveRoom] = useState<RoomId>('Salon')
  const [activeCategory, setActiveCategory] = useState<string>('Koltuk')

  // ── Filter state ──────────────────────────────────────────────────────
  const [brandFilter, setBrandFilter] = useState<string | null>(null)
  const [priceRangeLo, setPriceRangeLo] = useState(0)
  const [priceRangeHi, setPriceRangeHi] = useState(0)

  // ── UI state ──────────────────────────────────────────────────────────
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [copyListFeedback, setCopyListFeedback] = useState(false)
  const [combinationCode, setCombinationCode] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false)
  const [mobileControlOpen, setMobileControlOpen] = useState(false)
  const settingsWrapRef = useRef<HTMLDivElement | null>(null)

  // ── Share state ───────────────────────────────────────────────────────
  const [shareToastVisible, setShareToastVisible] = useState(false)
  const [shareDialogVisible, setShareDialogVisible] = useState(false)
  const [pendingShareSelections, setPendingShareSelections] =
    useState<MultiRoomSelections | null>(null)

  // Sayfa yüklenince ?share= param'ını yakala, URL'i temizle
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('share')
    if (code) {
      window.history.replaceState(null, '', window.location.pathname)
      sessionStorage.setItem('ceyiz-pending-share', code)
    }
  }, [])

  // Ürünler yüklenince bekleyen kodu çöz
  useEffect(() => {
    if (products.length === 0) return
    const code = sessionStorage.getItem('ceyiz-pending-share')
    if (!code) return
    sessionStorage.removeItem('ceyiz-pending-share')
    const decoded = decodeShareCode(code, products)
    if (decoded && countDecodedProducts(decoded) > 0) {
      setPendingShareSelections(decoded)
      setShareDialogVisible(true)
    }
  }, [products.length])

  // ── Effects ──────────────────────────────────────────────────────────

  // Oda değişince aktif kategoriyi sıfırla (geçerli oda adımlarından biri değilse)
  useEffect(() => {
    const steps = ROOM_CATEGORY_STEPS[activeRoom]
    setActiveCategory((prev) =>
      steps.some((s) => s.category === prev) ? prev : steps[0].category,
    )
  }, [activeRoom])

  // Oda veya kategori değişince marka filtresini temizle
  useEffect(() => {
    setBrandFilter(null)
  }, [activeRoom, activeCategory])

  // Ürünler yüklenince fiyat aralığını başlat
  useEffect(() => {
    if (products.length === 0) return
    setPriceRangeLo(priceBounds.min)
    setPriceRangeHi(priceBounds.max)
  }, [products.length, priceBounds.min, priceBounds.max])

  // Özet modal açıkken scroll'u kilitle + Escape ile kapat
  useEffect(() => {
    if (!summaryOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSummaryOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [summaryOpen])

  // Özet modal açılınca confetti
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

  // Settings dropdown dışına tıklayınca kapat
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

  // Mobile summary sheet: scroll kilidi + Escape
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

  // Mobile control sheet: scroll kilidi + Escape
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

  // ── Computed: Budget & Spend ──────────────────────────────────────────

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
      Object.values(selections[room]).reduce((a, p) => a + (p?.price ?? 0), 0),
    [selections],
  )

  const roomOverShare = useCallback(
    (room: RoomId) =>
      perRoomBudgetShare > 0 && roomSpent(room) > perRoomBudgetShare,
    [perRoomBudgetShare, roomSpent],
  )

  // ── Computed: Products pipeline ───────────────────────────────────────

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

  const harmonyStepIndex = activeCategory === 'Koltuk' ? 0 : 1

  const stepProductsRaw = useMemo(() => {
    const r = resolveStepProducts(catalogSlice, activeCategory, undefined, true)
    return r.products
  }, [catalogSlice, activeCategory])

  const brandOptions = useMemo(() => {
    const uniq = new Set(stepProductsRaw.map((p: Product) => p.brand))
    return [...uniq].sort((a, b) =>
      a.localeCompare(b, 'tr', { sensitivity: 'base' }),
    )
  }, [stepProductsRaw])

  const stepProductsSorted = useMemo(
    () => sortWithHarmonyFirst(stepProductsRaw, sofaForHarmony, harmonyStepIndex),
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

  // ── Computed: UI metadata ─────────────────────────────────────────────

  const roomLabel =
    CONFIG_ROOMS.find((r) => r.id === activeRoom)?.tab ?? ''
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
    : allSlotsComplete
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

  const spendingBreakdown = useMemo<SpendingBreakdownRow[]>(() => {
    const base = budget > 0 ? budget : 1
    let idx = 0
    const rows: SpendingBreakdownRow[] = []
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

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleSelectProduct = useCallback(
    (product: Product) => {
      selectProduct(activeRoom, activeCategory, product)
    },
    [activeRoom, activeCategory, selectProduct],
  )

  const resetPriceRange = useCallback(() => {
    setPriceRangeLo(priceBounds.min)
    setPriceRangeHi(priceBounds.max)
  }, [priceBounds.min, priceBounds.max])

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
      setCopyListFeedback(true)
      window.setTimeout(() => setCopyListFeedback(false), 2200)
    } catch {
      setCopyListFeedback(false)
    }
  }, [combinationCode, selections, budget, spent, styleScore])

  // ── Share handlers ────────────────────────────────────────────────────
  const shareUrl = useMemo(
    () => (selectedCount > 0 ? buildShareUrl(selections) : ''),
    [selections, selectedCount],
  )

  const copyShareLink = useCallback(async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareToastVisible(true)
      window.setTimeout(() => setShareToastVisible(false), 2500)
    } catch {}
  }, [shareUrl])

  const loadSharedDesign = useCallback(() => {
    if (!pendingShareSelections) return
    loadSelections(pendingShareSelections)
    setPendingShareSelections(null)
    setShareDialogVisible(false)
  }, [pendingShareSelections, loadSelections])

  const dismissShareDialog = useCallback(() => {
    setPendingShareSelections(null)
    setShareDialogVisible(false)
  }, [])

  const triggerPrint = useCallback(() => {
    window.print()
  }, [])

  const restartWizard = useCallback(() => {
    resetSelections()
    resetBudget()
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
  }, [priceBounds, resetSelections, resetBudget])

  // ── Context value ─────────────────────────────────────────────────────

  const value: ConfiguratorContextValue = {
    // Catalog
    products,
    loading,
    error,
    priceBounds,
    // Budget
    budget,
    budgetInput,
    budgetDirty,
    setBudgetInput,
    applyBudgetFromInput,
    resetBudget,
    // Selections
    selections,
    selectProduct,
    removeProduct,
    resetSelections,
    undo,
    canUndo,
    toggleFavorite,
    isFavorite,
    selectedCount,
    allSlotsComplete,
    roomsWithSelections,
    hasAnySelection,
    totalCategorySlots,
    // Navigation
    activeRoom,
    setActiveRoom,
    activeCategory,
    setActiveCategory,
    // Filters
    brandFilter,
    setBrandFilter,
    priceRangeLo,
    setPriceRangeLo,
    priceRangeHi,
    setPriceRangeHi,
    resetPriceRange,
    // Computed: Budget
    spent,
    remaining,
    overBudget,
    remainingRatio,
    perRoomBudgetShare,
    roomSpent,
    roomOverShare,
    // Computed: Products
    stepProducts,
    stepProductsRaw,
    stepProductsAfterBrand,
    brandOptions,
    currentSelection,
    sofaForHarmony,
    // Computed: UI
    stepMeta,
    dynamicStepTitle,
    selectionProgressPct,
    activeRoomComplete,
    completeButtonLabel,
    styleScore,
    interiorStory,
    spendingBreakdown,
    // UI State
    summaryOpen,
    setSummaryOpen,
    mobileSummaryOpen,
    setMobileSummaryOpen,
    mobileControlOpen,
    setMobileControlOpen,
    settingsOpen,
    setSettingsOpen,
    copyFeedback,
    copyListFeedback,
    combinationCode,
    // Share
    shareUrl,
    shareToastVisible,
    shareDialogVisible,
    pendingShareCount: pendingShareSelections
      ? countDecodedProducts(pendingShareSelections)
      : 0,
    copyShareLink,
    loadSharedDesign,
    dismissShareDialog,
    // Refs
    settingsWrapRef,
    // Handlers
    handleSelectProduct,
    openSummary,
    copyList,
    restartWizard,
    triggerPrint,
  }

  return (
    <ConfiguratorContext.Provider value={value}>
      {children}
    </ConfiguratorContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useConfigurator(): ConfiguratorContextValue {
  const ctx = useContext(ConfiguratorContext)
  if (!ctx) {
    throw new Error('useConfigurator must be used within <ConfiguratorProvider>')
  }
  return ctx
}
