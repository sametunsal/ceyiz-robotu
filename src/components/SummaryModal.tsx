/**
 * SummaryModal — 3 sekme: Ürünler · AI Analiz · Bütçe & Paylaş
 *
 * - Ürünler: Oda × kategori ürün ızgarası (Perde dahil tüm kategoriler)
 * - AI Analiz: Animasyonlu stil skoru, oda uyum kartları, iç mimar yorumu
 * - Bütçe & Paylaş: Harcama dağılımı, share link, PDF print
 */
import { useState } from 'react'
import {
  Copy,
  Printer,
  RotateCcw,
  Share2,
  Sparkles,
  X,
  CheckCircle2,
} from 'lucide-react'
import { useConfigurator } from '../context/ConfiguratorContext'
import { formatTry } from '../formatMoney'
import { ROOM_ORDER, ROOM_CATEGORY_STEPS } from '../roomCategories'
import { categoryIcon } from '../utils/categoryIcon'
import { computeAllRoomAnalyses } from '../utils/roomAnalysis'

type Tab = 'products' | 'analysis' | 'budget'

// ─── Stil Skoru SVG Halka ─────────────────────────────────────────────────────

function StyleScoreRing({ score }: { score: number }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const dash = (score / 10) * circ
  return (
    <div className="relative flex size-36 items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full -rotate-90"
      >
        <circle cx="50" cy="50" r={r} fill="none" stroke="#ede9fe" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="url(#sg)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative text-center">
        <span className="block text-4xl font-bold tabular-nums text-violet-700">
          {score}
        </span>
        <span className="text-xs font-medium text-violet-500">/10</span>
      </div>
    </div>
  )
}

// ─── Sekme Düğmesi ────────────────────────────────────────────────────────────

function TabBtn({
  label,
  emoji,
  active,
  onClick,
}: {
  label: string
  emoji: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
        active
          ? 'border-rose-600 text-rose-700'
          : 'border-transparent text-stone-500 hover:text-stone-700'
      }`}
    >
      <span>{emoji}</span>
      {label}
    </button>
  )
}

// ─── SummaryModal ─────────────────────────────────────────────────────────────

export function SummaryModal() {
  const {
    summaryOpen,
    hasAnySelection,
    setSummaryOpen,
    selections,
    budget,
    spent,
    remaining,
    overBudget,
    styleScore,
    interiorStory,
    combinationCode,
    copyListFeedback,
    copyList,
    restartWizard,
    spendingBreakdown,
    sofaForHarmony,
    shareUrl,
    shareToastVisible,
    copyShareLink,
    triggerPrint,
  } = useConfigurator()

  const [activeTab, setActiveTab] = useState<Tab>('products')

  const isOpen = summaryOpen && hasAnySelection
  if (!isOpen) return null

  const roomAnalyses = computeAllRoomAnalyses(selections, sofaForHarmony, ROOM_ORDER)

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-stone-950/55 p-3 pb-24 backdrop-blur-sm sm:p-6 sm:pb-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-title"
      onClick={() => setSummaryOpen(false)}
    >
      <div
        className="relative my-4 w-full max-w-6xl rounded-3xl border border-stone-200/80 bg-gradient-to-b from-white to-stone-50 shadow-2xl shadow-stone-900/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Kapat ─────────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setSummaryOpen(false)}
          className="absolute right-4 top-4 z-10 rounded-full border border-stone-200 bg-white p-2 text-stone-600 shadow-sm transition hover:bg-stone-50"
          aria-label="Kapat"
        >
          <X className="size-5" />
        </button>

        {/* ── Başlık ────────────────────────────────────────────────────── */}
        <div className="px-6 pb-0 pt-8 sm:px-8 sm:pt-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-rose-700">
            Özet ekranı
          </p>
          <h2
            id="summary-title"
            className="mt-1.5 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl"
          >
            Çeyiz kombinasyonun hazır 🎉
          </h2>
          <p className="mt-1.5 text-sm text-stone-500">
            Toplam {formatTry(spent)} · Bütçe {formatTry(budget)} ·{' '}
            <span className={overBudget ? 'text-red-600 font-medium' : 'text-emerald-700 font-medium'}>
              Kalan {formatTry(remaining)}
            </span>
          </p>
          {combinationCode && (
            <span className="mt-2 inline-flex items-center gap-2 rounded-lg border border-rose-200/80 bg-rose-50/80 px-2.5 py-1.5 font-mono text-xs font-semibold text-rose-900">
              Kod: {combinationCode}
            </span>
          )}

          {/* ── Sekmeler ──────────────────────────────────────────────── */}
          <div className="mt-4 flex gap-0 border-b border-stone-200">
            <TabBtn
              emoji="🛋️"
              label="Ürünler"
              active={activeTab === 'products'}
              onClick={() => setActiveTab('products')}
            />
            <TabBtn
              emoji="🤖"
              label="AI Analiz"
              active={activeTab === 'analysis'}
              onClick={() => setActiveTab('analysis')}
            />
            <TabBtn
              emoji="📊"
              label="Bütçe & Paylaş"
              active={activeTab === 'budget'}
              onClick={() => setActiveTab('budget')}
            />
          </div>
        </div>

        {/* ── Sekme İçerikleri ──────────────────────────────────────────── */}
        <div className="px-4 py-6 sm:px-7">

          {/* ─ Ürünler ─────────────────────────────────────────────────── */}
          {activeTab === 'products' && (
            <div className="space-y-10 animate-fade-step">
              {ROOM_ORDER.map((room) => (
                <section key={room} aria-label={room}>
                  <h3 className="mb-4 border-b border-stone-200 pb-2 text-sm font-bold uppercase tracking-widest text-rose-800">
                    {room}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {ROOM_CATEGORY_STEPS[room].map((step) => {
                      const p = selections[room]?.[step.category]
                      const SIcon = categoryIcon(step.category)
                      return (
                        <article
                          key={`${room}-${step.category}`}
                          className={`flex flex-col overflow-hidden rounded-2xl border transition-all hover:shadow-md ${
                            p
                              ? 'border-stone-200 bg-white shadow-sm'
                              : 'border-dashed border-stone-300 bg-stone-50/80'
                          }`}
                        >
                          <div className="relative aspect-[4/3] bg-stone-100">
                            {p ? (
                              <>
                                <img
                                  src={p.imageUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 pointer-events-none rounded-t-2xl ring-1 ring-inset ring-emerald-400/25" />
                              </>
                            ) : (
                              <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs font-medium text-stone-400">
                                İsteğe bağlı
                              </div>
                            )}
                            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-stone-700 shadow">
                              <SIcon className="size-3 text-rose-600" aria-hidden />
                              {step.title}
                            </span>
                          </div>
                          <div
                            className={`flex flex-1 flex-col gap-1 p-3 text-xs ${
                              p ? 'bg-gradient-to-b from-white to-emerald-50/20' : ''
                            }`}
                          >
                            {p ? (
                              <>
                                <p className="font-semibold uppercase tracking-wide text-stone-400" style={{ fontSize: '9px' }}>
                                  {p.brand}
                                </p>
                                <p className="font-semibold leading-snug text-stone-900">
                                  {p.name}
                                </p>
                                <p className="mt-auto font-bold text-rose-700">
                                  {formatTry(p.price)}
                                </p>
                              </>
                            ) : (
                              <p className="text-stone-400">—</p>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* ─ AI Analiz ────────────────────────────────────────────────── */}
          {activeTab === 'analysis' && (
            <div className="animate-fade-step space-y-6">
              {/* Stil skoru + iç mimar yorumu */}
              <div className="flex flex-col items-center gap-6 rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/80 via-white to-stone-50 p-6 sm:flex-row sm:items-start">
                <div className="flex flex-col items-center gap-2">
                  <StyleScoreRing score={styleScore} />
                  <p className="text-center text-xs font-semibold text-violet-700">
                    AI Stil Puanı
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-violet-600 text-white">
                      <Sparkles className="size-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-stone-900">AI İç Mimar Yorumu</p>
                      <p className="text-xs text-stone-500">Seçimlerine göre otomatik üretildi</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-stone-700">
                    {interiorStory}
                  </p>
                </div>
              </div>

              {/* Oda bazlı uyum analizi */}
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-500">
                  Oda Bazlı Uyum Analizi
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {roomAnalyses.map((ra) => {
                    const harmonyPct =
                      ra.harmonyTotal > 0
                        ? Math.round((ra.harmonyCount / ra.harmonyTotal) * 100)
                        : null
                    return (
                      <div
                        key={ra.room}
                        className="rounded-xl border border-stone-200 bg-white p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold uppercase tracking-wide text-stone-700">
                            {ra.label}
                          </p>
                          <span
                            className={`text-xs font-semibold ${
                              ra.completionPct === 100
                                ? 'text-emerald-600'
                                : ra.selectedCount > 0
                                  ? 'text-amber-600'
                                  : 'text-stone-400'
                            }`}
                          >
                            {ra.selectedCount}/{ra.totalSlots} kategori
                          </span>
                        </div>
                        {/* Tamamlanma barı */}
                        <div className="mb-3 h-1.5 rounded-full bg-stone-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                            style={{ width: `${ra.completionPct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-stone-500">
                          <span>{formatTry(ra.spent)}</span>
                          {harmonyPct !== null && (
                            <span className="flex items-center gap-1 text-violet-600">
                              <span className="size-1.5 rounded-full bg-violet-400" />
                              {ra.harmonyCount}/{ra.harmonyTotal} renk uyumu
                            </span>
                          )}
                        </div>
                        {/* Renk paleti */}
                        {ra.colors.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {ra.colors.map((c, i) => (
                              <span
                                key={i}
                                className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─ Bütçe & Paylaş ───────────────────────────────────────────── */}
          {activeTab === 'budget' && (
            <div className="animate-fade-step space-y-6">
              {/* Harcama dağılımı */}
              <div className="rounded-2xl border border-stone-200/90 bg-white/90 p-5">
                <h3 className="mb-1 text-sm font-semibold text-stone-900">
                  Harcama Dağılımı
                </h3>
                <p className="mb-4 text-xs text-stone-500">
                  Her kategori, toplam bütçene göre yüzde kaç yer kaplıyor?
                </p>
                <ul className="space-y-3" aria-label="Kategori harcamaları">
                  {spendingBreakdown.map((row) => (
                    <li key={row.key}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-medium text-stone-700">{row.label}</span>
                        <span className="tabular-nums text-stone-500">
                          <span className="font-semibold text-stone-800">
                            %{row.pct.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}
                          </span>
                          {' · '}
                          {formatTry(row.amount)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${row.colorClass}`}
                          style={{ width: `${Math.min(100, row.pct)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Paylaş & PDF */}
              <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-semibold text-stone-900">
                  Paylaş & Dışa Aktar
                </h3>
                <div className="space-y-3">
                  {/* Paylaşım linki */}
                  <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-stone-700">
                        Paylaşım Linki
                      </p>
                      <p className="mt-0.5 truncate text-xs text-stone-400">
                        {shareUrl || 'Seçim yapmadan link oluşturulamaz'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={copyShareLink}
                      disabled={!shareUrl}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-stone-700 disabled:opacity-40"
                    >
                      {shareToastVisible ? (
                        <>
                          <CheckCircle2 className="size-3.5" />
                          Kopyalandı
                        </>
                      ) : (
                        <>
                          <Share2 className="size-3.5" />
                          Kopyala
                        </>
                      )}
                    </button>
                  </div>

                  {/* PDF */}
                  <button
                    type="button"
                    onClick={triggerPrint}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 py-3 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
                  >
                    <Printer className="size-4" />
                    PDF olarak indir (Yazdır)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Alt Aksiyon Çubuğu ────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 border-t border-stone-100 bg-stone-50/80 px-4 py-4 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={copyList}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
          >
            <Copy className="size-4" aria-hidden />
            {copyListFeedback ? 'Kopyalandı!' : 'Listeyi Kopyala'}
          </button>
          <button
            type="button"
            onClick={restartWizard}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-stone-800"
          >
            <RotateCcw className="size-4" aria-hidden />
            Yeniden Başla
          </button>
        </div>
      </div>
    </div>
  )
}