// PWA 用アイコンを public/icons に書き出す。図案を変えたら `node scripts/generate-icons.mjs` で作り直す。
import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const outDir = path.join(process.cwd(), "public", "icons");
mkdirSync(outDir, { recursive: true });

// 中心から3方向に伸びるハブの図案
function svg({ radius, scale }) {
  const satellites = [-90, 30, 150].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return { x: 256 + Math.cos(rad) * 118, y: 256 + Math.sin(rad) * 118 };
  });

  const spokes = satellites
    .map((p) => `<line x1="256" y1="256" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}"/>`)
    .join("");
  const dots = satellites
    .map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="26" fill="#ffffff"/>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="${radius}" fill="#2f6f4e"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <g stroke="#ffffff" stroke-width="16" stroke-linecap="round">${spokes}</g>
    ${dots}
    <circle cx="256" cy="256" r="40" fill="#ffffff"/>
  </g>
</svg>`;
}

const standard = Buffer.from(svg({ radius: 112, scale: 1 }));
// maskable は端が切り取られるので中身を縮めて安全域に収める
const maskable = Buffer.from(svg({ radius: 0, scale: 0.72 }));

await Promise.all([
  sharp(standard).resize(192, 192).png().toFile(path.join(outDir, "icon-192.png")),
  sharp(standard).resize(512, 512).png().toFile(path.join(outDir, "icon-512.png")),
  sharp(standard).resize(180, 180).png().toFile(path.join(outDir, "apple-touch-icon.png")),
  sharp(maskable).resize(512, 512).png().toFile(path.join(outDir, "icon-maskable-512.png")),
]);

console.log("wrote icons to", outDir);
