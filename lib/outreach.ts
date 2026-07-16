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

export interface Applicant {
  status: ApplicantStatus;
  date: string;
}

const PAYOUT_PER_PAID = 250;

/** The manual numbers no API can provide: your own Messenger outreach + the PadSplit applicant list. */
export function getOutreachData() {
  const applicants = outreachData.padsplitApplicants.applicants as Applicant[];
  const statusCounts: Record<ApplicantStatus, number> = {
    registered: 0,
    applying: 0,
    pending: 0,
    approved: 0,
    move_in: 0,
    booking_fee_waived: 0,
    paid: 0,
  };
  for (const a of applicants) statusCounts[a.status]++;

  return {
    messengerConversationCount: outreachData.messenger.conversationCount,
    messengerConversationsSince: outreachData.messenger.conversationsSince,
    messengerLastUpdated: outreachData.messenger.lastUpdated,
    applicants,
    applicantCount: applicants.length,
    statusCounts,
    applicantsLastUpdated: outreachData.padsplitApplicants.lastUpdated,
    cashPayout: statusCounts.paid * PAYOUT_PER_PAID,
    payoutPerPaid: PAYOUT_PER_PAID,
  };
}
