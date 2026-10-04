/**
 * Writes public/favicon.ico for the market this process is building.
 * next.config.js loads this before `next build`, including on Vercel, where
 * the production command is `next build` rather than `npm run build`.
 */
const fs = require("fs");
const path = require("path");

const COLORS = {
  sa: { bg: [14, 124, 102], accent: [244, 196, 48] },
  atl: { bg: [14, 124, 102], accent: [255, 107, 53] },
  dfw: { bg: [29, 78, 137], accent: [244, 196, 48] },
};

function ico16(bg, accent) {
  const size = 16;
  const xorSize = size * size * 4;
  const andSize = size * 4;
  const imageSize = 40 + xorSize + andSize;
  const buf = Buffer.alloc(6 + 16 + imageSize);
  buf.writeUInt16LE(0, 0);
  buf.writeUInt16LE(1, 2);
  buf.writeUInt16LE(1, 4);
  buf.writeUInt8(size, 6);
  buf.writeUInt8(size, 7);
  buf.writeUInt16LE(1, 10);
  buf.writeUInt16LE(32, 12);
  buf.writeUInt32LE(imageSize, 14);
  buf.writeUInt32LE(22, 18);
  buf.writeUInt32LE(40, 22);
  buf.writeInt32LE(size, 26);
  buf.writeInt32LE(size * 2, 30);
  buf.writeUInt16LE(1, 34);
  buf.writeUInt16LE(32, 36);
  buf.writeUInt32LE(xorSize + andSize, 42);
  const pixels = 62;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const top = size - 1 - y;
      const mark = top >= 4 && top <= 11 && x >= 4 && x <= 11 && (x <= 6 || top <= 6 || top >= 9);
      const [r, g, b] = mark ? accent : bg;
      const o = pixels + (y * size + x) * 4;
      buf[o] = b;
      buf[o + 1] = g;
      buf[o + 2] = r;
      buf[o + 3] = 255;
    }
  }
  return buf;
}

function writeFavicon(market) {
  const colors = COLORS[market] || COLORS.atl;
  const file = path.join(process.cwd(), "public", "favicon.ico");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, ico16(colors.bg, colors.accent));
}

module.exports = { writeFavicon };
