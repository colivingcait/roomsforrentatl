import assert from "node:assert/strict";
import test from "node:test";
import {
  dropPhoto,
  isStreetishPlace,
  leakReason,
  leaksInData,
  leaksInText,
  publicNeighborhood,
  roundCoord,
  sanitizeLiveHouse,
} from "../lib/listing-privacy.mjs";

test("drops other, png, and outdoor common-space photos; keeps interiors", () => {
  assert.equal(dropPhoto({ url: "https://cdn.example/a.jpg", category: "other", description: "Extra Bathroom" }), true);
  assert.equal(dropPhoto({ url: "https://cdn.example/logo.png", category: "common_space", description: null }), true);
  assert.equal(
    dropPhoto({
      url: "https://cdn.example/patio.jpg",
      category: "common_space",
      description: "Nice backyard patio with table and lights",
    }),
    true
  );
  assert.equal(
    dropPhoto({
      url: "https://cdn.example/kitchen.jpg",
      category: "common_space",
      description: "Updated kitchen with stainless appliances",
    }),
    false
  );
  assert.equal(
    dropPhoto({
      url: "https://cdn.example/laundry.jpg",
      category: "common_space",
      description: "Laundry room with a front-load washer",
    }),
    false
  );
});

test("street-like neighborhoods are rejected, hand-entered names are kept", () => {
  assert.equal(isStreetishPlace("Lake Commons CT"), true);
  assert.equal(isStreetishPlace("Meadow Lake Commons CT"), true);
  assert.equal(isStreetishPlace("12 Oaks"), true);
  assert.equal(isStreetishPlace("McAfee"), false);
  assert.equal(isStreetishPlace("Off Stephenson"), false);
  assert.equal(publicNeighborhood("Lake Commons CT", "Atlanta"), "Atlanta");
  assert.equal(publicNeighborhood("McAfee", "Atlanta"), "McAfee");
  assert.equal(publicNeighborhood("Lake Commons CT", "Lake Commons CT"), "");
});

test("coordinates round to 2 decimals", () => {
  assert.equal(roundCoord(33.7396), 33.74);
  assert.equal(roundCoord(-84.2466), -84.25);
  assert.equal(roundCoord(33.74), 33.74);
});

test("data leaks include forbidden keys, precise coordinates, house numbers, zips, and Meadow Lake Commons CT", () => {
  const sample = {
    houses: [
      {
        title: "PadSplit marketing title",
        description: "private",
        street1: "100 Meadow Lane",
        lat: 33.73961,
        neighborhood: "Meadow Lake Commons CT",
        note: "Meet at 1400 Meadow Lane",
        zipLine: "GA 30039",
        id: "35011",
      },
    ],
  };
  const hits = leaksInData(sample);
  assert.ok(hits.some((h) => h.includes("forbidden key title")));
  assert.ok(hits.some((h) => h.includes("forbidden key description")));
  assert.ok(hits.some((h) => h.includes("forbidden key street1")));
  assert.ok(hits.some((h) => h.includes("beyond 2 decimals")));
  assert.ok(hits.some((h) => h.includes("street name")));
  assert.ok(hits.some((h) => h.includes("house number")));
  assert.ok(hits.some((h) => h.includes("zip")));
  assert.equal(leakReason("35011"), null);
  assert.equal(leakReason("Driveway + street"), null);
  assert.equal(leaksInData({ id: "35011", lat: 33.74, lng: -84.25, neighborhood: "McAfee" }).length, 0);
});

test("built text flags address keys and planted streets, not a document title", () => {
  assert.ok(leaksInText('<title>Mora</title><meta name="description" content="Furnished room">').length === 0);
  assert.ok(leaksInText('{"address":{"addressLocality":"Decatur"}}').includes("forbidden address key"));
  assert.ok(leaksInText("Come by 100 Meadow Lake Ct tomorrow").includes("house number"));
  assert.ok(leaksInText("The pin is Meadow Lake Commons CT").includes("street name"));
  assert.ok(leaksInText('{"lat":33.73961}').includes("lat/lng beyond 2 decimals"));
  assert.deepEqual(leaksInText('{"lat":33.74,"lng":-84.25}'), []);
  assert.ok(leaksInText("hero image", ["100 Meadow Lake Ct"]).length === 0);
  assert.ok(leaksInText("url 100 Meadow Lake Ct", ["100 Meadow Lake Ct"]).includes("street1 blocklist"));
});

test("sanitize drops exteriors, titles, descriptions, and street neighborhoods", () => {
  const { house, removedUrls } = sanitizeLiveHouse(
    {
      title: "🏆 Top-Tier Home",
      description: "123 Secret St",
      neighborhood: "Lake Commons CT",
      city: "Snellville",
      image: "https://cdn.example/cover.png",
      url: "https://www.padsplit.com/rooms-for-rent/listing/30251",
      roomsAvailable: 1,
      fromPrice: 180,
      rooms: [
        {
          id: 1,
          status: 1,
          name: "Room 1",
          description: "Window faces 100 Meadow Lane",
          image: "https://cdn.example/room.png",
          photos: ["https://cdn.example/room.png", "https://cdn.example/room.jpg"],
          weeklyRate: 180,
        },
      ],
      commonAreas: [
        { url: "https://cdn.example/kitchen.jpg", category: "common_space", description: "Updated kitchen" },
        { url: "https://cdn.example/patio.jpg", category: "common_space", description: "Backyard patio" },
        { url: "https://cdn.example/other.jpg", category: "other", description: "Front of house" },
      ],
      carousel: [{ url: "https://cdn.example/patio.jpg", category: "common_space", description: "Backyard patio" }],
    },
    "Atlanta"
  );
  assert.equal(house.neighborhood, "Atlanta");
  assert.equal(house.title, undefined);
  assert.equal(house.description, undefined);
  assert.equal(house.image, undefined);
  assert.equal(house.street1, undefined);
  assert.deepEqual(
    house.commonAreas.map((p) => p.url),
    ["https://cdn.example/kitchen.jpg"]
  );
  assert.equal(house.commonAreas[0].label, "Kitchen");
  assert.equal(house.commonAreas[0].description, undefined);
  assert.equal(house.rooms[0].description, undefined);
  assert.deepEqual(house.rooms[0].photos, ["https://cdn.example/room.jpg"]);
  assert.ok(removedUrls.includes("https://cdn.example/patio.jpg"));
  assert.equal(leaksInData(house).length, 0);
});
