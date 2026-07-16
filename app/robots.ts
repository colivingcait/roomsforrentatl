import type { MetadataRoute } from "next";
import { getBrand } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/internal/" },
    sitemap: `${getBrand().url}/sitemap.xml`,
  };
}
