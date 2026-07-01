import Link from "next/link";
import FaqButton from "./FaqButton";
import { getBrand } from "@/lib/brand";

export default function Header() {
  const brand = getBrand();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-white">
            {brand.word[0]}
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink">
            {brand.word}
            <span className="text-brand">For</span>Rent<span className="text-accent">ATL</span>
          </span>
        </Link>
        <FaqButton className="text-sm font-semibold text-brand" />
      </div>
    </header>
  );
}
