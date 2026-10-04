import { notFound } from "next/navigation";

/** Whole-home rentals exist only on the Atlanta homes domain. */
export default function RentalsUnavailable() {
  notFound();
}
