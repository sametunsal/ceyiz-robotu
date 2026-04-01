import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Product, RoomId } from '../types/product'
import { ROOM_ORDER, ROOM_CATEGORY_STEPS } from '../roomCategories'

const STORAGE_KEY = 'ceyiz-robotu-selections'
const FAVORITES_KEY = 'ceyiz-robotu-favorites'

export interface MultiRoomSelections extends Record<RoomId, Record<string, Product | null>> {
  Salon: Record<string, Product | null>
  Mutfak: Record<string, Product | null>
  'Yatak Odası': Record<string, Product | null>
  Antre: Record<string, Product | null>
}

function emptySelections(): MultiRoomSelections {
  return {
    Salon: {},
    Mutfak: {},
    'Yatak Odası': {},
    Antre: {},
  }
}

function selectionsToJSON(selections: MultiRoomSelections): string {
  const obj: Record<string, Record<string, Product | null>> = {}
  for (const room of ROOM_ORDER) {
    obj[room] = {}
    for (const [cat, product] of Object.entries(selections[room])) {
      if (product) {
        obj[room][cat] = product
      }
    }
  }
  return JSON.stringify(obj)
}

function selectionsFromJSON(json: string): MultiRoomSelections {
  try {
    const obj = JSON.parse(json) as Record<string, Record<string, Product | null>>
    const result = emptySelections()
    for (const room of ROOM_ORDER) {
      if (obj[room]) {
        for (const [cat, product] of Object.entries(obj[room])) {
          result[room][cat] = product
        }
      }
    }
    return result
  } catch {
    return emptySelections()
  }
}

export interface SelectionHistoryItem {
  selections: MultiRoomSelections
  timestamp: number
}

export function useSelections() {
  const [selections, setSelections] = useState<MultiRoomSelections>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return selectionsFromJSON(saved)
    }
    return emptySelections()
  })

  const [history, setHistory] = useState<SelectionHistoryItem[]>([])
  const [favorites, setFavorites] = useState<Set<number>>(() => {
    const saved = localStorage.getItem(FAVORITES_KEY)
    if (saved) {
      try {
        return new Set(JSON.parse(saved) as number[])
      } catch {
        return new Set()
      }
    }
    return new Set()
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectionsToJSON(selections))
  }, [selections])

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]))
  }, [favorites])

  const canUndo = history.length > 0

  const selectProduct = useCallback((room: RoomId, category: string, product: Product) => {
    setHistory((prev) => {
      const newHistory = [...prev, { selections, timestamp: Date.now() }]
      if (newHistory.length > 20) {
        return newHistory.slice(-20)
      }
      return newHistory
    })
    setSelections((prev) => ({
      ...prev,
      [room]: {
        ...prev[room],
        [category]: product,
      },
    }))
  }, [selections])

  const removeProduct = useCallback((room: RoomId, category: string) => {
    setHistory((prev) => {
      const newHistory = [...prev, { selections, timestamp: Date.now() }]
      if (newHistory.length > 20) {
        return newHistory.slice(-20)
      }
      return newHistory
    })
    setSelections((prev) => ({
      ...prev,
      [room]: {
        ...prev[room],
        [category]: null,
      },
    }))
  }, [selections])

  const undo = useCallback(() => {
    if (history.length === 0) return
    const last = history[history.length - 1]
    setSelections(last.selections)
    setHistory((prev) => prev.slice(0, -1))
  }, [history])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  /** Paylaşım linkinden gelen seçimleri yükle (mevcut durum history'ye eklenir) */
  const loadSelections = useCallback(
    (newSelections: MultiRoomSelections) => {
      setHistory((prev) => {
        const newHistory = [...prev, { selections, timestamp: Date.now() }]
        if (newHistory.length > 20) return newHistory.slice(-20)
        return newHistory
      })
      setSelections(newSelections)
    },
    [selections],
  )

  const reset = useCallback(() => {
    setHistory((prev) => {
      const newHistory = [...prev, { selections, timestamp: Date.now() }]
      if (newHistory.length > 20) {
        return newHistory.slice(-20)
      }
      return newHistory
    })
    setSelections(emptySelections())
  }, [selections])

  const toggleFavorite = useCallback((productId: number) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }, [])

  const isFavorite = useCallback((productId: number) => {
    return favorites.has(productId)
  }, [favorites])

  const selectedCount = useMemo(() => {
    let n = 0
    for (const room of ROOM_ORDER) {
      for (const step of ROOM_CATEGORY_STEPS[room]) {
        if (selections[room]?.[step.category]) n += 1
      }
    }
    return n
  }, [selections])

  const allSlotsComplete = useMemo(() => {
    return ROOM_ORDER.every((room) =>
      ROOM_CATEGORY_STEPS[room].every((step) =>
        Boolean(selections[room]?.[step.category]),
      ),
    )
  }, [selections])

  const roomsWithSelections = useMemo(() => {
    let n = 0
    for (const room of ROOM_ORDER) {
      if (
        ROOM_CATEGORY_STEPS[room].some((step) => selections[room]?.[step.category])
      ) {
        n += 1
      }
    }
    return n
  }, [selections])

  const hasAnySelection = selectedCount >= 1

  const totalCategorySlots = useMemo(
    () => ROOM_ORDER.reduce((acc, room) => acc + ROOM_CATEGORY_STEPS[room].length, 0),
    [],
  )

  return {
    selections,
    selectProduct,
    removeProduct,
    reset,
    undo,
    canUndo,
    clearHistory,
    loadSelections,
    toggleFavorite,
    isFavorite,
    favorites,
    selectedCount,
    allSlotsComplete,
    roomsWithSelections,
    hasAnySelection,
    totalCategorySlots,
  }
}

export function isRoomFullySelected(room: RoomId, rs: MultiRoomSelections): boolean {
  return ROOM_CATEGORY_STEPS[room].every((step) =>
    Boolean(rs[room]?.[step.category]),
  )
}

export function roomSpent(rs: MultiRoomSelections, room: RoomId): number {
  return Object.values(rs[room]).reduce((a, p) => a + (p?.price ?? 0), 0)
}