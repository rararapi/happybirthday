import { parseAge } from '../lib/params'

// ?age= パラメータからろうそく本数用の年齢を取得（1〜200の整数のみ有効）
export function useAgeParam(): number | null {
  return parseAge(window.location.search)
}
