import { useEffect, useMemo, useState } from 'react'
import type { Product } from '../types/product'
import productsUrl from '../../products.json?url'
import { resolveStepProducts, sortWithHarmonyFirst } from '../smartWizard'

interface CatalogState {
  products: Product[]
  loading: boolean
  error: string | null
  bounds: { min: number; max: number }
}

export function useCatalog() {
  const [state, setState] = useState<CatalogState>({
    products: [],
    loading: true,
    error: null,
    bounds: { min: 0, max: 0 },
  })

  useEffect(() => {
    let cancelled = false
    setState((prev) => ({ ...prev, loading: true, error: null }))
    
    fetch(productsUrl)
      .then((r) => {
        if (!r.ok) throw new Error('Ürün listesi alınamadı')
        return r.json() as Promise<Product[]>
      })
      .then((data) => {
        if (cancelled) return
        const products = data.map((p) => ({
          ...p,
          room: p.room ?? 'Salon',
        }))
        
        let lo = Infinity
        let hi = -Infinity
        for (const p of products) {
          if (p.price < lo) lo = p.price
          if (p.price > hi) hi = p.price
        }
        
        setState({
          products,
          loading: false,
          error: null,
          bounds: {
            min: Number.isFinite(lo) ? lo : 0,
            max: Number.isFinite(hi) ? hi : 0,
          },
        })
      })
      .catch(() => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'Veri yüklenirken bir hata oluştu.',
          }))
        }
      })
    
    return () => {
      cancelled = true
    }
  }, [])

  return state
}

export interface FilteredCatalogResult {
  catalogSlice: Product[]
  stepProductsRaw: Product[]
  brandOptions: string[]
  stepProducts: Product[]
}

export function useFilteredCatalog(
  products: Product[],
  activeRoom: string,
  activeCategory: string,
  brandFilter: string | null,
  priceRangeLo: number,
  priceRangeHi: number,
  sofaForHarmony: Product | undefined,
  harmonyStepIndex: number,
): FilteredCatalogResult {
  const catalogSlice = useMemo(
    () => products.filter((p) => p.room === activeRoom && p.category === activeCategory),
    [products, activeRoom, activeCategory],
  )

  const stepProductsRaw = useMemo(() => {
    const r = resolveStepProducts(catalogSlice, activeCategory, undefined, true)
    return r.products
  }, [catalogSlice, activeCategory])

  const brandOptions = useMemo(() => {
    const uniq = new Set(stepProductsRaw.map((p) => p.brand))
    return [...uniq].sort((a, b) =>
      a.localeCompare(b, 'tr', { sensitivity: 'base' }),
    )
  }, [stepProductsRaw])

  const stepProductsSorted = useMemo(
    () => sortWithHarmonyFirst(stepProductsRaw, sofaForHarmony, harmonyStepIndex),
    [stepProductsRaw, sofaForHarmony, harmonyStepIndex],
  )

  const stepProductsAfterBrand = useMemo(
    () => (brandFilter ? stepProductsSorted.filter((p) => p.brand === brandFilter) : stepProductsSorted),
    [stepProductsSorted, brandFilter],
  )

  const stepProducts = useMemo(() => {
    if (products.length === 0) return []
    const lo = Math.min(priceRangeLo, priceRangeHi)
    const hi = Math.max(priceRangeLo, priceRangeHi)
    return stepProductsAfterBrand.filter((p) => p.price >= lo && p.price <= hi)
  }, [stepProductsAfterBrand, priceRangeLo, priceRangeHi, products.length])

  return {
    catalogSlice,
    stepProductsRaw,
    brandOptions,
    stepProducts,
  }
}