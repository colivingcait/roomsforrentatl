/**
 * Featured rooms for a market that has no host list yet.
 * Same cutoff as the "from" prices: sort the metro search by weekly price,
 * drop the cheapest 10%, then take the next four that have a public place and
 * an interior photo. An explicit featuredSources list replaces this entirely.
 */
import { bookingUrl } from "./site";
import { getMarket } from "./market";
import { applyPriceCutoff, rankedListings } from "./priceCutoff";

/** Show 4 when we can. Fewer than 3 hides the section. */
const TARGET = 4;
const MIN = 3;

export type AutoFeaturedRoom = {
  id: string;
  label: string;
  place: string;
  price: number;
  photo: string;
  href: string;
};

export async function getAutoFeaturedRooms(): Promise<AutoFeaturedRoom[]> {
  if (getMarket().featuredSources.length > 0) return [];

  const ranked = await rankedListings({});
  if (!ranked) return [];

  const rooms: AutoFeaturedRoom[] = [];
  for (const row of applyPriceCutoff(ranked)) {
    if (!row.place || !row.photo) continue;
    rooms.push({
      id: row.id,
      label: "Furnished room",
      place: row.place,
      price: row.price,
      photo: row.photo,
      href: bookingUrl(`https://www.padsplit.com/rooms-for-rent/listing/${row.id}`),
    });
    if (rooms.length >= TARGET) break;
  }

  if (rooms.length < MIN) return [];
  return rooms;
}
