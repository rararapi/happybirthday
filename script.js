// 復号化関数
function decryptName(encryptedValue) {
  // 復号に使用する鍵とIV
  var key = CryptoJS.enc.Utf8.parse('12345678901234567890123456789012'); // 32バイト（256ビット）の鍵
  var iv = CryptoJS.enc.Utf8.parse('1234567890123456'); // 16バイト（128ビット）のIV

  // Base64URLデコード
  var base64Decoded = encryptedValue.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
  var ciphertext = CryptoJS.enc.Base64.parse(base64Decoded);

  // 復号
  var decryptedData = CryptoJS.AES.decrypt({ ciphertext: ciphertext }, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });

  // バイトデータから文字列に変換
  var decryptedText = decryptedData.toString(CryptoJS.enc.Utf8);
  
  return decryptedText;
}

function getNameFromURL() {
  // URLからクエリパラメータを取得
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name");
  if (name) {
    return name.toUpperCase();
  }
  const n_enc = params.get("n_enc");
  if (n_enc) {
    return decryptName(n_enc);
  }
  return ""
}

// ページが読み込まれたときに名前をセット
document.addEventListener("DOMContentLoaded", function () {
  const name = getNameFromURL();
  if (name) {
    document.getElementById("name").textContent = name;
  }
  startConfetti();
});
