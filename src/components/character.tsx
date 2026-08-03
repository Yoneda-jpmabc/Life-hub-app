"use client";

import { useState } from "react";

import type { Rank } from "@/lib/ranks";

/**
 * 段階ごとのキャラクター。
 *
 * 絵は public/characters/ に置いたファイルをそのまま出すだけにしてある。
 * 差し替えたいときはファイルを置き換えればよく、ここは触らんでええ。
 * まだ絵を用意してない段階は、影だけの仮の姿に落ちる。
 *
 * next/image を使わず素の img にしてあるのは、この画面が CDN から
 * そのまま返る静的なページやから。最適化を挟むと往復が1つ増える。
 */

/** 用意する2種類。小さいほうは常時表示、大きいほうは演出と一覧で使う。 */
export const CHARACTER_SIZES = { small: 96, large: 320 } as const;

export type CharacterSize = keyof typeof CHARACTER_SIZES;

export function characterSrc(rank: Rank, size: CharacterSize): string {
  return `/characters/lv${String(rank.from).padStart(2, "0")}-${rank.key}-${CHARACTER_SIZES[size]}.png`;
}

export function Character({
  rank,
  size,
  /** 表示する箱の一辺(px)。絵の解像度とは別で、置き場所に合わせて決める */
  box,
  /** まだ届いてない段階は影だけにする */
  locked = false,
  className = "",
}: {
  rank: Rank;
  size: CharacterSize;
  box: number;
  locked?: boolean;
  className?: string;
}) {
  const [missing, setMissing] = useState(false);

  // 絵が無い段階でも画面が崩れんように、同じ大きさの影を出す
  if (missing || locked) {
    return (
      <span
        aria-hidden={locked ? undefined : true}
        role={locked ? "img" : undefined}
        aria-label={locked ? `${rank.name}(まだ)` : undefined}
        style={{ width: box, height: box }}
        className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-background ${className}`}
      >
        <Silhouette box={box} dim={locked} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- 静的配信のまま出したいので最適化を挟まない
    <img
      src={characterSrc(rank, size)}
      alt={rank.name}
      width={box}
      height={box}
      // 大きさを先に決めておかないと、絵が届いた瞬間に周りがずれる
      style={{ width: box, height: box }}
      loading={size === "large" ? "lazy" : "eager"}
      decoding="async"
      onError={() => setMissing(true)}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}

/** 絵が無いときの仮の姿。頭と体だけの影。 */
function Silhouette({ box, dim }: { box: number; dim: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={box * 0.6}
      height={box * 0.6}
      aria-hidden="true"
      className={dim ? "text-muted/30" : "text-muted/60"}
      fill="currentColor"
    >
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M12 12.5c-3.6 0-6.5 2.4-6.5 5.4V20h13v-2.1c0-3-2.9-5.4-6.5-5.4Z" />
    </svg>
  );
}
