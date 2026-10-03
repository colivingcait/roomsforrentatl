/**
 * "From" price on each metro PadSplit search. Listings are sorted by weekly
 * price and the cheapest 10% are dropped (see lib/priceCutoff.ts) so an intro
 * rate does not become the number on the card. Cached for an hour. A failed
 * fetch returns null and the card hides its price.
 */
import { startingPrice } from "./priceCutoff";

export type FilterStartingPrices = {
  instant: number | null;
  privateBath: number | null;
  roomForTwo: number | null;
  fewer: number | null;
  noFee: number | null;
  /** Unfiltered metro search, after the same cutoff. Used by the chat budget answer. */
  lowest: number | null;
};

const EMPTY: FilterStartingPrices = {
  instant: null,
  privateBath: null,
  roomForTwo: null,
  fewer: null,
  noFee: null,
  lowest: null,
};

export async function getFilterStartingPrices(): Promise<FilterStartingPrices> {
  try {
    const [instant, privateBath, roomForTwo, fewer, noFee, lowest] = await Promise.all([
      startingPrice({ move_in_time: "instant_move_in" }),
      startingPrice({ bathroom_type: "private_bathroom" }),
      startingPrice({ room_features: "allow_multiple_occupants" }),
      startingPrice({ rooms_count: "6" }),
      startingPrice({ no_move_in_fee: "true" }),
      startingPrice({}),
    ]);
    return { instant, privateBath, roomForTwo, fewer, noFee, lowest };
  } catch {
    return EMPTY;
  }
}
