/**
 * CategoryTabs — Oda & kategori seçim paneli.
 *
 * Context'ten doğrudan okur; prop drilling tamamen kaldırıldı.
 * Seçili & dolu kategoriler premium gradient highlight ile işaretlenir.
 */
import { memo } from 'react'
import { Check } from 'lucide-react'
import type { RoomId } from '../types/product'
import { ROOM_CATEGORY_STEPS } from '../roomCategories'
import { useConfigurator, CONFIG_ROOMS } from '../context/ConfiguratorContext'
import { categoryIcon } from '../utils/categoryIcon'

export const CategoryTabs = memo(function CategoryTabs() {
  const {
    activeRoom,
    setActiveRoom,
    activeCategory,
    setActiveCategory,
    selections,
    roomOverShare,
  } = useConfigurator()

  const steps = ROOM_CATEGORY_STEPS[activeRoom]

  function isRoomDone(room: RoomId) {
    return ROOM_CATEGORY_STEPS[room].every((s) =>
      Boolean(selections[room]?.[s.category]),
    )
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 gap-2">
      {/* ── Oda sekmeleri (dikey) ──────────────────────────────────────── */}
      <div
        className="flex w-10 shrink-0 flex-col gap-1 border-r border-stone-200/70 pr-2"
        role="tablist"
        aria-label="Odalar"
      >
        {CONFIG_ROOMS.map(({ id, tab }) => {
          const over = roomOverShare(id)
          const active = activeRoom === id
          const roomDone = isRoomDone(id)
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveRoom(id)}
              title={
                over
                  ? 'Bu odanın payı bütçeyi aşıyor'
                  : roomDone
                    ? 'Bu oda tamamlandı'
                    : id
              }
              aria-label={
                roomDone
                  ? `${id} — tamamlandı`
                  : over
                    ? `${id} — bütçe uyarısı`
                    : id
              }
              className={`relative rounded-lg px-1 py-2 text-center text-[8px] font-bold uppercase leading-tight tracking-wider transition-colors duration-300 ease-out ${
                active
                  ? 'bg-rose-600 text-white shadow-sm'
                  : over
                    ? 'bg-red-50 text-red-600 ring-1 ring-red-300'
                    : 'bg-white/90 text-stone-500 hover:bg-stone-100'
              }`}
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {roomDone && (
                <span
                  className="absolute right-0 top-0 z-10 size-2 rounded-full bg-emerald-500 shadow-sm ring-2 ring-white"
                  aria-hidden
                />
              )}
              {tab}
            </button>
          )
        })}
      </div>

      {/* ── Kategori listesi ───────────────────────────────────────────── */}
      <nav className="min-h-0 min-w-0 flex-1 overflow-y-auto" aria-label="Kategoriler">
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
                  onClick={() => setActiveCategory(step.category)}
                  className={`w-full rounded-xl border p-3 text-left transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 ${
                    filled
                      ? active
                        ? 'border-emerald-300/70 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-transparent shadow-[0_0_0_1px_rgba(52,211,153,0.35),0_4px_16px_rgba(16,185,129,0.12)] ring-2 ring-rose-400/60'
                        : 'border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 via-teal-50/30 to-white/60 shadow-[0_0_0_1px_rgba(52,211,153,0.2)] hover:shadow-[0_0_0_1px_rgba(52,211,153,0.35)]'
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
                        className="size-11 shrink-0 rounded-lg border border-emerald-200/60 object-cover shadow-sm shadow-emerald-900/10"
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
})