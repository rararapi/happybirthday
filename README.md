# Happy Birthday 🎂

ろうそくを吹き消してお祝いする、3D の誕生日メッセージサイトです。
URL に名前と年齢を入れて送ると、その人のためのケーキが表示されます。

公開先: https://rararapi.github.io/happybirthday/

## 遊び方

1. ろうそくの灯りだけの暗い部屋に、ケーキが置かれています。
2. 画面を長押しすると「ふーっ」と息がかかり、手前のろうそくから順に消えていきます。「🎤 マイクで本当に吹き消す」を押せば、マイクに息を吹きかけて消すこともできます。途中でやめても、続きから吹き消せます。
3. 全部消えると少し暗転したあと部屋の明かりが点き、紙吹雪・オルゴールの Happy Birthday とともに、くま・うさぎ・ひよこが登場して拍手します。
4. 名前と年齢入りのメッセージカードが表示されます。「もう一度」でろうそくに火が戻ります。

風船はタップすると割れ、キャラクターはタップすると跳ねて鳴きます。右上のボタンでミュートできます。

## URL パラメータ

| パラメータ | 内容 | 例 |
|---|---|---|
| `name` | 名前（そのまま表示） | `?name=Taro` |
| `n_enc` / `n_cnt` | 暗号化した名前（URL から名前が直接読めないようにする） | `?n_enc=xxxx` |
| `age` | 年齢。ろうそくの本数になる（1〜200） | `?age=20` |
| `from` / `f_enc` | 送り主の名前（40文字まで）。カードに「from ○○」と表示 | `?from=Hanako` |
| `msg` / `m_enc` | カードに出す自由なメッセージ（300文字まで・改行可）。省略時は標準の文面 | `?msg=おめでとう！` |

組み合わせ例: `https://rararapi.github.io/happybirthday/?name=Taro&age=20`

暗号化した名前・送り主・メッセージや URL は [`/encrypt/`](https://rararapi.github.io/happybirthday/encrypt/) のページで作れます。
暗号化は名前を URL に平文で出さないための目くらまし程度で、鍵はソースに含まれています。

## 開発

Vite + React + TypeScript + React Three Fiber（three.js）+ Tailwind CSS で作っています。
効果音・音楽はすべて Web Audio API で合成しており、音声ファイルは使っていません。

```bash
npm install
npm run dev     # 開発サーバー（http://localhost:5173/happybirthday/）
npm run build   # 本番ビルド（dist/ に出力。encrypt/ も dist/encrypt/ にコピー）
```

`main` ブランチに push すると GitHub Actions が GitHub Pages にデプロイします。

### 主なファイル

| パス | 役割 |
|---|---|
| `src/App.tsx` | 長押し操作と演出のタイムライン |
| `src/state/blowState.ts` | 毎フレーム変わる演出値（消火の進み具合・部屋の明るさなど） |
| `src/components/Scene.tsx` | ライティング・カメラ・背景 |
| `src/components/BirthdayCake.tsx` | ケーキとろうそくの配置 |
| `src/components/Candles.tsx` | ろうそく・炎・煙（インスタンス描画で 200 本でも軽量） |
| `src/components/Characters.tsx` | 拍手するキャラクター |
| `src/audio/audioManager.ts` | 効果音・メロディの合成 |
| `src/lib/params.ts` | URL パラメータの読み取りと復号 |
| `src/audio/micBlow.ts` | マイクでの息の検出 |
| `encrypt/` | URL 作成ページ |

## ライセンス

[MIT](LICENSE)
