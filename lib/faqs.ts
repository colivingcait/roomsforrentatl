import faqData from "@/data/faq.json";
import { PADSPLIT_DOUBLE_OCCUPANCY_SEARCH_URL, PADSPLIT_PRIVATE_BATH_SEARCH_URL } from "./site";

export type SiteFaq = {
  q: string;
  a: string;
  category?: string;
  variants?: string[];
  link?: { label: string; url: string };
};

/** FAQ answers whose outbound link must stay on the named PadSplit search constants. */
const LINK_BY_QUESTION: Record<string, { label: string; url: string }> = {
  "Do rooms have private bathrooms?": {
    label: "See private-bath rooms on PadSplit",
    url: PADSPLIT_PRIVATE_BATH_SEARCH_URL,
  },
  "Can two people share a room?": {
    label: "See double-occupancy rooms on PadSplit",
    url: PADSPLIT_DOUBLE_OCCUPANCY_SEARCH_URL,
  },
};

/**
 * FAQs for the "Have a question?" popup and the chat assistant.
 * Private-bath and double-occupancy links always come from the site constants.
 */
export function getFaqs(): SiteFaq[] {
  return (faqData.faqs as SiteFaq[]).map((faq) => {
    const link = LINK_BY_QUESTION[faq.q];
    if (!link) return faq;
    return { ...faq, link };
  });
}
