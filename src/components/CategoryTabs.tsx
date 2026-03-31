import {
  Armchair,
  Blinds,
  Check,
  Lamp,
  LayoutGrid,
  RectangleHorizontal,
  UtensilsCrossed,
} from 'lucide-react'
import type { Product, RoomId } from '../types/product'
import { ROOM_CATEGORY_STEPS } from '../roomCategories'

function categoryIcon(category: string) {
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

export interface CategoryStep {
  category: string
  title: string
}

interface CategoryTabsProps {
  activeRoom: RoomId
  activeCategory: string
  selections: {
    Salon: Record<string, Product | null>
    Mutfak: Record<string, Product | null>
    'Yatak Odası': Record<string, Product | null>
    Antre: Record<string, Product | null>
  }
  onRoomChange: (room: RoomId) => void
  onCategoryChange: (category: string) => void
  isRoomFullySelected: (room: RoomId) => boolean
  roomOverShare: (room: RoomId) => boolean
}

const CONFIG_ROOMS: { id: RoomId; tab: string }[] = [
  { id: 'Salon', tab: 'SALON' },
  { id: 'Mutfak', tab: 'MUTFAK' },
  { id: 'Yatak Odası', tab: 'YATAK ODASI' },
  { id: 'Antre', tab: 'ANTRE' },
]

export function CategoryTabs({
  activeRoom,
  activeCategory,
  selections,
  onRoomChange,
  onCategoryChange,
  isRoomFullySelected,
  roomOverShare,
}: CategoryTabsProps) {
  const steps = ROOM_CATEGORY_STEPS[activeRoom]

  return (
    <div className="flex min-h-0 min-w-0 flex-1 gap-2">
      <div
        className="flex w-10 shrink-0 flex-col gap-1 border-r border-stone-200/70 pr-2"
        role="tablist"
        aria-label="Odalar"
      >
        {CONFIG_ROOMS.map(({ id, tab }) => {
          const over = roomOverShare(id)
          const active = activeRoom === id
          const roomDone = isRoomFullySelected(id)
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onRoomChange(id)}
              title={
                over
                  ? 'Bu odanın payı bütçeyi aşıyor'
                  : roomDone
                    ? 'Bu oda tamamlandı'
                    : id
              }
              aria-label={
                roomDone ? `${id} — tamamlandı` : over ? `${id} — bütçe uyarısı` : id
              }
              className={`relative rounded-lg px-1 py-2 text-center text-[8px] font-bold uppercase leading-tight tracking-wider transition-colors duration-300 ease-out ${
                active
                  ? 'bg-rose-600 text-white shadow-sm'
                  : over
                    ? 'bg-red-50 text-red-600 ring-1 ring-red-300'
                    : 'bg-white/90 text-stone-500 hover:bg-stone-100'
              }`}
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
              }}
            >
              {roomDone ? (
                <span
                  className="absolute right-0 top-0 z-10 size-2 rounded-full bg-emerald-500 shadow-sm ring-2 ring-white"
                  aria-hidden
                />
              ) : null}
              {tab}
            </button>
          )
        })}
      </div>
      <nav
        className="min-h-0 min-w-0 flex-1 overflow-y-auto"
        aria-label="Kategoriler"
      >
        <ul className="flex flex-col gap-2">
          {steps.map((step) => {
            const p = selections[activeRoom]?.[step.category]
            const StepIcon = categoryIcon(step.category)
            const active = activeCategory === step.category
            const filled = Boolean(p)
            return (
              <li key={step.category}>
                <button
                  type="button"
                  onClick={() => onCategoryChange(step.category)}
                  className={`w-full rounded-xl border p-3 text-left transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 ${
                    filled
                      ? active
                        ? 'border-emerald-400/90 bg-emerald-50 shadow-sm ring-2 ring-rose-400/75'
                        : 'border-emerald-200/90 bg-emerald-50/85 hover:border-emerald-300 hover:bg-emerald-50'
                      : active
                        ? 'border-rose-500/90 bg-rose-50/90 shadow-sm ring-1 ring-rose-200/60'
                        : 'border-stone-200/80 bg-white/90 hover:border-stone-300 hover:bg-stone-50/90'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <StepIcon
                      className={`size-4 shrink-0 ${
                        filled
                          ? 'text-emerald-600'
                          : active
                            ? 'text-rose-600'
                            : 'text-stone-400'
                      }`}
                      aria-hidden
                    />
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wide ${
                        filled ? 'text-emerald-900/90' : 'text-stone-600'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {p ? (
                    <div className="mt-2.5 flex items-start gap-2">
                      <span
                        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-900/15 ring-2 ring-emerald-100"
                        aria-hidden
                      >
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                      <img
                        src={(p as { imageUrl: string }).imageUrl}
                        alt=""
                        className="size-11 shrink-0 rounded-lg border border-emerald-100/80 object-cover shadow-sm"
                        width={44}
                        height={44}
                      />
                      <p className="min-w-0 flex-1 pt-0.5 text-xs font-semibold leading-snug text-emerald-900">
                        {(p as { name: string }).name}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs font-medium text-stone-400 transition-colors duration-300">
                      İsteğe bağlı · —
                    </p>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}