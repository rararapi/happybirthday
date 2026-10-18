import CryptoJS from 'crypto-js'

// URL パラメータの読み取り。テストしやすいよう search 文字列を受け取る純粋関数にしている

// 名前を URL に平文で出さないための目くらまし（鍵は encrypt/encrypt.js と共通）
const KEY = '12345678901234567890123456789012'
const IV  = '1234567890123456'

const MAX_AGE = 200
const MAX_FROM_LENGTH = 40
const MAX_MESSAGE_LENGTH = 300

export function decryptValue(enc: string): string {
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

// 平文パラメータを優先し、なければ暗号化パラメータを復号する
function readText(params: URLSearchParams, plain: string, encrypted: string[]): string {
  const value = params.get(plain)
  if (value) return value.trim()
  for (const key of encrypted) {
    const enc = params.get(key)
    if (enc) return decryptValue(enc).trim()
  }
  return ''
}

// 絵文字などのサロゲートペアを途中で切らないよう、コードポイント単位で切り詰める
function truncate(text: string, max: number): string {
  const chars = Array.from(text)
  return chars.length > max ? chars.slice(0, max).join('') : text
}

/** ?name= / ?n_enc= / ?n_cnt= */
export function parseName(search: string): string {
  return readText(new URLSearchParams(search), 'name', ['n_enc', 'n_cnt'])
}

/** ?age= （1〜200 の整数のみ有効） */
export function parseAge(search: string): number | null {
  const raw = new URLSearchParams(search).get('age')
  if (!raw) return null
  const age = Number(raw)
  if (!Number.isInteger(age) || age < 1 || age > MAX_AGE) return null
  return age
}

/** ?from= / ?f_enc= 送り主の名前 */
export function parseFrom(search: string): string {
  return truncate(readText(new URLSearchParams(search), 'from', ['f_enc']), MAX_FROM_LENGTH)
}

/** ?msg= / ?m_enc= 自由なメッセージ（改行可） */
export function parseMessage(search: string): string {
  return truncate(readText(new URLSearchParams(search), 'msg', ['m_enc']), MAX_MESSAGE_LENGTH)
}
