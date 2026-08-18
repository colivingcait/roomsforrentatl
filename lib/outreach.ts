import outreachData from "@/data/outreach.json";

/**
 * The full PadSplit referral pipeline, in order:
 *   registered -> applying -> approved (screened) -> move_in (booked a room) ->
 *   then ONE of:
 *     booking_fee_waived - moved into YOUR room (the goal: instant fee waiver)
 *     pending            - moved into ANOTHER host's room; PadSplit shows this
 *                          while the 14-day reward-confirmation clock runs
 *     paid               - the 14 days passed, other host's room, $250 payout confirmed
 * "Pending" only ever means the reward-confirmation wait AFTER move-in — PadSplit
 * doesn't use it for an earlier "application under review" state.
 *
 * "not_eligible" is a terminal rejection — PadSplit or the host screening turned
 * them down. It's an off-ramp, not a pipeline step, so it's excluded from the
 * funnel's forward-progress math (approvedOrBeyond/movedIn) but still counted.
 */
export type ApplicantStatus =
  | "registered"
  | "applying"
  | "approved"
  | "move_in"
  | "pending"
  | "booking_fee_waived"
  | "paid"
  | "not_eligible";

export interface StatusEvent {
  status: ApplicantStatus;
  /** The day we noticed this status — not necessarily the day it actually happened (PadSplit doesn't expose that). */
  observedOn: string;
  /**
   * Only present when observedOn is an ESTIMATE, not PadSplit's literal displayed
   * date — e.g. PadSplit sometimes shows an implausible old date (2023/2024) for a
   * person whose neighbors in the same list are all recent. When that happens,
   * estimate the real date from the surrounding entries and record the original
   * bogus date here. If a future paste shows that same bogus date again for this
   * person, it's the known issue, not a new anomaly — don't re-derive it.
   */
  note?: string;
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
    approved: 0,
    move_in: 0,
    pending: 0,
    booking_fee_waived: 0,
    paid: 0,
    not_eligible: 0,
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
