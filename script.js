function getNameFromURL() {
    // URLからクエリパラメータを取得
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    return name ? name.toUpperCase() : ''; // 名前を大文字に変換
}

// ページが読み込まれたときに名前をセット
document.addEventListener('DOMContentLoaded', function () {
    const name = getNameFromURL();
    if (name) {
        document.getElementById('name').textContent = name;
    }
    startConfetti();
});
