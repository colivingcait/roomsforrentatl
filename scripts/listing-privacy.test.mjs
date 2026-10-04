import assert from "node:assert/strict";
import test from "node:test";
import {
  communityLeak,
  dropPhoto,
  isStreetishPlace,
  leakReason,
  leaksInData,
  leaksInText,
  galleryOrder,
  publicNeighborhood,
  publicPhoto,
  roundCoord,
  sanitizeLiveHouse,
  unitFilenameLeak,
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
  assert.equal(house.city, undefined);
  assert.equal(house.title, undefined);
  assert.equal(house.description, undefined);
  assert.equal(house.image, "https://cdn.example/room.jpg");
  assert.equal(house.street1, undefined);
  assert.deepEqual(
    house.commonAreas.map((p) => p.url),
    ["https://cdn.example/kitchen.jpg"]
  );
  assert.equal(house.commonAreas[0].label, "Kitchen");
  assert.equal(house.commonAreas[0].description, undefined);
  assert.equal(house.rooms[0].description, undefined);
  assert.deepEqual(house.rooms[0].photos, [
    "https://cdn.example/room.png",
    "https://cdn.example/room.jpg",
  ]);
  assert.ok(removedUrls.includes("https://cdn.example/patio.jpg"));
  assert.equal(leaksInData(house).length, 0);
});

test("a generic Common area label takes the caption, and photos sort kitchen, bedroom, bath, then other commons", () => {
  const relabeled = publicPhoto({
    url: "https://cdn.example/k.jpg",
    category: "common_space",
    label: "Common area",
    description: "kitchen",
  });
  assert.equal(relabeled.label, "Kitchen");
  assert.equal(relabeled.description, undefined);

  const { house } = sanitizeLiveHouse(
    {
      rooms: [{ id: 1, status: 1, photos: ["https://cdn.example/bed.jpg"], weeklyRate: 100 }],
      commonAreas: [
        { url: "https://cdn.example/dining.jpg", category: "common_space", description: "Dining room" },
        { url: "https://cdn.example/bath.jpg", category: "bathroom", description: "Shared bath" },
        { url: "https://cdn.example/bed-common.jpg", category: "bedroom", description: "Bedroom" },
        { url: "https://cdn.example/kitchen.jpg", category: "common_space", label: "Common area", description: "Open kitchen" },
        { url: "https://cdn.example/living.jpg", category: "common_space", description: "Living room" },
      ],
    },
    "San Antonio"
  );
  assert.deepEqual(
    house.commonAreas.map((p) => p.label),
    ["Kitchen", "Bedroom", "Bathroom", "Dining room", "Living room"]
  );
  assert.equal(house.image, "https://cdn.example/bed.jpg");
  assert.equal(house.commonAreas.some((p) => "description" in p), false);
});

test("the gallery leads with the bed cover, then kitchen, other bedrooms, bath, and commons", () => {
  const urls = galleryOrder({
    image: "https://cdn.example/bed-cover.jpg",
    rooms: [
      { available: true, photos: ["https://cdn.example/bed-open.jpg"] },
      { available: false, photos: ["https://cdn.example/bed-taken.jpg"] },
    ],
    commonAreas: [
      { url: "https://cdn.example/dining.jpg", label: "Dining room" },
      { url: "https://cdn.example/bath.jpg", label: "Bathroom" },
      { url: "https://cdn.example/bed-cover.jpg", label: "Bedroom" },
      { url: "https://cdn.example/kitchen.jpg", label: "Kitchen" },
      { url: "https://cdn.example/living.jpg", label: "Living room" },
    ],
  });
  assert.deepEqual(urls, [
    "https://cdn.example/bed-cover.jpg",
    "https://cdn.example/kitchen.jpg",
    "https://cdn.example/bed-open.jpg",
    "https://cdn.example/bed-taken.jpg",
    "https://cdn.example/bath.jpg",
    "https://cdn.example/dining.jpg",
    "https://cdn.example/living.jpg",
  ]);
});

test("named communities and drone or exterior filenames fail the data scan", () => {
  assert.equal(communityLeak("in the Norris Lake community", ["Norris"]), "named community");
  assert.equal(communityLeak("Snellville area", ["Norris"]), null);
  assert.equal(unitFilenameLeak("/units/lake-house-2br/DJI_20260706154721_0179.JPG"), "drone filename");
  assert.equal(unitFilenameLeak("/units/foo/aerial-lake.jpg"), "exterior or aerial filename");
  assert.equal(unitFilenameLeak("/units/studio-snellville/DB12D671-6FAE-430C-89D4-8B521F7A1BE9_1_105_c.jpeg"), null);
  assert.equal(unitFilenameLeak("no exterior, aerial, or drone shots in the copy"), null);
  const hits = leaksInData(
    {
      summary: "Bright unit in the Norris Lake community",
      photos: ["/units/x/DJI_0001.JPG", "/units/x/exterior-front.jpg"],
    },
    "$",
    ["Norris"]
  );
  assert.ok(hits.some((h) => h.includes("named community")));
  assert.ok(hits.some((h) => h.includes("drone filename")));
  assert.ok(hits.some((h) => h.includes("exterior or aerial filename")));
  assert.ok(leaksInText("Welcome to Norris Lake", [], ["Norris"]).includes("named community"));
  assert.ok(leaksInText('<img src="/units/x/DJI_0001.JPG">', [], ["Norris"]).includes("drone filename"));
  assert.deepEqual(leaksInText("Studio in the Snellville area", [], ["Norris"]), []);
});
