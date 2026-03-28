import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const CATEGORIES = [
  {
    category: 'Koltuk',
    brands: ['Vitra', 'İstikbal', 'Bellona', 'Mondi', 'Doğtaş', 'Kelebek', 'Çilek'],
    suffixes: [
      'Köşe Takımı',
      'Üçlü Koltuk',
      'İkili Kanepe',
      'Berjer',
      'Modüler Grup',
      'Chester Kanepe',
      'Relax Köşe',
    ],
  },
  {
    category: 'Halı',
    brands: ['Merinos', 'Saray', 'Padişah', 'Angora', 'Sanat', 'Atlas'],
    suffixes: ['Halı', 'Kilim', 'Shaggy Halı', 'Yolluk', 'Oda Halısı', 'Patchwork', 'Vintage Halı'],
  },
  {
    category: 'Yemek Masası',
    brands: ['İstikbal', 'Bellona', 'Doğtaş', 'Mondi', 'Çilek', 'Kelebek'],
    suffixes: [
      'Yemek Masası',
      'Uzatmalı Masa',
      'Cam Masa',
      'Ahşap Masa',
      'Bar Masası',
      'Cemre Masa',
      'Mermer Desenli Masa',
    ],
  },
  {
    category: 'Aydınlatma',
    brands: ['Philips', 'EGLO', 'Osram', 'İkea', 'Horoz', 'AVONNI'],
    suffixes: ['Avize', 'Lambader', 'Spot Set', 'Sarkıt', 'Masa Lambası', 'Duvar Aplik', 'LED Panel'],
  },
]

const MODERN_COLORS = [
  ['Antrasit', '#36454F'],
  ['Lacivert', '#1E3A5F'],
  ['Gri', '#808080'],
  ['Beyaz', '#F8F8F8'],
  ['Zeytin', '#3D4F3D'],
  ['Hardal', '#C4A000'],
]

const KLASIK_COLORS = [
  ['Beyaz', '#F8F8F8'],
  ['Bordo', '#722F37'],
  ['Krem', '#F5F5DC'],
  ['Bej', '#C4A77D'],
  ['Lacivert', '#1E3A5F'],
  ['Altın Yaldız', '#C5A059'],
  ['Kahve', '#5C4033'],
]

const NEUTRAL_COLORS = [
  ['Beyaz', '#F8F8F8'],
  ['Bej', '#C4A77D'],
  ['Gri', '#808080'],
  ['Krem', '#F5F5DC'],
]

function colorStr(pair) {
  return `${pair[0]} (${pair[1]})`
}

function priceFrom(seed) {
  return 3500 + ((seed * 4139) % 46_500)
}

const products = []
let id = 1
let seed = 1

for (const def of CATEGORIES) {
  for (let i = 0; i < 12; i += 1) {
    const brand = def.brands[i % def.brands.length]
    const suf = def.suffixes[i % def.suffixes.length]
    const col = MODERN_COLORS[i % MODERN_COLORS.length]
    const pid = id++
    products.push({
      id: pid,
      category: def.category,
      name: `${brand} ${suf}`,
      brand,
      price: priceFrom(seed++),
      color: colorStr(col),
      style: 'Modern',
      imageUrl: `https://picsum.photos/seed/ceyiz${pid}/400/300`,
    })
  }
  for (let i = 0; i < 12; i += 1) {
    const brand = def.brands[(i + 3) % def.brands.length]
    const suf = def.suffixes[(i + 2) % def.suffixes.length]
    const col = KLASIK_COLORS[i % KLASIK_COLORS.length]
    const pid = id++
    products.push({
      id: pid,
      category: def.category,
      name: `${brand} ${suf}`,
      brand,
      price: priceFrom(seed++),
      color: colorStr(col),
      style: 'Klasik',
      imageUrl: `https://picsum.photos/seed/ceyiz${pid}/400/300`,
    })
  }
  for (let i = 0; i < 4; i += 1) {
    const brand = def.brands[(i + 1) % def.brands.length]
    const suf = def.suffixes[(i + 4) % def.suffixes.length]
    const col = NEUTRAL_COLORS[i % NEUTRAL_COLORS.length]
    const pid = id++
    products.push({
      id: pid,
      category: def.category,
      name: `${brand} ${suf} Nötr`,
      brand,
      price: priceFrom(seed++),
      color: colorStr(col),
      style: 'Nötr',
      imageUrl: `https://picsum.photos/seed/ceyiz${pid}/400/300`,
    })
  }
  for (let i = 0; i < 4; i += 1) {
    const brand = def.brands[(i + 5) % def.brands.length]
    const suf = def.suffixes[(i + 1) % def.suffixes.length]
    const col = NEUTRAL_COLORS[(i + 2) % NEUTRAL_COLORS.length]
    const pid = id++
    products.push({
      id: pid,
      category: def.category,
      name: `${brand} ${suf} Zamansız`,
      brand,
      price: priceFrom(seed++),
      color: colorStr(col),
      style: 'Zamansız',
      imageUrl: `https://picsum.photos/seed/ceyiz${pid}/400/300`,
    })
  }
}

fs.writeFileSync(path.join(root, 'products.json'), JSON.stringify(products, null, 2), 'utf8')
console.log(`Wrote ${products.length} products to products.json`)
