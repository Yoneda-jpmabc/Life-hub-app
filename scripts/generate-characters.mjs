// レベルごとのキャラクターの絵を、表示に使う大きさに整えて public/characters に書き出す。
//
// 使い方:
//   1. art/characters/ に元の絵を置く (例: lv05-soldier.png)
//   2. node scripts/generate-characters.mjs
//
// ファイル名は src/lib/ranks.ts の from と key から決まる。
// 名前が合ってない絵は使われないので、下の一覧をそのまま写すのが確実。
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

// ranks.ts と同じ並び。ここを直すときは向こうも一緒に直す
const RANKS = [
  { from: 1, key: "traveler" },
  { from: 3, key: "apprentice" },
  { from: 5, key: "soldier" },
  { from: 10, key: "veteran" },
  { from: 15, key: "adept" },
  { from: 20, key: "expert" },
  { from: 30, key: "master" },
  { from: 45, key: "sage" },
  { from: 60, key: "champion" },
  { from: 80, key: "legend" },
  { from: 99, key: "hero" },
];

// character.tsx の CHARACTER_SIZES と同じ。小さいほうは常時表示、大きいほうは演出用
const SIZES = [96, 320];

const srcDir = path.join(process.cwd(), "art", "characters");
const outDir = path.join(process.cwd(), "public", "characters");

if (!existsSync(srcDir)) {
  console.error(`元の絵を置く ${path.relative(process.cwd(), srcDir)} が無い。`);
  console.error("この名前で置いてください:");
  for (const rank of RANKS) {
    console.error(`  lv${String(rank.from).padStart(2, "0")}-${rank.key}.png`);
  }
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const found = new Set(readdirSync(srcDir));
let wrote = 0;
const missing = [];

for (const rank of RANKS) {
  const base = `lv${String(rank.from).padStart(2, "0")}-${rank.key}`;
  const source = [`${base}.png`, `${base}.webp`, `${base}.jpg`].find((name) => found.has(name));

  if (!source) {
    missing.push(base);
    continue;
  }

  for (const size of SIZES) {
    await sharp(path.join(srcDir, source))
      // 縦横比は保ったまま、正方形の透明な余白に収める。
      // 絵ごとに縦横比が違っても、並べたときに大きさが揃う。
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(outDir, `${base}-${size}.png`));
    wrote += 1;
  }
}

console.log(`wrote ${wrote} files to ${path.relative(process.cwd(), outDir)}`);
if (missing.length > 0) {
  // 揃ってなくても画面は影で埋まるので、止めずに知らせるだけにする
  console.log(`まだ絵が無い段階 (画面では影になる): ${missing.join(", ")}`);
}
