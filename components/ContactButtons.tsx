import { site } from "@/lib/site";

/**
 * Contact CTA: primary "Text us" opens a pre-filled SMS; a "Call" option sits
 * directly underneath. Both route to the assistant line (NEXT_PUBLIC_PHONE).
 */
export default function ContactButtons({ label = "Need a room today? Text us" }: { label?: string }) {
  return (
    <div className="w-full">
      <a href={site.smsHref} className="btn-book w-full">
        💬 {label}
      </a>
      <a
        href={site.phoneHref}
        className="mt-1.5 flex items-center justify-center gap-1 py-1 text-sm font-semibold text-brand"
      >
        or Call {site.phone}
      </a>
    </div>
  );
}
