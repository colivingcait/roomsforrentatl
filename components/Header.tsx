import Link from "next/link";
import FaqButton from "./FaqButton";
import { getBrand } from "@/lib/brand";
import { getMarket } from "@/lib/market";

export default function Header({ wide = false }: { wide?: boolean }) {
  const brand = getBrand();
  return (
    <header className="sticky top-0 z-30 border-b border-[#F1F5F9] bg-white/[0.92] backdrop-blur-[10px]">
      <div
        className={
          "mx-auto flex items-center justify-between " +
          (wide ? "h-14 max-w-[1080px] px-[18px] md:px-6" : "max-w-3xl px-4 py-3")
        }
      >
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-white">
            {brand.word[0]}
          </span>
          <span className="text-lg font-extrabold tracking-[-0.01em] text-ink">
            {brand.word}
            <span className="text-brand">For</span>Rent<span className="text-accent">{getMarket().mark}</span>
          </span>
        </Link>
        <FaqButton className="text-sm font-semibold text-brand" startTab={wide ? "chat" : "faq"} />
      </div>
    </header>
  );
}
