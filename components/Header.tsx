import Link from "next/link";
import { site } from "@/lib/site";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-white">
            R
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink">
            Rooms<span className="text-brand">For</span>Rent<span className="text-accent">ATL</span>
          </span>
        </Link>
        <a href={site.phoneHref} className="text-sm font-semibold text-brand">
          Call / Text
        </a>
      </div>
    </header>
  );
}
