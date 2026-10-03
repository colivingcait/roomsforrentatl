import { getMarket } from "@/lib/market";
import { citySearchUrl } from "@/lib/site";
import TrackedOutboundLink from "@/components/TrackedOutboundLink";

/** City shortcuts. Rendered only when this market turns the list on. */
export default function CityList() {
  const cities = getMarket().cities;
  if (!cities.length) return null;
  return (
    <section className="border-t border-[#F1F5F9] bg-white">
      <div className="mx-auto max-w-[1080px] px-[18px] py-6 md:px-6">
        <h2 className="text-sm font-extrabold text-ink">Browse by city</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {cities.map((city) => (
            <li key={city.slug}>
              <TrackedOutboundLink
                href={citySearchUrl(city.slug)}
                event="city_search_click"
                properties={{ city: city.slug, source: "homepage" }}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-ink"
              >
                {city.name}
              </TrackedOutboundLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
