export type DemoView = "portal" | "volunteer";

export type PortalPage =
  | "overview"
  | "submissions"
  | "intake"
  | "documents"
  | "team";

export type SubmissionStatus =
  | "Submitted"
  | "Changes requested"
  | "Approved"
  | "Ready to download"
  | "Declined";

export type Submission = {
  id: string;
  name: string;
  initials: string;
  submitted: string;
  serviceDates: string;
  hours: string;
  status: SubmissionStatus;
  warning?: string;
};

export const initialSubmissions: Submission[] = [
  {
    id: "SF-24018",
    name: "Maya Johnson",
    initials: "MJ",
    submitted: "Today, 9:42 AM",
    serviceDates: "Sep 2–27, 2026",
    hours: "18 hours",
    status: "Submitted",
    warning: "Monthly total needs review",
  },
  {
    id: "SF-24017",
    name: "Elena Morales",
    initials: "EM",
    submitted: "Yesterday, 3:18 PM",
    serviceDates: "Sep 8–25, 2026",
    hours: "24 hours",
    status: "Submitted",
  },
  {
    id: "SF-24016",
    name: "Andre Williams",
    initials: "AW",
    submitted: "Sep 29, 11:06 AM",
    serviceDates: "Sep 1–24, 2026",
    hours: "16 hours",
    status: "Changes requested",
  },
  {
    id: "SF-24015",
    name: "Priya Shah",
    initials: "PS",
    submitted: "Sep 28, 4:31 PM",
    serviceDates: "Aug 12–Sep 23, 2026",
    hours: "32 hours",
    status: "Approved",
  },
  {
    id: "SF-24014",
    name: "Marcus Green",
    initials: "MG",
    submitted: "Sep 27, 10:02 AM",
    serviceDates: "Sep 3–21, 2026",
    hours: "20 hours",
    status: "Ready to download",
  },
];

export const statusStyles: Record<SubmissionStatus, string> = {
  Submitted: "border-[#B9CFD9] bg-[#E9F3F7] text-[#23536A]",
  "Changes requested": "border-[#E6C997] bg-[#FFF5DF] text-[#85551D]",
  Approved: "border-[#BAD1C1] bg-[#EDF6EF] text-[#315F43]",
  "Ready to download": "border-[#9FC7B0] bg-[#DFF1E6] text-[#255A3B]",
  Declined: "border-[#E4B6B3] bg-[#FFF0EF] text-[#8A3732]",
};
