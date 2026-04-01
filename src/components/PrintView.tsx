/**
 * PrintView — Yazdırma (PDF) için gizli belge.
 * Ekranda gizlidir (display:none). @media print kuralı ile görünür hale gelir.
 * Tüm odaları (Perde dahil), AI analizini ve harcama özetini kapsar.
 */
import { useConfigurator } from '../context/ConfiguratorContext'
import { ROOM_ORDER, ROOM_CATEGORY_STEPS } from '../roomCategories'
import { formatTry } from '../formatMoney'

export function PrintView() {
  const {
    selections,
    budget,
    spent,
    remaining,
    styleScore,
    interiorStory,
    combinationCode,
    spendingBreakdown,
    overBudget,
  } = useConfigurator()

  const today = new Date().toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    /* hidden on screen, shown only @media print via .ceyiz-print-view class */
    <div className="ceyiz-print-view hidden">
      {/* ── Başlık ───────────────────────────────────────────────────────── */}
      <div className="ceyiz-print-header">
        <div>
          <div style={{ fontSize: '16pt', fontWeight: 700, color: '#be123c' }}>
            🏠 Çeyiz Robotu
          </div>
          <div style={{ fontSize: '10pt', color: '#78716c', marginTop: '2pt' }}>
            AI Destekli Çeyiz Konfigüratörü
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '9pt', color: '#78716c' }}>
          <div>{today}</div>
          {combinationCode && (
            <div style={{ marginTop: '4pt', fontWeight: 600, color: '#1c1917' }}>
              Kod: {combinationCode}
            </div>
          )}
        </div>
      </div>

      {/* ── Bütçe Özeti ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '16pt',
          marginBottom: '20pt',
          padding: '10pt 14pt',
          background: '#fff1f2',
          borderRadius: '6pt',
          border: '1px solid #fecdd3',
        }}
      >
        {[
          { label: 'Toplam Bütçe', value: formatTry(budget) },
          { label: 'Harcama', value: formatTry(spent) },
          {
            label: 'Kalan',
            value: formatTry(remaining),
            color: overBudget ? '#dc2626' : '#15803d',
          },
          { label: 'Stil Puanı', value: `${styleScore}/10` },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ fontSize: '7pt', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#78716c' }}>
              {label}
            </div>
            <div style={{ fontSize: '13pt', fontWeight: 700, color: color ?? '#1c1917', marginTop: '2pt' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Ürünler — Oda Bazlı ──────────────────────────────────────────── */}
      {ROOM_ORDER.map((room) => {
        const steps = ROOM_CATEGORY_STEPS[room]
        const hasAny = steps.some((s) => selections[room]?.[s.category])
        return (
          <div key={room} className="ceyiz-print-section">
            <div className="ceyiz-print-room-header">{room}</div>
            <div className="ceyiz-print-grid">
              {steps.map((step) => {
                const p = selections[room]?.[step.category] ?? null
                return (
                  <div key={step.category}>
                    {p ? (
                      <div className="ceyiz-print-card">
                        <img src={p.imageUrl} alt="" />
                        <div className="ceyiz-print-card-body">
                          <div className="ceyiz-print-card-brand">{p.brand}</div>
                          <div className="ceyiz-print-card-name">{p.name}</div>
                          <div className="ceyiz-print-card-price">
                            {formatTry(p.price)}
                          </div>
                          <div className="ceyiz-print-card-meta">
                            {step.title} · {p.style} · {p.color.split('(')[0]?.trim()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="ceyiz-print-card ceyiz-print-card-empty"
                        style={{ minHeight: '80pt' }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '8pt', color: '#a8a29e' }}>
                            {step.title}
                          </div>
                          <div style={{ fontSize: '7pt', color: '#c7c3be', marginTop: '2pt' }}>
                            Seçilmedi
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {hasAny && (
              <div
                style={{
                  textAlign: 'right',
                  fontSize: '9pt',
                  fontWeight: 600,
                  color: '#78716c',
                  marginTop: '4pt',
                }}
              >
                {room} toplamı:{' '}
                {formatTry(
                  steps.reduce(
                    (s, step) => s + (selections[room]?.[step.category]?.price ?? 0),
                    0,
                  ),
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* ── Harcama Dağılımı ─────────────────────────────────────────────── */}
      <div className="ceyiz-print-section">
        <div className="ceyiz-print-room-header">Harcama Dağılımı</div>
        {spendingBreakdown
          .filter((r) => r.amount > 0)
          .map((row) => (
            <div key={row.key} className="ceyiz-print-summary-row">
              <span>{row.label}</span>
              <span>
                %
                {row.pct.toLocaleString('tr-TR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 1,
                })}{' '}
                · {formatTry(row.amount)}
              </span>
            </div>
          ))}
      </div>

      {/* ── AI İç Mimar Yorumu ───────────────────────────────────────────── */}
      <div className="ceyiz-print-ai-section">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10pt',
            marginBottom: '8pt',
          }}
        >
          <span style={{ fontSize: '18pt' }}>🤖</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '11pt', color: '#6d28d9' }}>
              AI İç Mimar Yorumu
            </div>
            <div style={{ fontSize: '8pt', color: '#8b5cf6' }}>
              Stil Puanı: {styleScore}/10
            </div>
          </div>
        </div>
        <p style={{ fontSize: '10pt', lineHeight: 1.6, color: '#374151' }}>
          {interiorStory}
        </p>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="ceyiz-print-footer">
        <span>Çeyiz Robotu — AI Destekli Ev Dizme Asistanı</span>
        <span>
          {combinationCode ? `Kombinasyon: ${combinationCode}` : today}
        </span>
      </div>
    </div>
  )
}
