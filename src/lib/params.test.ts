import CryptoJS from 'crypto-js'
import { describe, expect, it } from 'vitest'
import { decryptValue, parseAge, parseFrom, parseMessage, parseName } from './params'

// encrypt/encrypt.js の encryptNameValue と同じ手順で暗号化する
function encrypt(text: string): string {
  const key = CryptoJS.enc.Utf8.parse('12345678901234567890123456789012')
  const iv = CryptoJS.enc.Utf8.parse('1234567890123456')
  const encrypted = CryptoJS.AES.encrypt(text, key, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 })
  return CryptoJS.enc.Base64.stringify(encrypted.ciphertext).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

const q = (params: Record<string, string>) => '?' + new URLSearchParams(params).toString()

describe('decryptValue', () => {
  it('URL セーフな Base64 を復号できる', () => {
    expect(decryptValue(encrypt('さくら 🌸'))).toBe('さくら 🌸')
  })

  it('壊れた値は空文字になる', () => {
    expect(decryptValue('not-a-valid-value')).toBe('')
  })
})

describe('parseName', () => {
  it('平文の name を優先し、前後の空白を除く', () => {
    expect(parseName(q({ name: '  Taro ', n_enc: encrypt('Hanako') }))).toBe('Taro')
  })

  it('n_enc と n_cnt を復号する', () => {
    expect(parseName(q({ n_enc: encrypt('Hanako') }))).toBe('Hanako')
    expect(parseName(q({ n_cnt: encrypt('Jiro') }))).toBe('Jiro')
  })

  it('未指定なら空文字', () => {
    expect(parseName('')).toBe('')
  })
})

describe('parseAge', () => {
  it('1〜200 の整数だけを受け付ける', () => {
    expect(parseAge('?age=1')).toBe(1)
    expect(parseAge('?age=200')).toBe(200)
    expect(parseAge('?age=0')).toBeNull()
    expect(parseAge('?age=201')).toBeNull()
    expect(parseAge('?age=3.5')).toBeNull()
    expect(parseAge('?age=abc')).toBeNull()
    expect(parseAge('')).toBeNull()
  })
})

describe('parseFrom', () => {
  it('平文と暗号化の両方を読み、40 文字で切る', () => {
    expect(parseFrom(q({ from: 'パパとママ' }))).toBe('パパとママ')
    expect(parseFrom(q({ f_enc: encrypt('おばあちゃん') }))).toBe('おばあちゃん')
    expect(Array.from(parseFrom(q({ from: 'あ'.repeat(50) })))).toHaveLength(40)
  })
})

describe('parseMessage', () => {
  it('改行を保ったまま読む', () => {
    expect(parseMessage(q({ msg: 'いつもありがとう。\n素敵な一年を！' }))).toBe('いつもありがとう。\n素敵な一年を！')
    expect(parseMessage(q({ m_enc: encrypt('おめでとう') }))).toBe('おめでとう')
  })

  it('絵文字を途中で切らずに 300 文字で切る', () => {
    const result = parseMessage(q({ msg: '🎂'.repeat(310) }))
    expect(Array.from(result)).toHaveLength(300)
    expect(result).toBe('🎂'.repeat(300))
  })
})
