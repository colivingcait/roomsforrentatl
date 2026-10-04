/**
 * Pick the bedroom photo where the bed fills the frame.
 *
 * PadSplit already labels room photos as bedrooms. This ranks those URLs.
 * A close, made bed scores higher than a doorway shot where the bed is only
 * a strip at the bottom. Used when a listing is scraped. The page itself
 * does not download photos; it shows the cover chosen here.
 */
import jpeg from "jpeg-js";
import { PNG } from "pngjs";

const OUT_W = 96;
const OUT_H = 64;
const GRAY_W = 80;
const GRAY_H = 54;

function resizeRGB(src, sw, sh, dw, dh) {
  const out = new Uint8Array(dw * dh * 3);
  for (let y = 0; y < dh; y++) {
    const fy = ((y + 0.5) * sh) / dh - 0.5;
    const y0 = Math.max(0, Math.floor(fy));
    const y1 = Math.min(sh - 1, y0 + 1);
    const ty = Math.min(1, Math.max(0, fy - y0));
    for (let x = 0; x < dw; x++) {
      const fx = ((x + 0.5) * sw) / dw - 0.5;
      const x0 = Math.max(0, Math.floor(fx));
      const x1 = Math.min(sw - 1, x0 + 1);
      const tx = Math.min(1, Math.max(0, fx - x0));
      const at = (xx, yy) => {
        const i = (yy * sw + xx) * 4;
        return [src[i], src[i + 1], src[i + 2]];
      };
      const a = at(x0, y0);
      const b = at(x1, y0);
      const c = at(x0, y1);
      const d = at(x1, y1);
      const o = (y * dw + x) * 3;
      for (let k = 0; k < 3; k++) {
        out[o + k] = (a[k] * (1 - tx) + b[k] * tx) * (1 - ty) + (c[k] * (1 - tx) + d[k] * tx) * ty;
      }
    }
  }
  return out;
}

function region(rgb, w, h, x0, x1, y0, y1, pred) {
  let n = 0;
  let s = 0;
  const xa = Math.floor(w * x0);
  const xb = Math.floor(w * x1);
  const ya = Math.floor(h * y0);
  const yb = Math.floor(h * y1);
  for (let y = ya; y < yb; y++) {
    for (let x = xa; x < xb; x++) {
      n += 1;
      if (pred(y * w + x)) s += 1;
    }
  }
  return s / Math.max(n, 1);
}

function decodeImage(buffer) {
  if (buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    const png = PNG.sync.read(buffer);
    return { data: png.data, width: png.width, height: png.height };
  }
  return jpeg.decode(buffer, { useTArray: true, formatAsRGBA: true });
}

/** Higher means the bed occupies more of the frame. `buffer` is a JPEG or PNG. */
export function scoreBedJpeg(buffer) {
  const decoded = decodeImage(buffer);
  const rgb = resizeRGB(decoded.data, decoded.width, decoded.height, OUT_W, OUT_H);
  const w = OUT_W;
  const h = OUT_H;
  const grad = new Float64Array(w * h);
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const i = (y * w + x) * 3;
      const right = i + 3;
      const down = i + w * 3;
      grad[y * w + x] =
        Math.abs(rgb[i] - rgb[right]) +
        Math.abs(rgb[i + 1] - rgb[right + 1]) +
        Math.abs(rgb[i + 2] - rgb[right + 2]) +
        Math.abs(rgb[i] - rgb[down]) +
        Math.abs(rgb[i + 1] - rgb[down + 1]) +
        Math.abs(rgb[i + 2] - rgb[down + 2]);
    }
  }
  const fabric = (i) => {
    const o = i * 3;
    const lum = (rgb[o] + rgb[o + 1] + rgb[o + 2]) / 3;
    return grad[i] < 110 && lum > 35 && lum < 250;
  };
  const fill = region(rgb, w, h, 0.08, 0.92, 0.18, 0.96, fabric);
  const upper = region(rgb, w, h, 0.15, 0.85, 0.15, 0.55, fabric);
  const lower = region(rgb, w, h, 0.1, 0.9, 0.5, 0.98, fabric);
  const doorEdges = region(rgb, w, h, 0.2, 0.8, 0, 0.45, (i) => grad[i] > 100);

  const gray = resizeRGB(decoded.data, decoded.width, decoded.height, GRAY_W, GRAY_H);
  const runs = [];
  for (let x = 1; x < GRAY_W - 1; x++) {
    let run = 0;
    let best = 0;
    for (let y = 0; y < GRAY_H; y++) {
      const i = (y * GRAY_W + x) * 3;
      const lum = (gray[i] + gray[i + 1] + gray[i + 2]) / 3;
      const next = i + 3;
      const lum2 = (gray[next] + gray[next + 1] + gray[next + 2]) / 3;
      if (Math.abs(lum - lum2) > 35) {
        run += 1;
        if (run > best) best = run;
      } else {
        run = 0;
      }
    }
    runs.push(best / GRAY_H);
  }
  runs.sort((a, b) => b - a);
  const doorLines = runs.slice(0, 4).filter((v) => v > 0.72).length;

  let colorN = 0;
  for (let i = 0; i < w * h; i++) {
    const o = i * 3;
    const r = rgb[o];
    const g = rgb[o + 1];
    const b = rgb[o + 2];
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const sat = mx ? (mx - mn) / mx : 0;
    const lum = (r + g + b) / 3;
    if (sat > 0.18 && lum > 40 && lum < 230) colorN += 1;
  }
  const color = colorN / (w * h);
  let score = fill * 1.3 + upper * 2.0 + lower * 0.6 + Math.min(color, 0.45) * 1.6 - doorEdges * 1.4 - doorLines * 0.55;
  if (upper < 0.22) score *= 0.45;
  if (doorLines >= 3) score *= 0.55;
  return score;
}

/** Move `url` to the front of the room that has it, then keep six photos. */
export function applyBedCover(rooms, url) {
  for (const room of rooms || []) {
    for (const key of ["photos", "pictures"]) {
      const list = room?.[key];
      if (!Array.isArray(list) || !url) continue;
      const idx = list.findIndex((item) => (typeof item === "string" ? item : item?.url) === url);
      if (idx > 0) {
        const [hit] = list.splice(idx, 1);
        list.unshift(hit);
      }
      if (idx >= 0) {
        const first = list[0];
        room.image = typeof first === "string" ? first : first?.url || room.image;
      }
    }
    if (Array.isArray(room?.photos)) room.photos = room.photos.slice(0, 6);
  }
}

/**
 * Highest-scoring reachable JPEG, or null when none decode.
 * `urls` should already be bedroom photos.
 */
export async function pickBedCover(urls) {
  const seen = new Set();
  let best = null;
  let bestScore = -Infinity;
  for (const url of urls || []) {
    if (!url || seen.has(url) || !/^https:\/\//.test(url)) continue;
    seen.add(url);
    if (seen.size > 48) break;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) continue;
      const score = scoreBedJpeg(Buffer.from(await res.arrayBuffer()));
      if (score > bestScore) {
        bestScore = score;
        best = url;
      }
    } catch {
      // A missing or non-JPEG photo is skipped. Another bedroom can still lead.
    }
  }
  return best;
}
