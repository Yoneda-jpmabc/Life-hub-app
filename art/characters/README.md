# キャラクターの絵

ここに元の絵を置いて `node scripts/generate-characters.mjs` を叩くと、
表示に使う大きさに整えて `public/characters/` に書き出される。

## ファイル名

段階は `src/lib/ranks.ts` で決まっていて、名前はそこから引かれる。

| 置くファイル | いつの姿 |
| --- | --- |
| `lv01-traveler.png` | たびびと (Lv.1〜) |
| `lv03-apprentice.png` | みならい (Lv.3〜) |
| `lv05-soldier.png` | せんし (Lv.5〜) |
| `lv10-veteran.png` | ベテラン (Lv.10〜) |
| `lv15-adept.png` | 一人前 (Lv.15〜) |
| `lv20-expert.png` | 熟練者 (Lv.20〜) |
| `lv30-master.png` | 達人 (Lv.30〜) |
| `lv45-sage.png` | 賢者 (Lv.45〜) |
| `lv60-champion.png` | 英雄 (Lv.60〜) |
| `lv80-legend.png` | 伝説 (Lv.80〜) |
| `lv99-hero.png` | 勇者 (Lv.99) |

`.png` / `.webp` / `.jpg` を見る。透過したいなら png。

## 絵について

- **320px 四方より大きめ**で作っておくと、書き出しで縮むぶん綺麗に出る
- **縦横比は自由**。正方形の透明な余白に収めて揃えるので、縦長でも横長でもよい
- 明るい背景と暗い背景の両方に乗るので、**背景は透過**にして、
  輪郭が背景色に溶けやすい絵は避けたほうが無難

## 全部揃ってなくてもよい

無い段階は影のシルエットで表示される。1枚ずつ足していける。

## 大きさを変えたいとき

`scripts/generate-characters.mjs` の `SIZES` と
`src/components/character.tsx` の `CHARACTER_SIZES` を揃えて直す。
