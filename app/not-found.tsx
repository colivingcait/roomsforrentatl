import Link from "next/link";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-ink">That room isn’t available</h1>
        <p className="mt-2 text-muted">
          It may have just been booked. Plenty more open right now.
        </p>
        <Link href="/" className="btn-book mt-6">
          See available rooms →
        </Link>
      </div>
    </main>
  );
}
