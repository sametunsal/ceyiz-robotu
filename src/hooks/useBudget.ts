import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'ceyiz-robotu-budget'

interface BudgetState {
  total: number
  input: string
  dirty: boolean
}

export function useBudget(initialBudget = 100_000) {
  const [state, setState] = useState<BudgetState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (typeof parsed.total === 'number' && parsed.total > 0) {
          return {
            total: parsed.total,
            input: String(parsed.total),
            dirty: false,
          }
        }
      } catch {}
    }
    return {
      total: initialBudget,
      input: '100000',
      dirty: false,
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ total: state.total }))
  }, [state.total])

  const setInput = useCallback((value: string) => {
    setState((prev) => ({ ...prev, input: value, dirty: true }))
  }, [])

  const applyFromInput = useCallback((): boolean => {
    const cleaned = state.input.replace(/\./g, '').replace(/\s/g, '').replace(',', '.')
    const n = Number(cleaned)
    if (Number.isFinite(n) && n > 0) {
      setState((prev) => ({
        ...prev,
        total: Math.floor(n),
        input: String(Math.floor(n)),
        dirty: false,
      }))
      return true
    }
    setState((prev) => ({ ...prev, dirty: false }))
    return false
  }, [state.input])

  const reset = useCallback((defaultBudget = 100_000) => {
    setState({
      total: defaultBudget,
      input: String(defaultBudget),
      dirty: false,
    })
  }, [])

  return {
    budget: state.total,
    budgetInput: state.input,
    budgetDirty: state.dirty,
    setBudgetInput: setInput,
    applyBudgetFromInput: applyFromInput,
    resetBudget: reset,
  }
}