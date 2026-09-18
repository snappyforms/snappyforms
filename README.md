# SnappyForms (Phase 1 + 2 + 3 + 4 + 5 prototype)

SnappyForms — **ver**ify **w**ork and volunteer activity — is a hackathon-sprint demonstration of a
Venmo-simple way for people to build portable, trusted records of work, volunteer, education, and
training activity, and for organizations to verify them.

**This is a demonstration prototype.** It does not determine benefit eligibility, is not
affiliated with or a system of the Pennsylvania Department of Human Services, and never transmits
real records to any government agency. All data described below is fictional.

This build covers **Phase 1 — Core demonstration** (authentication, handles, QR generate/scan,
search, profile dashboards), **Phase 2 — Verification** (activity requests/records, the
confirmation workflow, revisions, disputes, notifications, audit log, fraud-review flags),
**Phase 3 — Documentation** (PDF form generation, the QR hub's Form Request tab, time-limited
share links, public verification pages), **Phase 4 — Organization model** (domain verification,
membership joining with a trust-then-ratify model, locations, volunteer opportunities, and a
member accountability dashboard), and **Phase 5 — Future integration demonstration** (fictional
benefit-program case data with encrypted case numbers, a participant consent center, and a
simulated agency API with client-credential auth, scopes, a request audit trail, and a bulk-query
tool). See [ROADMAP.md](./ROADMAP.md) for what's deliberately still out of scope and
[SECURITY.md](./SECURITY.md) for the prototype's known limitations.

## Stack

Next.js 14 (App Router) + TypeScript + Tailwind CSS, hand-built shadcn/ui-style components on top
of Radix primitives, Prisma + PostgreSQL, Zod validation, `qrcode` + `jsqr` for QR generate/scan,
`pdf-lib` for PDF generation.

## Getting started

```bash
npm install
cp .env.example .env   # then set DATABASE_URL to your Postgres connection string
npm run db:migrate     # applies the schema to your database
npm run db:seed        # seeds demo accounts
npm run dev            # http://localhost:3000
```

Any PostgreSQL works — a local instance or a hosted provider (Neon, Supabase, RDS, …).
A quick browserless smoke test (`npm run smoke`) logs in and exercises the core
Postgres-backed flows against a running server (defaults to `http://localhost:3000`,
override with `BASE_URL`).

## Demo accounts

Every seeded account shares the password `VerwovoDemo!1` (password sign-in tab), but the fastest
path is the **demo-login buttons** on `/login` (only shown when `DEMO_MODE=true`):

| Account | Handle | Role |
|---|---|---|
| Maya Johnson | `@maya-j` | Participant |
| Northside Community Resource Center (Renee Okafor) | `@northside-center` | Organization admin |
| Keystone Neighborhood Services (Sam Whitfield) | `@keystone-services` | Business admin |
| Demonstration County Assistance Office (Dana Whitfield) | — (no public profile) | Agency admin |

Also seeded for Phase 4 demos (sign in with the email + `VerwovoDemo!1`, no demo-login button):
`jamie@northside-center-demo.org` (Jamie Rivera — `PENDING` Northside member with an
unratified first approval already on the books) and `taylor@keystone-services-demo.com`
(Taylor Reed — `REQUESTED` Keystone join, waiting on Sam's approval).

**Simulated agency API credentials** (Phase 5) — `clientId: demo-dcao-eligibility-system`,
`secret: demo-agency-secret-123`. Try it directly:
```bash
curl -X POST http://localhost:3000/api/agency-api/v1/cases/<caseId>/verification \
  -H "x-snappyforms-client-id: demo-dcao-eligibility-system" \
  -H "x-snappyforms-client-secret: demo-agency-secret-123"
```
(Find a real `<caseId>` from the seed script's console output, or from `/agency/[id]/cases` once
signed in as the DCAO Admin.)

## Reading verification codes / magic links

This prototype never sends real email or SMS. Every "send" is written to the database and shown
at **`/dev/inbox`** — open it in a second tab while testing the code/magic-link login flow.

## Key flows to try

1. **Landing → Create My Account** → sign in with a new email via the code flow → code appears in
   `/dev/inbox` → verify → choose "I'm an individual" → pick a handle → land on your dashboard.
2. **QR → Scan Me** for your own handle: print/share/save-image all work; the QR encodes only an
   opaque ID, never your name or handle.
3. **QR → Scan Code**: point your camera at another account's QR (e.g. pull up `@northside-center`'s
   Scan Me on a second device/tab) — or use manual handle entry if the camera is unavailable.
4. **Search** for `@northside-center` or "Keystone" and open its public profile.
5. **Settings → Devices & sessions**: see your current session, sign out of other devices.
6. **Request verification**: as Maya, open `@northside-center`'s profile → "Request verification"
   → submit an activity → log in as the Northside admin → `/activity` → open the request → check
   the checkbox → **Confirm Record**. Watch `/notifications` and `/dev/inbox` update for Maya.
7. **Org-initiated record**: as an org member, `/activity/new-for-participant` → search for
   `@maya-j` → pick category "Volunteer" → it confirms immediately. Pick "Work" instead and it goes
   to Maya as "Awaiting participant" for her to accept or dispute.
8. **Correction & audit trail**: on any confirmed record, "Correct record" creates a linked revision
   (the original becomes "Superseded"); org admins see every state change in `/activity`'s
   **Audit log** tab.
9. **Generate a document**: as Maya, `/forms` → Generic Monthly Volunteer Summary → choose her
   confirmed volunteer records → Generate → download the PDF (note the required "Draft prepared by
   SnappyForms" notice).
10. **Share & verify**: from `/activity/[id]` on a confirmed record, from `/forms` → My documents,
    or from `/qr`'s **Form Request** tab, tap Share → pick an expiration → confirm → open the
    resulting `/share/[token]` link in a private/incognito tab to see the public safe view with no
    login. `/verify/[id]` (the record's own ID) shows the same kind of view directly — try it on a
    revoked or superseded record to see the other states.
11. **Collaborative PA 1938 certification**: as Maya, `/forms/pa-1938` → pick an org and fill in
    volunteer + service info → send for certification (no signing happens here). Switch to the
    Northside admin → `/activity` → **Form certifications** tab (or the notification) → open the
    request → **Certify** with the exact spec certification language + checkbox. Back as Maya →
    `/forms` → **Pending** tab → open the now-certified request → **Finalize & Download**,
    optionally adding a test SSN last-4 → download the PDF. Confirm in `npx prisma studio` that the
    SSN was never written to `FormCertificationRequest` or `GeneratedForm`.
12. **Organization trust model**: sign in as Renee (`@northside-center`) → `/activity` → **Members**
    tab → see Jamie Rivera in **Needs ratification** (they already confirmed a record as a `PENDING`
    member) → **Ratify** → Jamie flips to `ACTIVE`. Sign in as Sam (`@keystone-services`) →
    **Members** tab → **Join requests** → **Approve** Taylor Reed → they become `PENDING` and can
    immediately confirm/decline records without further admin action.
13. **Domains & locations**: as Renee, `/dashboard` → **Manage organization** (admin-only) →
    `/organization/[id]/settings` → claim a new domain, see the simulated DNS-token instructions,
    **Verify domain**, toggle auto-join → add a location.
14. **Volunteer opportunities**: as Maya, `/dashboard` → **Browse volunteer opportunities** →
    open "Weekend Food Pantry Volunteer" → **Sign up** → **Add to calendar** downloads an `.ics`
    file → **Show QR** displays the opportunity's check-in code → **Check in** → **Request
    verification** hands off into `/activity/new` prefilled with Northside and the opportunity
    title.
15. **Consent-gated agency case view**: sign in as DCAO Admin → dashboard's agency section →
    **Cases** → one of Maya's cases already shows confirmed hours (consent was pre-granted), the
    other shows "No consent — hours not shared." Sign in as Maya → `/consent` → **Grant** on the
    second case → sign back in as DCAO Admin and refresh — hours now show. Revoke it as Maya and
    watch it flip back. On a case detail page, **Reveal case number** (admin-only) decrypts and
    shows the real value once; confirm in `npx prisma studio` that
    `ParticipantCase.caseNumberEncrypted` is never a readable string.
16. **Bulk query & API console**: as DCAO Admin, **Bulk query** → pick a program → run it → the
    results page lists every open case, explicitly marking any without consent as excluded rather
    than silently skipping it. **API console** shows the seeded client's `clientId`/scopes (never
    the secret) plus a live log of every call to the simulated `curl`-able endpoint above,
    including auth failures.

## Project layout

```
prisma/schema.prisma   Full data model through Phase 5 (see comments for what's intentionally excluded)
prisma/seed.ts         Demo data — activity records, org/opportunity data, and the Phase 5 agency/case data
src/lib/                 db client, auth, qr, validation, activity.ts (fraud flags + status rules +
                         verifier-eligible membership + ratification tracking), formCertification.ts
                         (PA 1938 certification status rules), notify.ts, audit.ts, formTemplates.ts
                         (static form library config), verification.ts + shareLinks.ts (public
                         safe-view logic), pdf/ (pdf-lib rendering), encryption.ts (AES-256-GCM case
                         number encryption), caseHours.ts (consent-gated hours view), agency.ts
                         (agency membership helpers), apiRequestLog.ts, agencyApiOpenapi.ts
src/components/ui/       Hand-built shadcn-style primitives (Button, Input, Card, Tabs, Dialog, ...)
src/components/          App-specific components (QrScanner, HandlePicker, LoginForm,
                         ActivityFieldsForm, ShareLinkPanel, JoinableOrgsBanner, ...)
src/app/                 Routes — see ROADMAP.md and the plan for the full route list
src/middleware.ts        Protects /dashboard, /qr, /settings, /onboarding, /activity, /notifications,
                         /forms, /organization, /agency, /consent — /opportunities, /verify,
                         /share, and /api/agency-api (client-credential auth, not session cookies)
                         are deliberately public/unprotected, like /u and /o
```

## Database

PostgreSQL via Prisma. The data-access layer (`src/lib/db.ts`, plain Prisma Client calls
throughout) is provider-agnostic, so the app runs against any Postgres — local or hosted.
Point `DATABASE_URL` at your database and run `npm run db:migrate`.

Useful commands: `npm run db:studio` (browse data), `npm run db:reset` (wipe + reseed).

## Containerized environment (no host installs)

A self-contained Docker stack runs Postgres + the app + the Playwright browser tests
without installing Node, browsers, or a database on your machine, and without touching
any remote database. Requires only Docker (on WSL, enable Docker Desktop's WSL
integration).

```bash
npm run test:e2e     # build + run Postgres + app + Playwright; exits with the test result
npm run docker:up    # just the app + Postgres at http://localhost:3000 (no tests)
npm run docker:down  # stop everything and drop the Postgres volume
npm run tour:maya    # record the partner-facing video tour (see "App tours" below)
```

Run these from the repo root — `docker-compose.yml` lives there, not in `frontend/`.

- `docker/Dockerfile.app` — builds and serves the Next app (the `webapp` service); applies migrations and seeds on start.
- `docker/Dockerfile.pw` — official `mcr.microsoft.com/playwright` image (browsers + system libs baked in), pinned to the project's Playwright version.
- `docker/Dockerfile.video` — the Python Playwright image plus `shot-scraper`, for recording app tours.
- `docker-compose.yml` — wires the services together with health-gated startup: `db`, `webapp`, `pw-tests`, the three demo-story runners (`demo-stories`, `shift-story`, `maya-story`, which write stills to `frontend/e2e/screenshots/`), and `tour`.

Two test entry points: `npm run smoke` (browserless `fetch`, runs anywhere against a
live server) and the containerized `pw-smoke.mjs` (real Chromium, driven via `npm run test:e2e`).

## App tours

Short videos of real flows, for partners who want to see how the app works without
signing in. A tour is a **storyboard** — one YAML file in `frontend/e2e/tours/` that
[shot-scraper](https://shot-scraper.datasette.io/en/stable/video.html) plays through
Playwright while recording. The YAML is the source; the MP4 is build output.

```bash
docker compose down -v                                  # fresh seed: the tour needs one
docker compose up --build --exit-code-from tour tour
```

Video and per-beat stills land in `frontend/e2e/tours/output/`. Selectors are taken
from the story scripts that already assert on them (`frontend/e2e/*.mjs`) — fix those
first when the UI moves. Writing a new tour: see `.claude/skills/app-tour/SKILL.md`;
background and tool choice: `docs/spikes/41-app-tours.md`.
