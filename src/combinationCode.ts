const ALPHANUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateCombinationCode(): string {
  let suffix = ''
  for (let i = 0; i < 5; i += 1) {
    suffix += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)]
  }
  return `#CHYZ${suffix}`
}
