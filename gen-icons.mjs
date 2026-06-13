// 의존성 없는 PNG 아이콘 생성기 — 메이크타임 ⚓
// 깊은 바다 그라데이션 + 크림색 닻. 4x 슈퍼샘플링으로 안티앨리어싱.
// 실행: node gen-icons.mjs  → icon-512/192, apple-touch-icon(180), maskable-512 생성
import zlib from "node:zlib";
import { writeFileSync } from "node:fs";

const C1 = [58, 51, 143];   // #3A338F  깊은 보라
const C2 = [21, 18, 74];    // #15124A  심해
const INK = [255, 223, 176]; // #FFDFB0 크림 골드 (닻)

// ---- 기하 멤버십 (단위 좌표 0..1, y는 아래로) ----
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return dist(px, py, ax + t * dx, ay + t * dy);
}
function inTri(px, py, ax, ay, bx, by, cx, cy) {
  const s = (ax - cx) * (py - cy) - (ay - cy) * (px - cx);
  const t = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  if ((s < 0) !== (t < 0) && s !== 0 && t !== 0) return false;
  const d = (cx - bx) * (py - by) - (cy - by) * (px - bx);
  return d === 0 || (d < 0) === (s + t <= 0);
}

const W = 0.05;       // 획 두께
const CX = 0.5;
function anchor(x, y) {
  // 고리 (상단 원)
  const ringD = dist(x, y, CX, 0.23);
  if (ringD <= 0.105 && ringD >= 0.105 - W) return true;
  // 샤프트 (세로 기둥)
  if (segDist(x, y, CX, 0.20, CX, 0.79) <= W / 2) return true;
  // 스톡 (가로 막대)
  if (segDist(x, y, 0.305, 0.35, 0.695, 0.35) <= W / 2) return true;
  // 아래 호 (양팔을 잇는 미소)
  const ad = dist(x, y, CX, 0.50);
  if (y > 0.55 && ad <= 0.255 + W / 2 && ad >= 0.255 - W / 2 && x > 0.27 && x < 0.73) return true;
  // 플루크 (양 끝 갈고리)
  if (inTri(x, y, 0.705, 0.585, 0.705, 0.70, 0.815, 0.605)) return true; // 오른쪽
  if (inTri(x, y, 0.295, 0.585, 0.295, 0.70, 0.185, 0.605)) return true; // 왼쪽
  return false;
}

function renderRGBA(size) {
  const SS = 4; // 슈퍼샘플
  const buf = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const ux = (px + (sx + 0.5) / SS) / size;
          const uy = (py + (sy + 0.5) / SS) / size;
          const t = (ux + uy) / 2;            // 대각 그라데이션
          let cr = C1[0] + (C2[0] - C1[0]) * t;
          let cg = C1[1] + (C2[1] - C1[1]) * t;
          let cb = C1[2] + (C2[2] - C1[2]) * t;
          if (anchor(ux, uy)) { cr = INK[0]; cg = INK[1]; cb = INK[2]; }
          r += cr; g += cg; b += cb;
        }
      }
      const n = SS * SS;
      const i = (py * size + px) * 4;
      buf[i] = Math.round(r / n);
      buf[i + 1] = Math.round(g / n);
      buf[i + 2] = Math.round(b / n);
      buf[i + 3] = 255;
    }
  }
  return buf;
}

function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0, 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  // 스캔라인 (필터 0)
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

const here = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
for (const size of [512, 192, 180]) {
  const png = encodePNG(size, renderRGBA(size));
  const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
  writeFileSync(here + name, png);
  console.log("wrote", name, png.length, "bytes");
}
