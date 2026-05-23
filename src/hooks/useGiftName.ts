// src/hooks/useGiftName.ts
import CryptoJS from 'crypto-js'

const KEY = '12345678901234567890123456789012'
const IV  = '1234567890123456'

function decryptName(enc: string): string {
  try {
    const key = CryptoJS.enc.Utf8.parse(KEY)
    const iv  = CryptoJS.enc.Utf8.parse(IV)
    const base64 = enc.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '')
    const ciphertext = CryptoJS.enc.Base64.parse(base64)
    const decrypted = CryptoJS.AES.decrypt({ ciphertext } as Parameters<typeof CryptoJS.AES.decrypt>[0], key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch {
    return ''
  }
}

export function useGiftName(): string {
  const params = new URLSearchParams(window.location.search)
  const name = params.get('name')
  if (name) return name.trim()
  const nEnc = params.get('n_enc') ?? params.get('n_cnt')
  if (nEnc) return decryptName(nEnc)
  return ''
}
