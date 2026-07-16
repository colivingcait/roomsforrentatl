import outreachData from "@/data/outreach.json";

export type ApplicantStatus = "registered" | "applying" | "pending" | "approved";

export interface Applicant {
  status: ApplicantStatus;
  date: string;
}

/** The manual numbers no API can provide: your own Messenger outreach + the PadSplit applicant list. */
export function getOutreachData() {
  const applicants = outreachData.padsplitApplicants.applicants as Applicant[];
  const statusCounts: Record<ApplicantStatus, number> = {
    registered: 0,
    applying: 0,
    pending: 0,
    approved: 0,
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
  };
}
