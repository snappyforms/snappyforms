# SPIKE — PA-1938 Community Health Volunteer Corps POC

**Issue:** TBD · **Status:** proposal · **Partner materials:** `poc/` at the repo root
(git-ignored): `081426_CHVC-Model-SOP_External.docx`, the REDCap monthly survey PDF, the
official `pa-1938-3-20-uf-...pdf`, `checklist.png`, and the `CPH_CHVC-main` R project.

## Context

Penn's Center for Public Health (CPH) runs the Community Health Volunteer Corps (CHVC): SNAP
recipients subject to the ABAWD work requirement volunteer 20 hours a week (80 a month) doing
hypertension outreach, and CPH certifies that service to the County Assistance Office (CAO) on
form **PA-1938**. Their stack today is REDCap (an enrollment survey plus a monthly hours
survey), an R script on a Windows task scheduler that overlays survey answers onto the PA-1938
PDF by pixel coordinate, a shared folder where the program lead signs the PDFs, and secure fax
to the CAO. Reminders are REDCap's scheduler plus staff follow-up at day 4 and day 7, and phone
calls for people without text.

This spike plans a SnappyForms build that replaces that pipeline with one app. The participant
gets a **checklist** for each reporting month, logs hours either as a **monthly survey** or as
**per-shift activity records**, attests, the site manager **certifies** and **submits** the
filled PA-1938 to the CAO (simulated fax), and a **reminders module** chases each deadline by
email or SMS. Everything else in the repo that the checklist never touches is stripped, so the
demo is the POC and nothing more.

Acceptance criteria from the request, and where each is answered:

| # | Ask | Section |
| --- | --- | --- |
| 1 | Review existing functionality and describe how it meets the POC | §2 |
| 2 | Plan to strip extraneous functionality | §3 |
| 3 | A "workflow" object with steps performed by multiple participants; screening left as TODO | §4 |
| 4 | Checklist UI, vertical linear flow with info boxes; activities limited to the org's defaults | §5 |
| 5, 6 | Hours logging as a clear fork: monthly survey or detailed log; data model for both | §6 |
| 7 | Reminders by email and SMS for submission deadlines | §8 |

## 1. The partner's process today, and what each part becomes

| CHVC today (SOP §"Program Structure") | Who | Cadence | In the POC |
| --- | --- | --- | --- |
| Enrollment survey in REDCap: name, DOB, SSN last 4, address, ZIP, email, phone, preferred contact, four consent questions | Participant | Once, then every 6 months (new PA-1938) | `/enroll` → `WorkflowEnrollment` (§4) |
| Monthly hours survey: "Did you complete 80 hours?" plus hours per activity category and a total | Participant | Last Thursday of the month | Checklist step **Log hours** → `HoursSubmission` (§6) |
| Survey reminders: last Thursday, follow-ups at day 4 and day 7, phone call if no text | REDCap + staff | Monthly | Reminders module (§8) |
| R script fills PA-1938 from completed surveys, drops PDF in a folder, marks record processed | Task scheduler, daily 9:00 | Daily | Certify step fills the official AcroForm (§7) |
| Program lead signs and faxes to the CAO | Org | Per form; within 10 days of receipt | Certify + **Submit** steps, simulated fax (§7, §9) |
| Volunteer status: Active / Inactive / Withdrew / Lost to follow-up; report changes within 10 days (Section IV) | Org | As needed | `WorkflowEnrollment.status`, org roster (§9) |
| Approved activity menu: AHA trainings, conversations, social media posts, other approved topics | Org defines | At program design | `OpportunityActivityType` on the program (§6) |

Two facts about PA-1938 shape the design. It is filled **by the organization**, signed only by
the site manager, and covers **up to six months** of service, with the CAO writing the required
monthly hours. The partner nevertheless generates one per completed monthly survey, so the POC
does the same: one form per reporting month, plus a six-month renewal reminder.

## 2. What already exists and how it maps (AC 1)

Everything lives under `frontend/`. The repo-root `src/` and `prisma/dev.db` are stale leftovers
of the monorepo move and can go.

| POC need | Exists today | Reuse / gap |
| --- | --- | --- |
| Accounts, sessions, code/magic-link/password login, demo-login buttons | `src/lib/auth/*`, `src/app/api/auth/*`, `src/lib/demo.ts`, `DemoLoginButtons.tsx` | Reuse as is. Drop the agency persona. |
| Participant and organization onboarding, handles | `src/app/onboarding/*`, `HandlePicker.tsx`, `Handle` model | Reuse. Onboarding gains the enrollment hand-off (§4). |
| Organization + members + roles | `Organization`, `OrganizationMembership` (ADMIN/MEMBER) | Reuse. Drop the REQUESTED/PENDING ratification ledger, domains, locations (§3). |
| A "program" the participant joins, with default activities | `VolunteerOpportunity` is a dated shift with one free-text `taskCategory`; no activity list | Rework into an ongoing program with `OpportunityActivityType[]`, default hours, site manager (§6). |
| Org certifies, participant is notified, PDF produced | `FormCertificationRequest` state machine (`AWAITING_ORGANIZATION → CERTIFIED → FINALIZED`, plus `CHANGES_REQUESTED`/`DECLINED`), routes under `src/app/api/form-requests/`, page `src/app/(app)/forms/requests/[id]/page.tsx`, gates in `src/lib/formCertification.ts` | Reuse the model and routes. Attest creates the request; certify also finalizes because the org is now the submitter (§7). |
| PA-1938 PDF | `src/lib/pdf/pa1938.ts` draws a look-alike from scratch | Replace with an AcroForm fill of the official PDF. The official file has 35 named fields (listed in §7), so this is the `pa1895.ts` pattern with different field names. |
| Fax to the CAO | `src/lib/fax.ts`, `FaxPanel.tsx`, `FaxTransmission`, `api/generated-forms/[id]/fax`, `api/fax-destinations` | Reuse. Destination becomes a `CaoOffice` row; the fax is the **Submit** step. |
| Notifications in-app + simulated email/SMS | `src/lib/notify.ts` (`notifyUser`) writes a `Notification` and a `DevNotification`; `/dev/inbox` shows sends | Reuse as the delivery adapter for reminders. New notification types. |
| Scheduled reminders | Nothing. No cron, no worker, no provider, no `.github/workflows` | New module (§8). |
| Monthly hours aggregation | Only ad-hoc `_sum` calls in `caseHours.ts` and fraud heuristics; nothing stored per month | New `ReportingPeriod` + `HoursSubmission` (§4, §6). |
| Audit trail | `src/lib/audit.ts` (`logAudit`) | Reuse; every step completion logs. |
| Encrypted sensitive field | `src/lib/encryption.ts` (AES-256-GCM, used for case numbers) | Keep for SSN last 4 on the enrollment (§4). |
| QR on flyers → sign-up | `QRIdentifier` with `ownerType: OPPORTUNITY`, `/q/[opaqueId]` | Reuse: the program's QR resolves to `/enroll?program=…`, which is the partner's "QR code on flyers" onboarding. |
| Phone-shell UI kit, bottom nav | `src/components/ui/*`, `BottomNav.tsx`, `src/app/(app)/layout.tsx` | Reuse; nav becomes role-aware (§5, §9). |
| Browser and video demos | `frontend/e2e/*.mjs`, `tours/*.storyboard.yml`, `.claude/skills/app-tour` | Rewrite one story for the CHVC flow (§10). |

## 3. Strip plan (AC 2)

Decisions taken with the product owner: remove the per-record verification machine, the
PA-1895/shift code and generic forms, and the Phase 5 agency stack. Keep QR, search, public
profiles and share links. Squash migrations to a fresh init.

### Keep

Auth, sessions, onboarding, handles, `Organization` + `OrganizationMembership` (simplified),
`VolunteerOpportunity` (reworked), `QRIdentifier` (PARTICIPANT, ORGANIZATION, OPPORTUNITY),
`/search`, `/u/[handle]`, `/o/[handle]`, `/qr`, `/q/[opaqueId]`, `ShareLink` (narrowed to
`GENERATED_FORM`), `/share/[token]`, `FormCertificationRequest`, `GeneratedForm`,
`FaxTransmission`, `Notification`, `DevNotification`, `/dev/inbox`, `AuditLog`,
`src/lib/{encryption,fax,notify,notifications,audit,apiError,appUrl,demo,qr,shareLinks,utils,validation}.ts`,
`src/lib/pdf/render.ts`, the landing page, `terms/`, Docker + tour tooling.

### Remove

| Area | Models | Code (delete) |
| --- | --- | --- |
| Per-record verification | `ActivityRecord`, `RecordConfirmation`, `RecordDispute`, `FraudReviewFlag`, `OpportunitySignup` | `src/app/(app)/activity/**`, `src/app/api/activity/**`, `src/app/verify/[id]`, `src/app/api/verify`, `src/components/ActivityFieldsForm.tsx`, `src/lib/activity.ts` (move `getVerifierEligibleMembership` and `getOrgAdminMembership` to a new `src/lib/membership.ts` first), `src/lib/verification.ts`, the record parts of `activityLabels.ts` |
| PA-1895, shifts, generic forms | `VolunteerOpportunity.totpSecret` | `src/lib/pdf/{pa1895,genericForm}.ts`, `src/lib/pdf/templates/pa1895.pdf`, `src/lib/{shiftTotp,shifts}.ts`, `src/app/shift/**`, `src/app/(app)/organization/[id]/shifts/**`, `src/app/api/organizations/[id]/shifts`, `src/app/api/opportunities/[id]/{code,scan-confirm,shift-preview,checkins,check-in,signup,cancel,ics}`, `src/app/api/forms/generate`, `src/components/ShiftQrDisplay.tsx`, `tests/shiftTotp.test.ts`, `shift-flow.mjs`, `pa1895-flow.mjs`, `e2e/shift-qr-story.mjs`, `e2e/demo-stories.mjs`; `MONTHLY_SUMMARY`/`WORK_VERIFICATION`/`EDUCATION_VERIFICATION`/`PA_1895` entries in `formTemplates.ts` |
| Org trust model, domains, locations | `OrganizationDomain`, `OrganizationLocation`; membership `status` narrows to `ACTIVE \| SUSPENDED`; drop the five `firstApproval*`/`ratified*` columns | `src/app/api/organizations/[id]/{domains,locations,join}`, `api/organizations/joinable`, `members/[membershipId]/{ratify,approve-join,activate,reactivate}`, `src/components/JoinableOrgsBanner.tsx`, the Members-tab ratification UI, domain + location sections of `organization/[id]/settings/page.tsx` |
| Phase 5 agency | `Agency`, `AgencyMembership`, `BenefitProgram`, `ParticipantCase`, `Consent`, `APIClient`, `APIRequest`, `BulkQueryJob`, `BulkQueryResult`, `AdvocacyMessage`; `AuditLog.agencyId`, `FaxTransmission.participantCaseId` + `caseNumberLast4` | `src/app/(app)/agency/**`, `src/app/(app)/consent`, `src/app/api/agency/**`, `src/app/api/agency-api/**`, `src/app/api/consent/**`, `src/app/api/advocacy`, `src/lib/{agency,agencyApiOpenapi,apiRequestLog,caseHours,advocacy}.ts`, `src/components/AdvocacyPanel.tsx`, the `dcao-admin` persona in `demo-login/route.ts` + `DemoLoginButtons.tsx`, the agency section of `dashboard/page.tsx` |
| Guest "authorizer" demo | — | `api/auth/demo-join` keeps the guest participant only; drop `authorizer` and `flow: "host-shift"` |
| Stale root files | — | repo-root `src/`, `prisma/dev.db`; README references to a `ROADMAP.md` that no longer exists |

Dependencies stay as they are (`jsqr`/`qrcode` are still used by the kept QR flow); nothing new
is needed for the POC.

### Rework (same file, new shape)

- `src/middleware.ts` `PROTECTED_PREFIXES`: remove `/activity`, `/agency`, `/consent`; add
  `/enroll`, `/hours`, `/certifications`.
- `src/components/BottomNav.tsx`: role-aware. Participant: **Home** (checklist), **Hours**, **QR**,
  **Search**, **Settings**. Org member: **Home** (certification queue), **Participants**, **QR**,
  **Search**, **Settings**. The unread badge moves to Home.
- `src/app/(app)/dashboard/page.tsx`: participant branch renders the checklist (§5); org branch
  renders the queue (§9).
- `src/app/(app)/forms/page.tsx`: becomes "My documents" only (finalized PA-1938s per period).
  `forms/pa-1938/page.tsx` (the five-step wizard) is deleted; its participant/agency/service
  inputs now come from the enrollment and the program.
- `src/lib/validation.ts`: delete the activity, shift, agency, consent, domain and location
  schemas; add the schemas named in §4, §6, §8.
- `prisma/seed.ts`: rewrite (§10).
- `README.md`, `DEPLOY.md`: rewrite the flows list and env table.

### Migration

Delete `prisma/migrations/*`, then `npx prisma migrate dev --name init` against a fresh local DB
so the tree has exactly one migration. Consequences to handle in the same PR:

- `docker compose down -v` before any e2e run (the compose entrypoint seeds only when
  `user.count() === 0`).
- The deployed Neon database has the old migration history. `prisma migrate deploy` (run at build
  via `scripts/migrate-on-build.mjs`) will refuse a squashed history on it, so the deploy step
  is: `prisma migrate reset --skip-seed` against the direct URL once, then deploy. Add that
  sentence to DEPLOY.md's "Ongoing schema changes". Nothing on it is real data (DEPLOY.md
  already says not to seed a real deployment).
- Rename `CASE_DATA_ENCRYPTION_KEY` → `DATA_ENCRYPTION_KEY` in `encryption.ts`, `.env.example`,
  `apphosting.yaml`, `docker-compose.yml`.

## 4. The workflow model (AC 3)

Follow the repo's existing split: **definitions are static TypeScript config** (the way
`formTemplates.ts` is), **instances are Prisma rows**. A definition says which steps exist, in
what order, who performs each, and what the info box says. An instance says where one
participant is this month and who completed what.

### Definition: `src/lib/workflows/definitions.ts`

```ts
export type WorkflowActor = "PARTICIPANT" | "ORGANIZATION" | "SYSTEM";

export type WorkflowStepDefinition = {
  key: string;                       // stable id stored on WorkflowStepState.stepKey
  title: string;                     // node label, e.g. "Log activities"
  actor: WorkflowActor;              // who can complete it
  info: (ctx: StepContext) => string;// the "i" box; ctx has enrollment, period, submission
  href?: (ctx: StepContext) => string; // where tapping the node goes (participant steps)
  autoCompleteOnPeriodOpen?: (ctx) => boolean; // e.g. hours target already known
};

export type WorkflowDefinition = {
  key: "PA_1938_COMMUNITY_SERVICE";
  name: string;
  formTemplateKey: "PA_1938";
  period: { kind: "CALENDAR_MONTH"; dueDayOfFollowingMonth: 5; opensOn: "LAST_THURSDAY" };
  renewalMonths: 6;                  // a new PA-1938 every six months
  steps: WorkflowStepDefinition[];
  reminders: ReminderRule[];         // §8
};
```

The one definition for this POC, in the order the checklist draws them:

| # | `key` | Title (node) | Actor | Info box | Completes when |
| --- | --- | --- | --- | --- | --- |
| 1 | `SET_HOURS_TARGET` | I need x hours | PARTICIPANT | "Get that number from your CAO. It is on your Employment Development Plan." | `enrollment.requiredHoursPerMonth` set. Auto-completes on later periods. |
| 2 | `LOG_HOURS` | Log activities | PARTICIPANT | "You need {x/4} hours per week to meet your goal. {logged} of {x} logged." | `HoursSubmission.totalHours > 0` (either mode) |
| 3 | `ATTEST` | Submit & attest | PARTICIPANT | "Confirm the hours are true. This sends them to {org} to certify." | `HoursSubmission.attestedAt` set; creates the `FormCertificationRequest` |
| 4 | `ORG_CERTIFY` | Org confirmation | ORGANIZATION | "Waiting on {site manager} at {org}. They certify the PA-1938 with their signature." | request `FINALIZED` (certify + PDF in one call, §7) |
| 5 | `SUBMIT` | Submitted! | ORGANIZATION | "{org} faxed your PA-1938 to {CAO} on {date}. Confirmation {number}." | `FaxTransmission` exists for the period's form |

Adding a step for a future workflow (say an agency acknowledgement, or an E&T contractor
review) is a new row in this table plus a handler; the checklist and step-state code are
generic over the definition.

### Screening (TODO)

`src/lib/workflows/screening.ts` exports `chooseWorkflow(answers): WorkflowKey`. For the POC it
records the answers and always returns `PA_1938_COMMUNITY_SERVICE`, with a `// TODO(screening)`
block listing the ABAWD tests from the SOP (age 18–64, no dependent under 14, able to work,
Philadelphia resident for CHVC) as the questions the real version asks. The `/enroll/screening`
page shows them as informational checkboxes so the demo has the beat without claiming to
determine eligibility.

### Instances: Prisma additions

```prisma
/// status: "ACTIVE" | "INACTIVE" | "WITHDREW" | "LOST_TO_FOLLOW_UP" | "COMPLETED"
/// preferredContact: "EMAIL" | "SMS" | "PHONE_CALL"
model WorkflowEnrollment {
  id                     String   @id @default(cuid())
  workflowKey            String                       // "PA_1938_COMMUNITY_SERVICE"
  participantProfileId   String
  organizationId         String
  opportunityId          String                       // the program (VolunteerOpportunity)
  caoOfficeId            String?                      // where the form is faxed
  status                 String   @default("ACTIVE")

  // PA-1938 Section I, captured once at enrollment
  participantFullName    String
  participantDob         String
  participantAddress     String
  participantCity        String
  participantState       String
  participantZip         String
  ssnLast4Encrypted      String?  // AES-256-GCM via lib/encryption.ts; decrypted only inside the PDF fill
  preferredContact       String   @default("EMAIL")

  // PA-1938 Section II
  serviceStartDate       DateTime
  serviceExpectedEndDate DateTime                     // ≤ start + 6 months
  requiredHoursPerMonth  Float?                       // "I need x hours" — null until step 1
  transportationProvided Boolean  @default(false)

  screeningAnswers       String?                      // JSON, TODO(screening)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  periods   ReportingPeriod[]
  reminders ScheduledReminder[]
  @@index([participantProfileId])
  @@index([organizationId])
}

/// status: "OPEN" | "AWAITING_ORGANIZATION" | "CERTIFIED" | "SUBMITTED" | "MISSED"
model ReportingPeriod {
  id           String   @id @default(cuid())
  enrollmentId String
  periodStart  DateTime                               // first of the month, UTC
  periodEnd    DateTime                               // last day of the month
  dueDate      DateTime                               // "Submit by" — 5th of the next month
  status       String   @default("OPEN")
  formCertificationRequestId String? @unique
  hoursSubmission HoursSubmission?
  steps        WorkflowStepState[]
  reminders    ScheduledReminder[]
  @@unique([enrollmentId, periodStart])
}

/// status: "LOCKED" | "AVAILABLE" | "COMPLETE"
/// completedByRole: "PARTICIPANT" | "ORGANIZATION" | "SYSTEM"
model WorkflowStepState {
  id                String   @id @default(cuid())
  periodId          String
  stepKey           String
  sortOrder         Int
  status            String   @default("LOCKED")
  completedAt       DateTime?
  completedByUserId String?
  completedByRole   String?
  @@unique([periodId, stepKey])
}

model CaoOffice {                                     // replaces Agency: a fax destination only
  id String @id @default(cuid())
  name String
  addressLine1 String
  addressLine2 String?
  city String
  state String
  zip String
  faxNumber String
  phone String?
}
```

Changes to existing models: `VolunteerOpportunity` and `FormCertificationRequest` (§6, §7),
`FaxTransmission` gets `reportingPeriodId?` and `caoOfficeId` in place of the case columns,
`GeneratedForm.sourceRecordIds` becomes `reportingPeriodId?`, `Notification.activityRecordId`
becomes a generic `href?`.

### Engine: `src/lib/workflows/engine.ts`

Four functions, each the single place its concern lives:

- `ensureCurrentPeriod(enrollment, now)`: creates the `ReportingPeriod` for the month
  containing `now` if missing (idempotent via the unique key), materialises one
  `WorkflowStepState` per definition step, runs `autoCompleteOnPeriodOpen`, schedules the
  period's reminders (§8). Called on checklist load and by the jobs tick.
- `completeStep(periodId, stepKey, { userId, role })`: verifies the actor's role matches the
  definition and the step is `AVAILABLE`, marks it `COMPLETE`, unlocks the next step, recomputes
  `ReportingPeriod.status`, cancels that step's pending reminders, writes `logAudit`. Every step
  handler (hours-target save, attest, certify, fax) calls this; nothing else writes step state.
- `checklistFor(enrollment, period)`: joins definition + state into the view model the UI
  renders (title, status, info text, href, who and when).
- `transitionEnrollment(enrollmentId, status, { userId })`: the org's roster actions
  (Inactive / Withdrew / Lost to follow-up), audit-logged; `LOST_TO_FOLLOW_UP` and `WITHDREW`
  mark the open period `MISSED` and cancel its reminders.

## 5. The checklist (AC 4)

Matches `poc/checklist.png`. The participant's Home (`/dashboard`) renders it whenever they
have an `ACTIVE` enrollment; otherwise Home shows "Find a program" (the kept `/opportunities`
board) and "I have a code" (the QR/enroll link).

- Header: "Check list", the **Submit by {dueDate}** line in red (always red once inside 7 days
  or overdue; otherwise muted), a clock icon → `/hours/history` (one row per past period:
  month, hours, status, download), and a scroll icon → `GET /api/periods/[id]/preview.pdf`, the
  official form filled with what is known so far and stamped "DRAFT — not certified".
- Body: one node per step from `checklistFor`, stacked with connector arrows. Node states:
  `COMPLETE` grey fill with a green check badge; `AVAILABLE` (the current step) green fill;
  `LOCKED` white outline. Each node has an **i** toggle that reveals the info text from the
  definition. Tapping an `AVAILABLE` participant step navigates to its `href`; organization
  steps are not tappable and show who it is waiting on.
- Below the steps (the root layout is a phone shell, so the image's right-hand panel stacks
  underneath): the **Activity records** panel with a **+** when the period is in detailed mode,
  or the summary survey card when in summary mode, or the mode chooser when neither (§6).
- Component: `src/components/workflow/Checklist.tsx` (client) fed by
  `GET /api/enrollments/current` → `{ enrollment, period, steps[], submission }`. It knows
  nothing about PA-1938; the definition carries the copy.

Activities are constrained by the program: every place the participant enters hours picks from
`OpportunityActivityType` rows of the enrollment's opportunity. There is no free-text activity
field on the participant side.

## 6. Logging hours: the fork (AC 5, 6)

Step 2 opens `/hours`, a two-card chooser that makes the fork explicit:

| Card | Copy | What it creates |
| --- | --- | --- |
| **Monthly survey** (simplest) | "Answer one question per activity: how many hours this month." Mirrors the REDCap survey: "Did you complete {x} hours?" then hours per activity type and a computed total. | `HoursSubmission{mode: MONTHLY_SUMMARY}` + one `HoursSummaryLine` per activity type |
| **Log each activity** | "Add a record every time you volunteer. We add them up for you." List of entries with **+ Add record** → date, activity type, either start/end time or hours, optional note. | `HoursSubmission{mode: DETAILED_LOG}` + `ActivityLogEntry` rows |

Switching mode is allowed until attestation. Detailed → summary prefills the lines from the
per-type sums; summary → detailed asks for confirmation and clears the lines. `totalHours` is
recomputed on every write by `recalcSubmission()` in `src/lib/hours.ts`; the UI never sums.

```prisma
model OpportunityActivityType {                        // the org's approved activity menu
  id            String  @id @default(cuid())
  opportunityId String
  label         String                                  // "Conversations about hypertension"
  description   String?
  formTaskText  String                                  // short text for PA-1938 "Description of tasks" (≤ 60 chars)
  sortOrder     Int     @default(0)
  active        Boolean @default(true)
  @@index([opportunityId])
}

/// mode: "MONTHLY_SUMMARY" | "DETAILED_LOG"
model HoursSubmission {
  id               String   @id @default(cuid())
  periodId         String   @unique
  mode             String
  totalHours       Float    @default(0)
  metRequirement   Boolean?                             // the survey's yes/no question
  attestedAt       DateTime?
  attestedByUserId String?
  attestationText  String?                              // the exact sentence they agreed to
  summaryLines     HoursSummaryLine[]
  entries          ActivityLogEntry[]
}

model HoursSummaryLine {
  id             String @id @default(cuid())
  submissionId   String
  activityTypeId String
  hours          Float
  @@unique([submissionId, activityTypeId])
}

model ActivityLogEntry {                               // one shift / one sitting
  id             String   @id @default(cuid())
  submissionId   String
  activityTypeId String
  activityDate   DateTime
  startTime      String?                               // "HH:MM", optional
  endTime        String?
  hours          Float                                  // entered, or derived from the times
  notes          String?
  createdAt      DateTime @default(now())
  @@index([submissionId, activityDate])
}
```

`VolunteerOpportunity` becomes a program: `date` → nullable `startDate`/`endDate`, add
`isOngoing`, `defaultHoursPerWeek` (20), `defaultHoursPerMonth` (80), `siteManagerName`,
`siteManagerTitle`, `transportationProvided`, and the `activityTypes` / `enrollments`
relations; drop `totpSecret`, `taskCategory`, `openings`, `minimumAge`,
`backgroundCheckRequired`, `trainingRequired`. The org's `organization/[id]/opportunities/new`
page gains a repeating "Approved activities" editor (label, form text) and the site-manager
fields. Sign up on `/opportunities/[id]` becomes **Enroll** → `/enroll?program=…`.

Attest (step 3, `/hours/attest`): shows the month's total against `requiredHoursPerMonth`, the
per-type breakdown, the entries if any, and one checkbox with the attestation sentence. On
submit, `POST /api/periods/[id]/attest` sets `attestedAt`, creates the
`FormCertificationRequest` (§7), calls `completeStep(ATTEST)`, and notifies the org's
site manager (or all ADMINs) exactly as `api/form-requests/route.ts` does today.

Routes: `GET/PUT /api/periods/[id]/submission` (mode + summary lines),
`POST/DELETE /api/periods/[id]/entries[/[entryId]]`, `POST /api/periods/[id]/attest`,
`PUT /api/enrollments/[id]/hours-target`. Pages: `/hours`, `/hours/survey`, `/hours/new`,
`/hours/attest`, `/hours/history`.

## 7. Filling the official PA-1938

Vendor `poc/pa-1938-3-20-uf-community-service-volunteer-verification-form.pdf` to
`src/lib/pdf/templates/pa1938.pdf` and rewrite `src/lib/pdf/pa1938.ts` on the `pa1895.ts`
pattern (`PDFDocument.load` → `getForm()` → `getTextField(name).setText`). Inspected with
pdf-lib, the form has these fields:

| Field name(s) | Filled from |
| --- | --- |
| `Name of volunteer`, `Birthdate`, `Address of volunteer`, `City`, `State`, `ZIP code` | enrollment Section I columns |
| `Last 4 digits of SSN` | `decrypt(enrollment.ssnLast4Encrypted)`, inside the renderer only; the request row never carries it |
| `Name of agency`, `Agency Phone Number`, `Address of agency`, `City_2`, `State_2`, `ZIP code_2` | `Organization` |
| `Start Date of Service`, `Expected End Date of Service` | enrollment |
| `Group4` radio, options `YES` / `NO` | `transportationProvided` |
| `Estimated Weekly HoursWeek 1` … `Week 4` | detailed mode: entries bucketed by day of month (1–7, 8–14, 15–21, 22–end); summary mode: `totalHours / 4` |
| `Estimated Weekly HoursTotal Monthly Estimated Hours` | `submission.totalHours` |
| `1`, `2`, `3` | first three active `OpportunityActivityType.formTaskText` |
| `Name of Site Manager please print`, `Date` | certification (name + title, confirmation date) |
| `Text1` (two widgets: the "MAIL OR FAX THIS FORM TO" box on page 1 and the page-2 box) | `CaoOffice` name, address, fax |
| `CO  REC`, `MONTHLY HOURS` | left blank: CAO use only |
| `Actual End DateRow1`, `Other Changes Please explain belowRow1`, `Name of Site ManagerX`, `DateX` | Section IV; filled by the roster's "Report a change" action (stretch, §9) |
| `Monthly Schedule of ServiceRow1` | unused stray field; leave blank |
| `RESET` button | untouched |

The Section III signature line is not a field; draw the typed name with `page.drawText` at the
"X" and keep today's "demonstration placeholder, not a legally binding signature" note. Call
`form.flatten()` before saving so the CAO copy is not editable. The draft preview (§5) is the
same function with `{ draft: true }` adding a diagonal "DRAFT — not certified" watermark.

Weekly hours are a judgement call: the partner hard-codes 20/80 because the form is
prospective, but the site manager is certifying a month that already happened, so the POC
prints actuals. Recorded in §12.

`FormCertificationRequest` keeps its columns and routes but changes provenance: `reportingPeriodId`
(unique) replaces `sourceRecordId`; the participant, agency and service blocks are copied from
the enrollment and program at attest time (a snapshot, as today); `tasks` comes from the
activity types; `week*Hours` from the submission. The org is the submitter, so
`POST /api/form-requests/[id]/certify` now certifies **and** finalizes in one transaction:
status `AWAITING_ORGANIZATION → CERTIFIED → FINALIZED`, `GeneratedForm` created, period status
`CERTIFIED`, `completeStep(ORG_CERTIFY)`. The participant-side `finalize` route and its SSN
prompt are deleted. `decline` and `request-changes` stay (a change request reopens the period's
`ATTEST` step and notifies the participant).

Submit: on the certified request page the org sees the existing `FaxPanel`; the destination
list is `CaoOffice` rows; `POST /api/generated-forms/[id]/fax` records the `FaxTransmission`
with `reportingPeriodId`, marks the period `SUBMITTED`, calls `completeStep(SUBMIT)`, and
notifies the participant with the confirmation number. Both parties can download the PDF from
`/api/generated-forms/[id]/download` (allow org members of the form's organization, not only
the participant).

## 8. Reminders module (AC 7)

There is no scheduler in the repo today, so this is the first background work. Keep it boring: a
table of scheduled sends, one dispatcher function, one HTTP trigger, and the existing
`notifyUser` as the delivery path.

### Rules (static, on the workflow definition)

| `ruleKey` | Fires at | To | Channel | Cancelled when |
| --- | --- | --- | --- | --- |
| `PERIOD_OPEN` | last Thursday of the month (the partner's survey day) | participant | preferred | `ATTEST` complete |
| `DUE_TOMORROW` | dueDate − 1 day | participant | preferred | `ATTEST` complete |
| `OVERDUE_4` | dueDate + 4 days | participant | preferred | `ATTEST` complete |
| `OVERDUE_7` | dueDate + 7 days | participant **and** a `PHONE_TASK` to the org | preferred + in-app | `ATTEST` complete |
| `ESCALATE_10` | dueDate + 10 days | org ADMINs | in-app + email: "three reminders unanswered; mark lost to follow-up and report to the CAO within 10 days" | `ATTEST` complete |
| `CERT_PENDING` | attestedAt + 2 days | site manager / org ADMINs | in-app + email | `ORG_CERTIFY` complete |
| `RENEWAL_DUE` | serviceExpectedEndDate − 14 days | participant + org | preferred | enrollment not `ACTIVE` |

"Preferred" resolves from `WorkflowEnrollment.preferredContact`: `EMAIL` → email, `SMS` → SMS,
`PHONE_CALL` → an in-app task for the org ("Call {name}: {reason}") because the partner notes
some participants must be phoned. A `PHONE_TASK` is just a `Notification` to the org with
`type: "PHONE_TASK"`.

### Storage and dispatch

```prisma
/// channel: "EMAIL" | "SMS" | "PHONE_TASK"
/// status: "SCHEDULED" | "SENT" | "CANCELLED" | "FAILED"
model ScheduledReminder {
  id                String   @id @default(cuid())
  enrollmentId      String
  periodId          String?
  ruleKey           String
  recipientUserId   String
  channel           String
  sendAt            DateTime
  status            String   @default("SCHEDULED")
  sentAt            DateTime?
  attempts          Int      @default(0)
  lastError         String?
  devNotificationId String?                             // the /dev/inbox row it produced
  createdAt         DateTime @default(now())
  @@index([status, sendAt])
  @@unique([periodId, ruleKey, recipientUserId, channel])
}
```

- `src/lib/reminders/schedule.ts`: `scheduleForPeriod(period)` and `scheduleForEnrollment(...)`
  compute `sendAt` from the rules and upsert rows; `cancelForStep(periodId, stepKey)` is what
  `completeStep` calls.
- `src/lib/reminders/dispatch.ts`: `runTick(now = new Date())` does, in order:
  `rolloverPeriods(now)` (calls `ensureCurrentPeriod` for every `ACTIVE` enrollment, marks
  periods whose `dueDate + 10d < now` and still `OPEN` as `MISSED`), then selects
  `SCHEDULED` reminders with `sendAt <= now` in batches, renders the template for the rule,
  sends, and marks `SENT`/`FAILED` (three attempts, then stop). Returns counts for the log.
- `src/lib/messaging/index.ts`: `sendMessage({ channel, to, subject, body })`. Provider chosen by
  `MESSAGE_PROVIDER=dev|live`. `dev` is `logNotification` (today's `/dev/inbox`). `live` maps
  EMAIL → Resend (`RESEND_API_KEY`, `MAIL_FROM`) and SMS → Twilio (`TWILIO_ACCOUNT_SID`,
  `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`) and throws a clear "not configured" error when a key is
  missing. Only `dev` is exercised by the POC; the two adapters are small and env-gated so the
  demo can say "flip one variable to send for real". `notifyUser` routes through `sendMessage`
  so reminders also appear in the in-app list.
- Trigger: `POST /api/jobs/tick` guarded by `Authorization: Bearer $JOBS_SECRET`; body may carry
  `{ "asOf": "2026-10-06T09:00:00Z" }` for time travel. Also `npm run jobs:tick` (a tsx script
  calling `runTick` directly, for docker/dev), and on `/dev/inbox` a **Run reminders as of…**
  date picker that posts to the endpoint, so the demo can walk a month in a minute.
- Production cadence: a `.github/workflows/reminders.yml` on `schedule: "*/15 * * * *"` that
  curls the endpoint with the secret (the repo has no workflows today, so this is the first;
  Cloud Scheduler is the alternative if the team prefers to keep GitHub out of it).

## 9. The organization side

- Home (`/dashboard`, org branch): counts and links for **Awaiting certification**, **Overdue
  participants**, **Phone tasks**, plus **Manage program**.
- `/certifications` (was the Form certifications tab of `/activity`): list of requests by status;
  detail is the reworked `forms/requests/[id]` page showing month, total vs required, per-type
  breakdown, entries, attestation, then the existing certification language, checkbox, typed
  signature, and after certification the fax panel and download.
- `/organization/[id]/participants`: the roster from `WorkflowEnrollment` with status, current
  period status, last submission, next reminder, and actions **Mark inactive / Withdrew / Lost
  to follow-up** (`transitionEnrollment`). Stretch: **Report a change** fills Section IV of a
  new PA-1938 (actual end date + explanation) and offers the fax panel, covering the SOP's
  10-day reporting rule.
- `/organization/[id]/opportunities/new` and settings: program editor with activity types and
  site manager (§6); CAO office picker (seeded list, plus "add").

## 10. Seed and demo story

Fictional names only, no partner branding. `prisma/seed.ts` creates:

- Participant **Maya Johnson** (`@maya-j`, kept) with an `ACTIVE` enrollment in the program,
  `requiredHoursPerMonth: 80`, service start on the 1st of last month, expected end +6 months,
  `preferredContact: SMS`, SSN last 4 encrypted, three `ActivityLogEntry` rows this month.
- Org **Northside Community Resource Center** (kept) with ADMIN Renee Okafor as site manager,
  and program **Community Health Volunteer Corps** (`isOngoing`, 20/80 hours) with four activity
  types mirroring the REDCap survey: AHA hypertension trainings; conversations about
  hypertension; social-media posts about hypertension; other approved health topics.
- One past `SUBMITTED` period for Maya (form + fax on file) so Form History has a row, and the
  current `OPEN` period with its `ScheduledReminder`s.
- `CaoOffice` "Demonstration County Assistance Office" with a fax number.
- A second participant, **Jordan Lee**, enrolled, no submission, `preferredContact: PHONE_CALL`,
  whose period is 8 days overdue, so the org dashboard has a phone task and the escalation path
  to show.

Demo script (replaces README "Key flows"): sign in as Maya → checklist shows "Submit by" → set
hours target → **Log activities** → choose **Log each activity** → add two records → attest →
sign in as Renee → certify (PDF generated) → fax → back as Maya: "Submitted!" and download. Then
`/dev/inbox` → "Run reminders as of" the 6th of next month → see the DUE/OVERDUE messages and
Jordan's phone task. `e2e/chvc-story.mjs` and `tours/chvc-monthly.storyboard.yml` script the
same beats; `smoke.mjs` is rewritten to the same flow and asserts the generated PDF's
`Estimated Weekly HoursTotal Monthly Estimated Hours` field via pdf-lib, as `pa1895-flow.mjs`
did for PA-1895.

## 11. Implementation order and verification

One PR per row; each leaves `npm run build`, `npm run test:middleware` and `npm run smoke`
green against a fresh `docker compose down -v && npm run docker:up`.

| PR | Scope | Done when |
| --- | --- | --- |
| 1 Strip | §3 deletions, membership simplification, migration squash, minimal seed, nav + middleware, README/DEPLOY | App boots, login and onboarding work, no references to removed models (`tsc` clean) |
| 2 Program + enrollment | `VolunteerOpportunity` rework, `OpportunityActivityType`, `CaoOffice`, `WorkflowEnrollment`, `/enroll` with screening stub, program editor, QR → enroll | Maya can enroll from the program page; org can define activity types |
| 3 Workflow core + checklist | definitions, engine, `ReportingPeriod`, `WorkflowStepState`, Checklist UI, hours-target step, history page | Checklist renders five nodes with correct states; step 1 completes and unlocks step 2 |
| 4 Hours fork | `HoursSubmission`, lines, entries, `/hours*` pages, attest → `FormCertificationRequest` | Both modes reach attest with the same total; switching modes behaves as specified |
| 5 PA-1938 + certify + fax | official AcroForm fill, certify-and-finalize, fax → `SUBMITTED`, draft preview, download for both parties | Generated PDF opens with every field in the §7 table populated; smoke asserts the total field |
| 6 Reminders | `ScheduledReminder`, rules, dispatcher, messaging providers, jobs endpoint + script, dev-inbox controls, GitHub cron | Time-travel run produces the expected `/dev/inbox` rows and the org phone task; completing attest cancels pending rows |
| 7 Demo | full seed, `chvc-story.mjs`, storyboard + tour, README flows | `npm run test:e2e` and `npm run tour:chvc` pass from a clean volume |

Manual end-to-end check after PR 7 is the demo script in §10, run once in the phone shell at
390 px wide (the tour viewport) to confirm the checklist and the stacked records panel fit.

## 12. Decisions made and open questions

Decided in this spike:

- **Remove** per-record verification, PA-1895/shifts/generic forms, and the Phase 5 agency
  stack. **Keep** QR, search, public profiles and share links.
- **The organization submits.** Certify and finalize are one action; fax is the last step. So
  the SSN last 4 is collected at enrollment and stored encrypted (the partner stores it in REDCap
  too); it is decrypted only inside the PDF renderer and never returned by any API.
- **Squash migrations** to a single init; the deployed database is reset once.
- Weekly hours on the form are **actuals** from the attested month, not the 20/80 plan.
- One PA-1938 **per reporting month**, as the partner does today, plus a six-month renewal
  reminder rather than a single six-month form.
- Definitions in **code**, instances in **Postgres**; `completeStep` is the only writer of step
  state.

Open, for the partner:

- Is the due date the 5th of the following month (the mock-up) or the last Thursday (the SOP's
  survey day)? Both are one number on the definition.
- Should the CAO's "MONTHLY HOURS" box ever be filled by the org, or always left to the CAO?
- Does the partner want Section IV "Reporting changes" in the first demo, or is the roster
  status change enough?
- Real sending: Resend and Twilio are the proposed adapters; confirm the partner has, or wants
  us to hold, the sending numbers and domains.
