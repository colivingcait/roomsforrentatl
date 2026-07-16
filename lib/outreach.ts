import outreachData from "@/data/outreach.json";

/**
 * The full PadSplit referral pipeline, in order:
 *   registered/applying/pending -> approved (screened) -> move_in (booked a room) ->
 *   then ONE of:
 *     booking_fee_waived - moved into YOUR room (the goal: instant fee waiver)
 *     paid               - moved into another host's room, stayed 14+ days ($250 payout)
 */
export type ApplicantStatus =
  | "registered"
  | "applying"
  | "pending"
  | "approved"
  | "move_in"
  | "booking_fee_waived"
  | "paid";

export interface StatusEvent {
  status: ApplicantStatus;
  /** The day we noticed this status — not necessarily the day it actually happened (PadSplit doesn't expose that). */
  observedOn: string;
}

export interface ApplicantPerson {
  name: string;
  history: StatusEvent[];
}

const PAYOUT_PER_PAID = 250;

/** The manual applicant pipeline no API can provide — PadSplit has no export/API for this. */
export function getOutreachData() {
  const people = outreachData.padsplitApplicants.people as ApplicantPerson[];
  const statusCounts: Record<ApplicantStatus, number> = {
    registered: 0,
    applying: 0,
    pending: 0,
    approved: 0,
    move_in: 0,
    booking_fee_waived: 0,
    paid: 0,
  };
  for (const person of people) {
    const current = person.history[person.history.length - 1]?.status;
    if (current) statusCounts[current]++;
  }

  return {
    people,
    applicantCount: people.length,
    statusCounts,
    applicantsLastUpdated: outreachData.padsplitApplicants.lastUpdated,
    cashPayout: statusCounts.paid * PAYOUT_PER_PAID,
    payoutPerPaid: PAYOUT_PER_PAID,
  };
}
