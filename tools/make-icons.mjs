// Generates the app icons (gold "75" mark on near-black) as PNGs.
// Pure Node — no dependencies. Run: node tools/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Distance from point (px,py) to segment (ax,ay)-(bx,by), unit coordinates.
function sdSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay;
  const wx = px - ax, wy = py - ay;
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy || 1)));
  const dx = wx - t * vx, dy = wy - t * vy;
  return Math.hypot(dx, dy);
}

// The "75" mark drawn as round-capped strokes.
const STROKE_W = 0.062;
const SEVEN = [
  [0.155, 0.330, 0.435, 0.330],
  [0.428, 0.348, 0.272, 0.688],
];
const FIVE = [
  [0.548, 0.330, 0.815, 0.330],
  [0.556, 0.338, 0.556, 0.502],
  [0.556, 0.502, 0.726, 0.502],
  [0.726, 0.502, 0.782, 0.540],
  [0.782, 0.540, 0.782, 0.632],
  [0.782, 0.632, 0.748, 0.678],
  [0.748, 0.678, 0.562, 0.678],
];
const MARK = [...SEVEN, ...FIVE];

const RING_R = 0.442;
const RING_W = 0.014;

function lerp(a, b, t) { return a + (b - a) * t; }

// Champagne-cream vertical gradient for the mark.
function gold(v) {
  const t = Math.max(0, Math.min(1, (v - 0.24) / 0.52));
  return [
    lerp(0xf2, 0xd2, t),
    lerp(0xe9, 0xb5, t),
    lerp(0xd2, 0x7e, t),
  ];
}

function render(size) {
  const SS = 3;
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (x + (sx + 0.5) / SS) / size;
          const v = (y + (sy + 0.5) / SS) / size;
          const dc = Math.hypot(u - 0.5, v - 0.42);
          const t = Math.min(1, dc / 0.72);
          let pr = lerp(0x17, 0x0b, t);
          let pg = lerp(0x54, 0x30, t);
          let pb = lerp(0x3d, 0x24, t);

          const aa = 1 / size;
          const [gr, gg, gb] = gold(v);

          const ringD = Math.abs(Math.hypot(u - 0.5, v - 0.5) - RING_R) - RING_W / 2;
          const ringCov = Math.max(0, Math.min(1, -ringD / aa + 0.5)) * 0.55;
          pr = lerp(pr, gr, ringCov); pg = lerp(pg, gg, ringCov); pb = lerp(pb, gb, ringCov);

          let d = Infinity;
          for (const [ax, ay, bx, by] of MARK) {
            d = Math.min(d, sdSegment(u, v, ax, ay, bx, by));
          }
          const markCov = Math.max(0, Math.min(1, -(d - STROKE_W / 2) / aa + 0.5));
          pr = lerp(pr, gr, markCov); pg = lerp(pg, gg, markCov); pb = lerp(pb, gb, markCov);

          r += pr; g += pg; b += pb;
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      rgba[i] = Math.round(r / n);
      rgba[i + 1] = Math.round(g / n);
      rgba[i + 2] = Math.round(b / n);
      rgba[i + 3] = 255;
    }
  }
  return encodePNG(size, size, rgba);
}

mkdirSync(new URL('../icons/', import.meta.url), { recursive: true });
for (const size of [64, 180, 192, 512]) {
  const out = new URL(`../icons/icon-${size}.png`, import.meta.url);
  writeFileSync(out, render(size));
  console.log(`icons/icon-${size}.png`);
}
