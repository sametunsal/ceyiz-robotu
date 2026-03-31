export type ProductStyle = 'Modern' | 'Klasik' | 'Nötr' | 'Zamansız'

export type RoomId = 'Salon' | 'Mutfak' | 'Yatak Odası' | 'Antre'

export interface Product {
  id: number
  room: RoomId
  category: string
  name: string
  brand: string
  price: number
  color: string
  style: ProductStyle
  imageUrl: string
}
