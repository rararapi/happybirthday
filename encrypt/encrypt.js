const githubHostname = 'rararapi.github.io'
const repositoryName = 'happybirthday'
const keyText = '12345678901234567890123456789012'
const ivText = '1234567890123456'

const MIN_AGE = 1
const MAX_AGE = 200

function encryptNameValue(name) {
  const key = CryptoJS.enc.Utf8.parse(keyText)
  const iv = CryptoJS.enc.Utf8.parse(ivText)
  const encryptedData = CryptoJS.AES.encrypt(name, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })

  return CryptoJS.enc.Base64.stringify(encryptedData.ciphertext)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function basePath() {
  let base = window.location.origin
  if (window.location.hostname === githubHostname) {
    base += '/' + repositoryName
  }
  return base
}

function showError(message) {
  const error = document.getElementById('errorMessage')
  error.textContent = message
  error.hidden = false
  document.getElementById('resultBox').classList.remove('visible')
}

function generateURL() {
  const error = document.getElementById('errorMessage')
  error.hidden = true

  const name = document.getElementById('name').value.trim()
  const ageRaw = document.getElementById('age').value.trim()
  const encrypt = document.getElementById('encryptName').checked

  const params = new URLSearchParams()

  if (name) {
    if (encrypt) {
      params.set('n_enc', encryptNameValue(name))
    } else {
      params.set('name', name)
    }
  }

  if (ageRaw) {
    const age = Number(ageRaw)
    if (!Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE) {
      showError(`年齢は ${MIN_AGE}〜${MAX_AGE} の整数で入力してください。`)
      return
    }
    params.set('age', String(age))
  }

  const query = params.toString()
  const url = `${basePath()}/${query ? '?' + query : ''}`

  const link = document.getElementById('resultLink')
  link.href = url
  link.textContent = url
  document.getElementById('openLink').href = url

  const copyButton = document.getElementById('copyButton')
  copyButton.textContent = 'コピー'

  document.getElementById('resultBox').classList.add('visible')
}

async function copyURL() {
  const url = document.getElementById('resultLink').href
  const copyButton = document.getElementById('copyButton')
  try {
    await navigator.clipboard.writeText(url)
    copyButton.textContent = 'コピーしました ✓'
  } catch {
    copyButton.textContent = 'コピーできませんでした'
  }
}
