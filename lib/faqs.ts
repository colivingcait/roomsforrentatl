import faqData from "@/data/faq.json";
import { PADSPLIT_PRIVATE_BATH_SEARCH_URL } from "./site";

export type SiteFaq = {
  q: string;
  a: string;
  category?: string;
  variants?: string[];
  link?: { label: string; url: string };
};

const PRIVATE_BATH_QUESTION = "Do rooms have private bathrooms?";

/**
 * FAQs for the "Have a question?" popup and the chat assistant.
 * The private-bath answer's link always comes from PADSPLIT_PRIVATE_BATH_SEARCH_URL.
 */
export function getFaqs(): SiteFaq[] {
  return (faqData.faqs as SiteFaq[]).map((faq) => {
    if (faq.q !== PRIVATE_BATH_QUESTION) return faq;
    return {
      ...faq,
      link: {
        label: "See private-bath rooms on PadSplit",
        url: PADSPLIT_PRIVATE_BATH_SEARCH_URL,
      },
    };
  });
}
