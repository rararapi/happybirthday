// src/hooks/useGiftName.ts
import { parseName } from '../lib/params'

export function useGiftName(): string {
  return parseName(window.location.search)
}
