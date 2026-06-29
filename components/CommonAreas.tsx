import Image from "next/image";
import type { Photo } from "@/lib/types";
import { photoLabel } from "@/lib/format";

/** Horizontal, swipeable gallery of the house's shared spaces. */
export default function CommonAreas({ photos }: { photos: Photo[] }) {
  if (!photos.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-ink">Common areas</h2>
      <p className="text-sm text-muted">Shared spaces you’ll enjoy in this home.</p>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {photos.map((p, i) => (
          <figure key={i} className="w-64 shrink-0">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
              <Image src={p.url} alt={photoLabel(p)} fill sizes="256px" className="object-cover" />
            </div>
            <figcaption className="mt-1.5 text-sm font-medium text-ink">{photoLabel(p)}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
