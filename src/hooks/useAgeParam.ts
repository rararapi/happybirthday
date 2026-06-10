const MAX_AGE = 30

// ?age= パラメータからろうそく本数用の年齢を取得（1〜30の整数のみ有効）
export function useAgeParam(): number | null {
  const params = new URLSearchParams(window.location.search)
  const raw = params.get('age')
  if (!raw) return null

  const age = Number(raw)
  if (!Number.isInteger(age) || age < 1 || age > MAX_AGE) return null
  return age
}
