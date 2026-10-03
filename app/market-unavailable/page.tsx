import { notFound } from "next/navigation";

/** Atlanta-only paths are rewritten here on a Dallas–Fort Worth build. */
export default function MarketUnavailable() {
  notFound();
}
