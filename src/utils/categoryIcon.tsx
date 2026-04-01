/**
 * Shared category icon resolver.
 * Previously duplicated in ProductGrid, CategoryTabs, and SummaryModal.
 */
import {
  Armchair,
  Blinds,
  Lamp,
  LayoutGrid,
  RectangleHorizontal,
  UtensilsCrossed,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function categoryIcon(category: string): LucideIcon {
  switch (category) {
    case 'Koltuk':
      return Armchair
    case 'Halı':
      return RectangleHorizontal
    case 'Yemek Masası':
      return UtensilsCrossed
    case 'Aydınlatma':
      return Lamp
    case 'Perde':
      return Blinds
    default:
      return LayoutGrid
  }
}
