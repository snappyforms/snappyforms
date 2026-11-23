"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardCheck,
  Copy,
  Download,
  FileCheck2,
  FileText,
  Home,
  Inbox,
  Link2,
  Menu,
  MoreHorizontal,
  PenLine,
  QrCode,
  Search,
  Share2,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { BrandMark, DemoSwitcher, QrPreview, StatusBadge } from "./DemoShared";
import {
  DemoView,
  PortalPage,
  Submission,
  SubmissionStatus,
} from "./demoData";

const navItems = [
  { page: "overview" as const, label: "Overview", icon: Home },
  { page: "submissions" as const, label: "Submissions", icon: Inbox },
  { page: "intake" as const, label: "Intake link", icon: QrCode },
  { page: "documents" as const, label: "Documents", icon: FileText },
  { page: "team" as const, label: "Team", icon: Users },
];

type PortalProps = {
  view: DemoView;
  setView: (view: DemoView) => void;
  submissions: Submission[];
  setSubmissions: (items: Submission[]) => void;
};

function Sidebar({
  page,
  setPage,
  open,
  close,
}: {
  page: PortalPage;
  setPage: (page: PortalPage) => void;
  open: boolean;
  close: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <button
        aria-label="Close navigation"
        className="fixed bottom-0 left-0 right-0 top-10 z-30 bg-[#162A2B]/35"
        onClick={close}
        type="button"
      />
      <aside
        className="fixed bottom-0 left-0 top-10 z-40 flex w-[278px] max-w-[88vw] flex-col border-r border-[#d7dee6] bg-[#f4f6f9] shadow-[10px_0_36px_rgba(22,42,43,0.14)]"
      >
        <div className="flex items-center justify-between px-5 pb-6 pt-5">
          <BrandMark />
          <button
            aria-label="Close navigation"
            className="rounded-md p-1.5 text-[#506379] hover:bg-[#e5eaef]"
            onClick={close}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mx-3 mb-6 rounded-xl border border-[#d3dbe4] bg-white p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d8e2ed] text-xs font-bold text-[#274669]">
              NC
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#162A2B]">
                Northside Community
              </p>
              <p className="text-[11px] text-[#607791]">Administrator</p>
            </div>
            <ChevronDown className="h-4 w-4 text-[#607791]" />
          </div>
        </div>
        <nav aria-label="Portal navigation" className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  page === item.page
                    ? "bg-[#d9e2ed] text-[#1c3857]"
                    : "text-[#46586c] hover:bg-[#e7ecf1]"
                }`}
                key={item.page}
                onClick={() => {
                  setPage(item.page);
                  close();
                }}
                type="button"
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
                {item.page === "submissions" && (
                  <span className="ml-auto rounded-full bg-[#275D7A] px-2 py-0.5 text-[10px] font-bold text-white">
                    3
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-[#d7dee6] p-3">
          <button
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#46586c] hover:bg-[#e7ecf1]"
            type="button"
          >
            <Settings className="h-[18px] w-[18px]" /> Settings
          </button>
          <div className="mt-2 flex items-center gap-3 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dfe5ec] text-[11px] font-bold">
              RO
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">Renee Okafor</p>
              <p className="truncate text-[10px] text-[#667c96]">
                renee@northside.org
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({
  openMenu,
  openShare,
  view,
  setView,
}: {
  openMenu: () => void;
  openShare: () => void;
  view: DemoView;
  setView: (view: DemoView) => void;
}) {
  return (
    <header className="flex min-h-[68px] flex-wrap items-center gap-3 border-b border-[#dde3e9] bg-white px-4 py-3 sm:flex-nowrap sm:px-7">
      <div className="flex flex-1 items-center gap-3">
        <button
          aria-label="Open navigation"
          className="rounded-lg border border-[#d7dee6] p-2 text-[#39495b] hover:bg-[#f0f3f7] focus:outline-none focus:ring-2 focus:ring-[#275D7A] focus:ring-offset-2"
          onClick={openMenu}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="sm:hidden"><BrandMark compact /></div>
        <div className="hidden sm:block"><BrandMark /></div>
      </div>
      <button
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#c4cfdc] bg-white px-3 py-2 text-xs font-semibold text-[#2b435f] hover:bg-[#f2f4f7] focus:outline-none focus:ring-2 focus:ring-[#275D7A] focus:ring-offset-2"
        onClick={openShare}
        type="button"
      >
        <Share2 className="h-3.5 w-3.5" /> Share link
      </button>
      <div className="hidden sm:block">
        <DemoSwitcher setView={setView} view={view} />
      </div>
      <div className="w-full sm:hidden">
        <DemoSwitcher setView={setView} view={view} />
      </div>
    </header>
  );
}

function ShareModal({ close }: { close: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close share dialog"
        className="absolute inset-0 bg-[#162A2B]/45"
        onClick={close}
        type="button"
      />
      <section
        aria-labelledby="share-dialog-title"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-[0_24px_80px_rgba(22,42,43,0.24)]"
        role="dialog"
      >
        <button
          aria-label="Close share dialog"
          className="absolute right-4 top-4 rounded-md p-1.5 text-[#566a81] hover:bg-[#eff2f5]"
          onClick={close}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-xl font-bold tracking-[-0.03em]" id="share-dialog-title">
          Share the volunteer form
        </h2>
        <p className="mt-2 text-xs leading-5 text-[#5d7289]">
          Northside Community Resource Center
        </p>
        <div className="mx-auto mt-5 w-fit rounded-xl border border-[#dce2e9] bg-white p-2">
          <QrPreview size={176} />
        </div>
        <p className="mt-4 break-all rounded-lg bg-[#f0f3f7] px-3 py-2 text-[11px] text-[#50647a]">
          snappyforms.org/apply/northside-pa1938
        </p>
        <button
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#275D7A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#204E67] focus:outline-none focus:ring-2 focus:ring-[#275D7A] focus:ring-offset-2"
          onClick={copyLink}
          type="button"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Link copied" : "Copy share link"}
        </button>
      </section>
    </div>
  );
}

function SubmissionRow({
  submission,
  onOpen,
}: {
  submission: Submission;
  onOpen: () => void;
}) {
  return (
    <button
      className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-[#e3e7ec] px-4 py-4 text-left hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#275D7A] sm:grid-cols-[auto_minmax(150px,1fr)_minmax(120px,.7fr)_auto_auto] sm:px-5"
      onClick={onOpen}
      type="button"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e1e8ef] text-xs font-bold text-[#274669]">
        {submission.initials}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{submission.name}</p>
        <p className="mt-0.5 text-xs text-[#667c96]">
          {submission.id} · {submission.submitted}
        </p>
      </div>
      <p className="hidden text-xs text-[#51647a] sm:block">
        {submission.serviceDates}
      </p>
      <div className="hidden sm:block">
        <StatusBadge status={submission.status} />
      </div>
      <ArrowRight className="h-4 w-4 text-[#7087a1]" />
      <div className="col-span-2 col-start-2 sm:hidden">
        <StatusBadge status={submission.status} />
      </div>
    </button>
  );
}

function Overview({
  submissions,
  openSubmission,
}: {
  submissions: Submission[];
  openSubmission: (submission: Submission) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-7 sm:px-7 sm:py-9">
      <div>
        <div>
          <p className="text-sm text-[#596d84]">Thursday, October 1</p>
          <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em] sm:text-[28px]">
            Good morning, Renee.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#566a80]">
            Three volunteer submissions need attention before they can move to
            signature.
          </p>
        </div>
      </div>
      <div className="mt-8">
        <section className="overflow-hidden rounded-xl border border-[#d7dee6] bg-white shadow-[0_2px_12px_rgba(22,42,43,0.05)]">
          <div className="flex items-center justify-between px-4 py-4 sm:px-5">
            <div>
              <h3 className="font-bold">Needs attention</h3>
              <p className="mt-0.5 text-xs text-[#667c96]">
                Newest submissions appear first
              </p>
            </div>
          </div>
          {submissions.slice(0, 4).map((submission) => (
            <SubmissionRow
              key={submission.id}
              onOpen={() => openSubmission(submission)}
              submission={submission}
            />
          ))}
        </section>
      </div>
    </div>
  );
}

function Queue({
  submissions,
  openSubmission,
}: {
  submissions: Submission[];
  openSubmission: (submission: Submission) => void;
}) {
  const [filter, setFilter] = useState("All statuses");
  const visible =
    filter === "All statuses"
      ? submissions
      : submissions.filter((item) => item.status === filter);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-7 sm:px-7 sm:py-9">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.03em]">Volunteer submissions</h2>
          <p className="mt-2 text-sm text-[#596d84]">
            Review, return, approve, and sign submissions for your organization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative flex-1 sm:w-52">
            <span className="sr-only">Search submissions</span>
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6b8099]" />
            <input
              className="h-9 w-full rounded-lg border border-[#ccd5e0] bg-white pl-9 pr-3 text-xs outline-none"
              placeholder="Search name or number"
            />
          </label>
          <select
            aria-label="Filter by status"
            className="h-9 rounded-lg border border-[#ccd5e0] bg-white px-3 text-xs font-medium"
            onChange={(event) => setFilter(event.target.value)}
            value={filter}
          >
            <option>All statuses</option>
            <option>Submitted</option>
            <option>Changes requested</option>
            <option>Approved</option>
            <option>Ready to download</option>
            <option>Declined</option>
          </select>
        </div>
      </div>
      <div className="mt-7 overflow-hidden rounded-xl border border-[#d7dee6] bg-white shadow-[0_2px_12px_rgba(22,42,43,0.05)]">
        {visible.map((submission) => (
          <SubmissionRow
            key={submission.id}
            onOpen={() => openSubmission(submission)}
            submission={submission}
          />
        ))}
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold text-[#687e98]">{label}</dt>
      <dd className="mt-1 text-sm font-medium leading-5 text-[#202f41]">{value}</dd>
    </div>
  );
}

function SubmissionDetail({
  submission,
  updateStatus,
  goBack,
}: {
  submission: Submission;
  updateStatus: (status: SubmissionStatus) => void;
  goBack: () => void;
}) {
  const [showChangeNote, setShowChangeNote] = useState(false);
  const [showSecondaryActions, setShowSecondaryActions] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-7 sm:py-8">
      <button
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#455a72]"
        onClick={goBack}
        type="button"
      >
        <ArrowLeft className="h-4 w-4" /> Back to submissions
      </button>
      <div className="mt-5 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d9e2ed] text-sm font-bold text-[#274669]">
          {submission.initials}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold tracking-[-0.03em]">
              {submission.name}
            </h2>
            <StatusBadge status={submission.status} />
          </div>
          <p className="mt-1 text-xs text-[#607791]">
            {submission.id} · Submitted {submission.submitted}
          </p>
        </div>
      </div>
      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          {submission.warning && submission.status === "Submitted" && (
            <div className="flex gap-3 rounded-xl border border-[#E6C997] bg-[#FFF8E8] p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#A66A25]" />
              <div>
                <p className="text-sm font-bold text-[#71491C]">
                  Check the reported hours
                </p>
                <p className="mt-1 text-xs leading-5 text-[#805E34]">
                  The volunteer reported 18 monthly hours and 5 weekly hours.
                  Review the values before approval.
                </p>
              </div>
            </div>
          )}
          <DetailSection icon={UserRound} title="Volunteer information">
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <DetailField label="Legal name" value={submission.name} />
              <DetailField label="Date of birth" value="June 14, 1993" />
              <DetailField label="Email" value="maya.johnson@example.com" />
              <DetailField label="Phone" value="(412) 555-0184" />
              <DetailField
                label="Home address"
                value="1842 Penn Avenue, Pittsburgh, PA 15222"
              />
              <DetailField label="Case reference" value="Ending in 4821" />
            </dl>
          </DetailSection>
          <DetailSection icon={ClipboardCheck} title="Volunteer service">
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <DetailField label="Service period" value={submission.serviceDates} />
              <DetailField label="Hours reported" value={submission.hours} />
              <DetailField label="Required hours" value="20 hours per month" />
              <DetailField label="Transportation provided" value="No" />
              <div className="sm:col-span-2">
                <DetailField
                  label="Tasks performed"
                  value="Prepared pantry orders, restocked shelves, and helped neighbors carry groceries to the pickup area."
                />
              </div>
            </dl>
          </DetailSection>
          <div className="flex gap-3 rounded-xl border border-[#d7dee6] bg-[#f6f8fb] p-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-[#335377]" />
            <div>
              <h3 className="text-sm font-bold">Volunteer attestation</h3>
              <p className="mt-2 text-xs leading-5 text-[#53687f]">
                “I attest that the information in this submission is true and
                complete to the best of my knowledge.”
              </p>
              <p className="mt-3 text-xs font-semibold">
                Accepted by {submission.name} · October 1, 2026 at 9:42 AM
              </p>
            </div>
          </div>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-5">
          <section className="rounded-xl border border-[#cfd8e2] bg-white p-5 shadow-[0_4px_18px_rgba(22,42,43,0.07)]">
            <h3 className="text-sm font-bold">Review decision</h3>
            {submission.status === "Submitted" && (
              <div className="mt-4 space-y-2.5">
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#335377] px-4 py-2.5 text-sm font-semibold text-white"
                  onClick={() => updateStatus("Approved")}
                  type="button"
                >
                  <Check className="h-4 w-4" /> Approve for signature
                </button>
                <button
                  aria-expanded={showSecondaryActions}
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-[#51667f] hover:bg-[#f0f3f7]"
                  onClick={() => setShowSecondaryActions((value) => !value)}
                  type="button"
                >
                  <MoreHorizontal className="h-4 w-4" /> More review actions
                </button>
                {showSecondaryActions && (
                  <div className="rounded-lg border border-[#dce2e9] bg-[#f5f7f9] p-2">
                    <button
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold text-[#36475b] hover:bg-white"
                      onClick={() => setShowChangeNote((value) => !value)}
                      type="button"
                    >
                      <PenLine className="h-3.5 w-3.5" /> Request changes
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold text-[#98504B] hover:bg-white"
                      onClick={() => updateStatus("Declined")}
                      type="button"
                    >
                      <X className="h-3.5 w-3.5" /> Decline submission
                    </button>
                  </div>
                )}
                {showChangeNote && showSecondaryActions && (
                  <div className="rounded-lg bg-[#f2f4f7] p-3">
                    <label className="text-xs font-semibold" htmlFor="change-note">
                      Message to volunteer
                    </label>
                    <textarea
                      className="mt-2 min-h-20 w-full rounded-md border border-[#c4cfdb] bg-white p-2 text-xs"
                      defaultValue="Please confirm the total hours for this service period."
                      id="change-note"
                    />
                    <button
                      className="mt-2 w-full rounded-md bg-[#275D7A] px-3 py-2 text-xs font-semibold text-white"
                      onClick={() => updateStatus("Changes requested")}
                      type="button"
                    >
                      Send request
                    </button>
                  </div>
                )}
              </div>
            )}
            {submission.status === "Approved" && (
              <SignerPanel onSign={() => updateStatus("Ready to download")} />
            )}
            {submission.status === "Ready to download" && (
              <button
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#275D7A] px-4 py-2.5 text-sm font-semibold text-white"
                type="button"
              >
                <Download className="h-4 w-4" /> Download completed PDF
              </button>
            )}
            {submission.status !== "Submitted" &&
              submission.status !== "Approved" &&
              submission.status !== "Ready to download" && (
                <p className="mt-4 rounded-lg bg-[#f0f3f7] p-3 text-xs leading-5 text-[#465a70]">
                  This submission is {submission.status.toLowerCase()}. The
                  preview keeps this state only in the current browser tab.
                </p>
              )}
          </section>
          <section className="rounded-xl border border-[#d7dee6] bg-white p-5">
            <h3 className="text-sm font-bold">History</h3>
            <div className="mt-4 space-y-4 border-l border-[#d2dae3] pl-4">
              {submission.status !== "Submitted" && (
                <HistoryItem detail="Renee Okafor · just now" title={submission.status} />
              )}
              <HistoryItem detail="Automated checks · 9:42 AM" title="Validation completed" />
              <HistoryItem detail={`${submission.name} · 9:42 AM`} title="Submission received" />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#d7dee6] bg-white p-5 shadow-[0_2px_10px_rgba(22,42,43,0.04)] sm:p-6">
      <div className="mb-5 flex items-center gap-2 border-b border-[#e1e6eb] pb-4">
        <Icon className="h-4 w-4 text-[#405c7b]" />
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function SignerPanel({ onSign }: { onSign: () => void }) {
  return (
    <div className="mt-4 border-t border-[#dee4eb] pt-4">
      <p className="text-xs font-bold">Authorized signer</p>
      <p className="mt-1 text-[11px] leading-4 text-[#607791]">
        Review the certification language before applying the organization
        signature.
      </p>
      <label className="mt-3 flex items-start gap-2 text-[11px] leading-4 text-[#42556a]">
        <input className="mt-0.5 accent-[#335377]" defaultChecked type="checkbox" />
        I certify that I reviewed this submission as an authorized signer.
      </label>
      <button
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#162A2B] px-4 py-2.5 text-sm font-semibold text-white"
        onClick={onSign}
        type="button"
      >
        <FileCheck2 className="h-4 w-4" /> Sign and prepare PDF
      </button>
    </div>
  );
}

function HistoryItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="relative before:absolute before:-left-[21px] before:top-1 before:h-2.5 before:w-2.5 before:rounded-full before:border-2 before:border-[#6b89ac] before:bg-white">
      <p className="text-xs font-semibold">{title}</p>
      <p className="mt-0.5 text-[11px] text-[#687e98]">{detail}</p>
    </div>
  );
}

function Intake({ openVolunteer }: { openVolunteer: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mx-auto w-full max-w-[980px] px-4 py-7 sm:px-7 sm:py-9">
      <h2 className="text-2xl font-bold tracking-[-0.03em]">Intake link</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#596d84]">
        Share one permanent link with volunteers. It opens the public PA 1938
        form without requiring an account.
      </p>
      <div className="mt-7 grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-xl border border-[#d7dee6] bg-white p-5 shadow-[0_2px_12px_rgba(22,42,43,0.05)] sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[#607791]">
                PA 1938 volunteer verification
              </p>
              <span className="mt-2 inline-flex rounded-full border border-[#b0c3d9] bg-[#e8eff7] px-2.5 py-1 text-[11px] font-bold text-[#274669]">
                Active
              </span>
            </div>
            <MoreHorizontal className="h-5 w-5 text-[#546980]" />
          </div>
          <label className="mt-7 block text-xs font-semibold" htmlFor="intake-url">
            Permanent intake URL
          </label>
          <div className="mt-2 flex items-center rounded-lg border border-[#c5d0dc] bg-[#f5f7f9] p-1.5 pl-3">
            <Link2 className="mr-2 h-4 w-4 shrink-0 text-[#5e748e]" />
            <input
              className="min-w-0 flex-1 bg-transparent text-xs outline-none"
              id="intake-url"
              readOnly
              value="snappyforms.org/apply/northside-pa1938"
            />
            <button
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-xs font-semibold shadow-sm"
              onClick={() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1800);
              }}
              type="button"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="mt-6 grid gap-4 rounded-lg bg-[#f0f3f7] p-4 sm:grid-cols-3">
            <MiniMetric label="Submissions" value="12" />
            <MiniMetric label="Link opens" value="38" />
            <MiniMetric label="Completion" value="74%" />
          </div>
          <button
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#275D7A] px-4 py-2.5 text-sm font-semibold text-white"
            onClick={openVolunteer}
            type="button"
          >
            <ArrowRight className="h-4 w-4" /> Open volunteer form
          </button>
        </section>
        <section className="rounded-xl bg-[#1c3857] p-6 text-center text-white shadow-[0_8px_30px_rgba(36,79,69,0.16)]">
          <p className="text-sm font-bold">Scan to volunteer</p>
          <p className="mt-1 text-xs text-white/70">Northside Community Resource Center</p>
          <div className="mx-auto mt-5 w-fit rounded-xl bg-white p-2">
            <QrPreview size={172} />
          </div>
          <p className="mt-4 text-[11px] leading-4 text-white/65">
            This preview QR is illustrative and contains no volunteer information.
          </p>
          <button
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2 text-xs font-semibold"
            type="button"
          >
            <Download className="h-4 w-4" /> Download print card
          </button>
        </section>
      </div>
    </div>
  );
}

function MiniMetric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[11px] text-[#647992]">{label}</p>
    </div>
  );
}

function Documents({
  submissions,
  openSubmission,
}: {
  submissions: Submission[];
  openSubmission: (submission: Submission) => void;
}) {
  const ready = submissions.filter(
    (item) => item.status === "Ready to download",
  );
  return (
    <div className="mx-auto w-full max-w-[980px] px-4 py-7 sm:px-7 sm:py-9">
      <h2 className="text-2xl font-bold tracking-[-0.03em]">Completed documents</h2>
      <p className="mt-2 text-sm text-[#596d84]">
        Download completed forms and view their recorded document history.
      </p>
      <div className="mt-7 overflow-hidden rounded-xl border border-[#d7dee6] bg-white">
        {ready.map((submission) => (
          <div
            className="flex flex-col gap-4 border-b border-[#e2e7ec] p-5 last:border-b-0 sm:flex-row sm:items-center"
            key={submission.id}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e4ebf4] text-[#335377]">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">PA 1938 · {submission.name}</p>
              <p className="mt-1 text-xs text-[#667c96]">
                {submission.id} · Prepared October 1, 2026
              </p>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#c5d0dc] px-3 py-2 text-xs font-semibold"
              onClick={() => openSubmission(submission)}
              type="button"
            >
              <Download className="h-4 w-4" /> Download PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Team() {
  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-7 sm:px-7 sm:py-9">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.03em]">Team</h2>
          <p className="mt-2 text-sm text-[#596d84]">
            Assign review and signature permissions separately.
          </p>
        </div>
        <button className="rounded-lg bg-[#275D7A] px-4 py-2.5 text-sm font-semibold text-white" type="button">
          Invite member
        </button>
      </div>
      <div className="mt-7 overflow-hidden rounded-xl border border-[#d7dee6] bg-white">
        {[
          ["Renee Okafor", "RO", "Administrator · Reviewer · Signer"],
          ["Jamie Rivera", "JR", "Reviewer"],
          ["Alicia Chen", "AC", "Authorized signer"],
        ].map(([name, initials, roles]) => (
          <div className="flex items-center gap-4 border-b p-5 last:border-b-0" key={name}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e1e8ef] text-xs font-bold text-[#274669]">
              {initials}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{name}</p>
              <p className="mt-1 text-xs text-[#667c96]">{roles}</p>
            </div>
            <MoreHorizontal className="h-5 w-5 text-[#607791]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PortalDemo({
  view,
  setView,
  submissions,
  setSubmissions,
}: PortalProps) {
  const [page, setPage] = useState<PortalPage>("overview");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const selected = submissions.find((item) => item.id === selectedId);

  const openSubmission = (submission: Submission) => {
    setPage("submissions");
    setSelectedId(submission.id);
  };
  const changePage = (nextPage: PortalPage) => {
    setPage(nextPage);
    setSelectedId(null);
  };
  const updateSelected = (status: SubmissionStatus) => {
    setSubmissions(
      submissions.map((item) =>
        item.id === selectedId ? { ...item, status } : item,
      ),
    );
  };

  let content: React.ReactNode;
  if (selected) {
    content = (
      <SubmissionDetail
        goBack={() => setSelectedId(null)}
        submission={selected}
        updateStatus={updateSelected}
      />
    );
  } else if (page === "overview") {
    content = (
      <Overview
        openSubmission={openSubmission}
        submissions={submissions}
      />
    );
  } else if (page === "submissions") {
    content = <Queue openSubmission={openSubmission} submissions={submissions} />;
  } else if (page === "intake") {
    content = <Intake openVolunteer={() => setView("volunteer")} />;
  } else if (page === "documents") {
    content = (
      <Documents openSubmission={openSubmission} submissions={submissions} />
    );
  } else {
    content = <Team />;
  }

  return (
    <div className="min-h-[calc(100vh-40px)] bg-[#f2f4f7]">
      <Sidebar
        close={() => setMobileOpen(false)}
        open={mobileOpen}
        page={page}
        setPage={changePage}
      />
      {shareOpen && <ShareModal close={() => setShareOpen(false)} />}
      <div className="min-w-0">
        <Header
          openMenu={() => setMobileOpen(true)}
          openShare={() => setShareOpen(true)}
          setView={setView}
          view={view}
        />
        <main>{content}</main>
      </div>
    </div>
  );
}
