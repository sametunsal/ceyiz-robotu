import type { RoomId } from './types/product'

export const ROOM_ORDER: RoomId[] = [
  'Salon',
  'Mutfak',
  'Yatak Odası',
  'Antre',
]

export type RoomCategoryStep = { category: string; title: string }

/** Oda başına katalog `category` anahtarı + arayüz başlığı (ürün JSON’daki category ile eşleşir). */
export const ROOM_CATEGORY_STEPS: Record<
  RoomId,
  readonly RoomCategoryStep[]
> = {
  Salon: [
    { category: 'Koltuk', title: 'Koltuk Takımı' },
    { category: 'Halı', title: 'Halı' },
    { category: 'Yemek Masası', title: 'Yemek Masası' },
    { category: 'Aydınlatma', title: 'Aydınlatma' },
    { category: 'Perde', title: 'Perde' },
  ],
  Mutfak: [
    { category: 'Halı', title: 'Mutfak halısı' },
    { category: 'Yemek Masası', title: 'Yemek masası' },
    { category: 'Aydınlatma', title: 'Aydınlatma' },
    { category: 'Perde', title: 'Perde' },
  ],
  'Yatak Odası': [
    { category: 'Koltuk', title: 'Oturma / puf' },
    { category: 'Halı', title: 'Halı' },
    { category: 'Aydınlatma', title: 'Aydınlatma' },
    { category: 'Perde', title: 'Perde' },
  ],
  Antre: [
    { category: 'Halı', title: 'Halı' },
    { category: 'Aydınlatma', title: 'Aydınlatma' },
    { category: 'Perde', title: 'Perde' },
  ],
}
