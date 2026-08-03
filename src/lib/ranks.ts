/**
 * レベルの節目と、そのときの呼び名。
 *
 * 称号もキャラクターの絵も、両方この1枚から引く。
 * 別々に持つと「称号は賢者やのに絵はせんしのまま」みたいな食い違いが出る。
 *
 * 段階を増やしたり閾値を動かしたりするときは、ここだけ触ればよい。
 * key はそのまま画像のファイル名になるので、一度決めたら変えんほうがええ。
 */
export type Rank = {
  /** この段階に入るレベル */
  from: number;
  /** 画面に出す呼び名 */
  name: string;
  /** 画像のファイル名に使う。英数字のみ */
  key: string;
};

export const RANKS: Rank[] = [
  { from: 1, name: "たびびと", key: "traveler" },
  { from: 3, name: "みならい", key: "apprentice" },
  { from: 5, name: "せんし", key: "soldier" },
  { from: 10, name: "ベテラン", key: "veteran" },
  { from: 15, name: "一人前", key: "adept" },
  { from: 20, name: "熟練者", key: "expert" },
  { from: 30, name: "達人", key: "master" },
  { from: 45, name: "賢者", key: "sage" },
  { from: 60, name: "英雄", key: "champion" },
  { from: 80, name: "伝説", key: "legend" },
  { from: 99, name: "勇者", key: "hero" },
];

/** そのレベルがどの段階か。 */
export function rankFor(level: number): Rank {
  // 上から見て最初に届いたものが今の段階
  for (let index = RANKS.length - 1; index >= 0; index -= 1) {
    if (level >= RANKS[index].from) return RANKS[index];
  }
  return RANKS[0];
}

/** 次の段階。最後まで行ってたら null。 */
export function nextRank(level: number): Rank | null {
  return RANKS.find((rank) => rank.from > level) ?? null;
}

/** 段階が変わったかどうか。レベルは上がったが姿は同じ、という場合を区別する。 */
export function rankChanged(from: number, to: number): boolean {
  return rankFor(from).key !== rankFor(to).key;
}
