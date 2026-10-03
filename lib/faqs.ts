import faqData from "@/data/faq.json";
import { getMarket } from "./market";
import {
  doubleOccupancySearchUrl,
  instantBookingSearchUrl,
  MAIN_REFERRAL_CODE,
  noMoveInFeeSearchUrl,
  privateBathSearchUrl,
  site,
} from "./site";

export type SiteFaq = {
  q: string;
  a: string;
  category?: string;
  variants?: string[];
  link?: { label: string; url: string };
};

export const PHONE_ANSWER = site.phone
  ? `You can call us at ${site.phone}. That number is for calls only — we can't text.`
  : "We don't publish a phone number. Ask in this chat and I'll help.";

export const SCREENING_ANSWER =
  "You'll need income of at least 2x the rent, no felony convictions in the last 7 years, and no more than 1 eviction in the last 7 years. I can't say how a specific application will turn out, but if you apply and are declined, your application fee is refunded.";

export const PETS_ANSWER = "Our homes don't allow pets. Service animals are allowed.";

export const MORE_THAN_ONE_ANSWER =
  "If you're looking for a room for more than one person, here's the link for that. Some hosts charge an additional fee for a second person.";

/**
 * FAQs for the popup and the chat assistant.
 * Search links are built for `code` (main site unless the caller passes the covilla code).
 */
export function getFaqs(
  code: string = MAIN_REFERRAL_CODE,
  instantStart?: number | null,
  noFeeStart?: number | null
): SiteFaq[] {
  return (faqData.faqs as SiteFaq[]).map((faq) => {
    if (faq.q === "Can I book instantly?") {
      const start =
        instantStart != null && Number.isFinite(instantStart)
          ? ` Instant-book rooms start at $${Math.round(instantStart)}/wk.`
          : "";
      return {
        ...faq,
        a: `Yes. Apply and lock in your room today. No waiting on host approval.${start}`,
        link: { label: "See instant-book rooms on PadSplit", url: instantBookingSearchUrl(code) },
      };
    }
    if (faq.q === "Can I find a room with no move-in fee?") {
      const start =
        noFeeStart != null && Number.isFinite(noFeeStart)
          ? ` Rooms in that search start at $${Math.round(noFeeStart)}/wk.`
          : "";
      return {
        ...faq,
        a: `${faq.a}${start}`,
        link: { label: "See rooms with no move-in fee on PadSplit", url: noMoveInFeeSearchUrl(code) },
      };
    }
    if (faq.q === "Do rooms have private bathrooms?") {
      return {
        ...faq,
        link: { label: "See private-bath rooms on PadSplit", url: privateBathSearchUrl(code) },
      };
    }
    if (faq.q === "Can two people share a room?") {
      return {
        ...faq,
        a: MORE_THAN_ONE_ANSWER,
        link: { label: "See double-occupancy rooms on PadSplit", url: doubleOccupancySearchUrl(code) },
      };
    }
    if (faq.q === "Are animals allowed?") {
      // Dallas–Fort Worth keeps the market FAQ. It must not claim "our homes".
      if (getMarket().id === "dfw") return faq;
      return { ...faq, a: PETS_ANSWER, link: undefined };
    }
    if (faq.q === "What do I need to get approved?") {
      return { ...faq, a: SCREENING_ANSWER };
    }
    if (faq.q === "Can I call you?") {
      return { ...faq, a: PHONE_ANSWER };
    }
    return faq;
  });
}
