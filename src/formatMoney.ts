/** Türkçe binlik ayırıcı (.) — ör. 100.000 TL */
export function formatTry(n: number): string {
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
  return `${formatted} TL`
}
