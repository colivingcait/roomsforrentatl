import assert from "node:assert/strict";
import test from "node:test";
import jpeg from "jpeg-js";
import { applyBedCover, scoreBedJpeg } from "../lib/bed-cover.mjs";

function solid(w, h, paint) {
  const data = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = paint(x, y);
      const i = (y * w + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return jpeg.encode({ data, width: w, height: h }, 80).data;
}

test("a bed that fills the frame outranks a bed cut off at the bottom", () => {
  const filled = solid(96, 64, (_x, y) => (y < 14 ? [236, 232, 224] : [214, 122, 48]));
  const cutoff = solid(96, 64, (_x, y) => (y < 56 ? [214, 210, 202] : [214, 122, 48]));
  assert.ok(scoreBedJpeg(filled) > 0);
  assert.ok(scoreBedJpeg(filled) > scoreBedJpeg(cutoff));
});

test("a desk with no bed cannot be a cover", () => {
  // Wall, a monitor, and a chair. No broad cloth region.
  const desk = solid(96, 64, (x, y) => {
    if (x > 40 && x < 70 && y > 16 && y < 34) return [36, 40, 44];
    if (x > 18 && x < 34 && y > 28 && y < 58) return [48, 50, 54];
    return [234, 232, 228];
  });
  const bed = solid(96, 64, (_x, y) => (y < 14 ? [236, 232, 224] : [214, 122, 48]));
  assert.ok(scoreBedJpeg(desk) <= 0);
  assert.ok(scoreBedJpeg(bed) > 0);
  assert.ok(scoreBedJpeg(bed) > scoreBedJpeg(desk));
});

test("applyBedCover moves the chosen photo to the front and keeps six", () => {
  const rooms = [
    {
      image: "https://cdn.example/0.jpg",
      photos: ["0", "1", "2", "3", "4", "5", "6", "cover"].map((n) => `https://cdn.example/${n}.jpg`),
    },
  ];
  applyBedCover(rooms, "https://cdn.example/cover.jpg");
  assert.equal(rooms[0].photos[0], "https://cdn.example/cover.jpg");
  assert.equal(rooms[0].photos.length, 6);
  assert.equal(rooms[0].image, "https://cdn.example/cover.jpg");
});
