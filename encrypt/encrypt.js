const githubHostname = 'rararapi.github.io'
const repositoryName = 'happybirthday'
const keyText = '12345678901234567890123456789012'
const ivText = '1234567890123456'

function generateURL() {
  const result = document.getElementById('encryptedURL')
  const name = document.getElementById('name').value.trim()

  if (!name) {
    result.textContent = 'Name is required.'
    return
  }

  const key = CryptoJS.enc.Utf8.parse(keyText)
  const iv = CryptoJS.enc.Utf8.parse(ivText)
  const encryptedData = CryptoJS.AES.encrypt(name, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })

  const base64Encoded = CryptoJS.enc.Base64.stringify(encryptedData.ciphertext)
  const base64UrlEncoded = base64Encoded
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  let basePath = window.location.origin
  if (window.location.hostname === githubHostname) {
    basePath += '/' + repositoryName
  }

  const url = `${basePath}/?n_enc=${base64UrlEncoded}`
  const link = document.createElement('a')
  link.href = url
  link.textContent = url

  result.replaceChildren(link)
}
