function encryptName() {
  // 入力された名前を取得
  var name = document.getElementById("name").value;
  
  // 鍵と初期化ベクトル（IV）
  var key = CryptoJS.enc.Utf8.parse('12345678901234567890123456789012'); // 32バイト（256ビット）の鍵
  var iv = CryptoJS.enc.Utf8.parse('1234567890123456'); // 16バイト（128ビット）のIV

  // 名前を暗号化
  var encryptedData = CryptoJS.AES.encrypt(name, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
  
  // Base64エンコード
  var base64Encoded = CryptoJS.enc.Base64.stringify(encryptedData.ciphertext);
  
  // Base64URLエンコード
  var base64UrlEncoded = base64Encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  
  // 暗号化された名前を表示
  document.getElementById("encryptedName").textContent = base64UrlEncoded;
}
