export type ProductStyle = 'Modern' | 'Klasik' | 'Nötr' | 'Zamansız'

export interface Product {
  id: number
  category: string
  name: string
  brand: string
  price: number
  color: string
  style: ProductStyle
  imageUrl: string
}
