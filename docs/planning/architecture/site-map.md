# SnappyForms site map, health baseline and reorganization proposal

**As of 2026-10-05.**
- **Surveyed branch:** `ccr-d3cab329-ci4gbj` at `6e64f76`. That is the same commit as `44-bene-pov-dev`: `main` plus the BenePOV pages.
- **Compared against:** `main` at `b03c752`, which is what snappyforms.org serves (see [§1](#1-where-routes-live)), and `postgres-demo`.
- **Generated companion:** [routes.generated.md](./routes.generated.md) / [.json](./routes.generated.json). It has per-route auth, DB dependence, API calls, link graph, design-system drift and test coverage. Regenerate it with `npm run routes` in `frontend/`; `npm run routes -- --check` exits non-zero when it is stale.

Two goals drive this document:
1. **Prototype new visuals quickly with no remote backend**, using the same components and styles as the deployed site.
2. **Keep the current site working** while that happens.

## Summary

- **44 pages and 91 API route files** on this branch; `main` has 41 pages.
  - 7 pages are frontend-only: `/`, `/landing`, `/demo`, and the 4 BenePOV pages.
  - `main` adds an 8th, `/chris-demo`.
  - Every other page needs Postgres. 89 of 91 API routes touch the DB.
- **This branch does not build.** `next build` fails on `/hours`, `/newForm` and `/requirementCheck`: `ReferenceError: localStorage is not defined` from `src/AuthContext.tsx:64` during prerender. The same three pages return **500** in `next dev`. `main` builds cleanly. Merging `44-bene-pov-dev` as it stands would block every App Hosting rollout.
- **Every other page works** against a seeded local Postgres, in a real browser, for the right persona (§3).
- **`npm test` is red on `main` too.** `tests/middleware.test.ts:49` still expects plain http to be upgraded with a 308, but `src/middleware.ts` deliberately removed that check. The chain stops there, so `smoke.mjs`, `shift-flow.mjs` and `pa1895-flow.mjs` never run via `npm test`. Run directly, all three pass: 13/13, 42/42 and 27/27.
- **Production runs with `DEMO_MODE=true`** (`frontend/apphosting.yaml`), and `DEPLOY.md` says it should be false. One consequence: **`/dev/inbox` is reachable on snappyforms.org.** That page lists every login code and magic link the app "sends". Anyone who signs up there with a real address has their login codes on a public page.
- **There are three separate frontend-only prototypes**, each built a different way and none fenced off from production routes:
  - the BenePOV pages (issue #44);
  - `/chris-demo` (#51, merged to `main`);
  - the planned CHVC checklist (`docs/planning/mvp/pa-1938-chvc-poc.md`), which also wants the URL `/hours`.

  The proposal below gives prototypes one home: `/proto`, visible in demo mode only.

## 1. Where routes live

| Surface | Commit | Pages | Notes |
|---|---|---|---|
| snappyforms.org (live) | `main` `b03c752` | 41 | Checked 2026-10-05: `/demo` and `/chris-demo` return 200, `/home` and `/hours` return 404. `postgres-demo` has no `/demo`, so the live site is `main`. |
| `main` | `b03c752` | 41 | Includes `/chris-demo` (PR #51). `/demo` (`DemoLanding`) is still present. |
| `44-bene-pov-dev` / this branch | `6e64f76` | 44 | `main` minus `/chris-demo`, plus `/home`, `/newForm`, `/hours`, `/requirementCheck`. |
| `postgres-demo` | `3676505` | 41 | Old integration branch. Has `/chris-demo` but **no `/demo`**. |
| Local, `npm run dev` | any | — | Frontend-only pages need no `.env`. Everything else needs Postgres. |
| Local, `npm run docker:up` | any | — | Postgres plus the app on :3000, migrated and seeded. |

There is no `backend/` on any branch. The README and DEPLOY.md mention a Django backend, but `backend-django-migration-plan` (PR #37) is documentation only.

## 2. Site map

**Legend:**
- **Auth**
  - `M`: the middleware redirects to `/login` (it checks only that the cookie exists, `src/middleware.ts:5-16`).
  - `P`: public.
  - `D`: only meaningful with `DEMO_MODE=true`.
- **Data**
  - `—`: no DB.
  - `DB`: queries Prisma directly.
  - `API`: calls DB-backed `/api` routes.
- **Health**: result from §3.

### Marketing and demo entry (no DB)
| Route | What it is | Auth | Data | Health |
|---|---|---|---|---|
| `/` | Marketing landing (`LandingPage.tsx`, 452 lines): hero, how it works, for orgs, features, CTA | P | — | 200 |
| `/landing` | Exact duplicate of `/`. Nothing links to it. | P | — | 200 |
| `/demo` | Phase-1 demo landing (`DemoLanding.tsx`): Create account, Register org, Explore → `/login`. Entry point of the Maya tour. | P | — | 200 |
| `/chris-demo` *(main only)* | "Production MVP Preview": portal and volunteer intake/review mockup with sample data (`src/components/demo/*`). Nothing links to it. | P | — | 200 live |

### BenePOV prototype (this branch only, issue #44; no DB)
| Route | What it is | Auth | Data | Health |
|---|---|---|---|---|
| `/home` | Beneficiary home: reminders, quick links, progress stats, an empty "All forms" panel (`BeneHome.tsx`, `src/demo/data/*`). Reached from `/login` → "Demo \| Beneficiary View". | P | — | 200 |
| `/newForm` | Seven-step "Form XX-XXX" checklist (`Checklist.tsx`). Steps unlock through a localStorage counter. | P | — | **500** |
| `/requirementCheck` | Branching work-requirement exemption questionnaire | P | — | **500** |
| `/hours` | "I need N hours each week/month/quarter" | P | — | **500** |

### Sign-in and onboarding
| Route | What it is | Auth | Data | Health |
|---|---|---|---|---|
| `/login` | Code, magic-link and password sign-in, plus demo persona buttons (D) | P | API | 200 |
| `/onboarding` | Choose individual or organization; redirects once onboarded | M | DB | 200 |
| `/onboarding/participant` | Pick a handle and create a participant profile | M | API | 200 |
| `/onboarding/organization` | Register an organization and its handle | M | API | 200 |

### Public pages (no login, DB-backed)
| Route | What it is | Auth | Data | Health |
|---|---|---|---|---|
| `/u/[handle]` | Participant profile, QR, shifts awaiting the viewer's confirmation | P | DB | 200 |
| `/o/[handle]` | Organization profile, QR, "Request verification", next 10 opportunities | P | DB | 200 |
| `/q/[opaqueId]` | QR resolver; redirects to `/u`, `/o` or `/opportunities` | P | DB | 307 → `/u/maya-j` |
| `/share/[token]` | Time-limited public view of a shared record or PDF | P | DB | 200 (not-found state; nothing seeded) |
| `/verify/[id]` | Public verification of a record: valid, revoked or superseded | P | DB | 200 |
| `/shift/[id]` | Volunteer check-in from a rotating shift QR (`?c=`); handles its own sign-in | P | API | 200 |
| `/dev/inbox` | Simulated email/SMS log: login codes, magic links, notifications | D | DB | 200 (**live on production**) |
| `/opportunities` | Opportunity list and search (inside the app shell, but not login-gated) | P | API | 200 |
| `/opportunities/[id]` | Opportunity detail: sign up, `.ics`, check-in, QR | P | API | 200 |
| `/search` | Handle search (inside the app shell, but not login-gated) | P | API | 200 |

### Participant app (`(app)` group with BottomNav)
| Route | What it is | Auth | Data | Health |
|---|---|---|---|---|
| `/dashboard` | Hub with participant, organization and agency sections, shown by role | M | DB | 200 |
| `/qr` | Scan Me, Scan Code and Form Request tabs | M | API | 200 |
| `/notifications` | In-app notifications | M | API | 200 |
| `/settings` | Account card, links, sign out | M | DB | 200 |
| `/settings/handle` | Change handle | M | API | 200 |
| `/settings/sessions` | Devices and sessions, revoke | M | API | 200 |
| `/consent` | Grant or revoke agency access to case hours (Phase 5) | M | API | 200 |

### Activity verification (Phase 2)
| Route | What it is | Auth | Data | Health |
|---|---|---|---|---|
| `/activity` | Records and queue, plus Members, Audit log and Form-certification tabs for org staff | M | API | 200 |
| `/activity/new` | Participant asks an organization to verify an activity | M | API | 200 |
| `/activity/new-for-participant` | Organization logs a record for a participant | M | API | 200 |
| `/activity/[id]` | Record detail: confirm, decline, dispute, revise, revoke, share | M | API | 200 |

### Forms and documents (Phase 3)
| Route | What it is | Auth | Data | Health |
|---|---|---|---|---|
| `/forms` | Form library, PDF generation, my documents, pending; fax and advocacy panels | M | API | 200 |
| `/forms/pa-1938` | Five-step PA 1938 certification request wizard | M | API | 200 |
| `/forms/requests/[id]` | Certify (org) or finalize and download (participant) | M | API | 200, but **stays on "Loading…"** for an unknown id |

### Organization admin (Phase 4 + shifts)
| Route | What it is | Auth | Data | Health |
|---|---|---|---|---|
| `/organization/[id]/settings` | Domains, DNS verification, auto-join, locations | M | API | 200 |
| `/organization/[id]/opportunities/new` | Create a volunteer opportunity | M | API | 200 |
| `/organization/[id]/shifts/new` | Host a rotating-QR shift. **Nothing links to it.** | M | API | 200 |
| `/organization/[id]/shifts/[shiftId]` | Live rotating QR and check-in list | M | API | 200 |

### Agency (Phase 5)
| Route | What it is | Auth | Data | Health |
|---|---|---|---|---|
| `/agency/[id]/cases` | Case list with consent-gated hours | M | API | 200 (React hydration warning: a `<div>` inside a `<p>` around `Badge`) |
| `/agency/[id]/cases/[caseId]` | Case detail, reveal case number | M | API | 200 |
| `/agency/[id]/bulk-query` | Run a bulk query by program | M | API | 200 |
| `/agency/[id]/bulk-query/[jobId]` | Bulk query results | M | API | 200, but **stays on "Loading…"** for an unknown id |
| `/agency/[id]/api-console` | API client, scopes and request log | M | API | 200 |

### API (91 route files)
Per-route methods, auth, rate limiting, callers and tests are in [routes.generated.md](./routes.generated.md#api-routes).

**Auth breakdown:**
- 73 read the session cookie.
- 5 sign in.
- 10 are public.
- 2 take a token in the URL.
- 1 takes agency client credentials (`/api/agency-api/v1/cases/[caseId]/verification`).

**DB use:** only `/api/agency-api/v1/openapi.json` and `/api/qr/[opaqueId]/render` work without the DB. Only `demo-login` and `demo-join` are gated on `DEMO_MODE`.

### Not routed
- `terms/*.md` (terms, privacy, cookies) at the repo root has no page.
- The BenePOV pages planned in issue #44 (Find opportunity, Resource Center, My Documents, Settings) and the Org POV pages in issue #46 (Campaign, Review & Approve, Document Store, History, Metrics) are not built yet.

## 3. Health baseline

**Setup.**
- Postgres 16 running locally, with `prisma migrate deploy` and `prisma/seed.ts` applied.
- `next dev` with `DEMO_MODE=true`.

**Browser pass.**
- Each page was opened in Chromium (Playwright) after a `demo-login` as the matching persona:
  - Maya for participant pages;
  - Renee (`northside-admin`) for organization pages;
  - Dana (`dcao-admin`) for agency pages;
  - no login for public pages.
- For each page the pass recorded:
  - document status;
  - final URL;
  - uncaught page errors;
  - any `/api` response of 500 or above;
  - console errors.

**Anonymous pass.** The same URLs were fetched again without a cookie.

| Check | `44-bene-pov-dev` (this branch) | `main` |
|---|---|---|
| `tsc --noEmit` | pass | pass |
| `next build`, no `DATABASE_URL` | **fail**: prerender of `/hours`, `/newForm`, `/requirementCheck` | pass (51 static outputs) |
| Pages as their persona | 41 × 200 (two after redirects: `/q` → `/u/maya-j`, `/onboarding` → `/dashboard`), **3 × 500** (the three above) | not run (same pages minus BenePOV) |
| Uncaught page errors / API 5xx in the browser | none | — |
| Anonymous, `M` routes | all 26 → 307 `/login?next=…` | — |
| `npm test` | **fail** at `test:middleware`, so the rest is skipped | **fail**, same assertion |
| `smoke.mjs` / `shift-flow.mjs` / `pa1895-flow.mjs`, run directly | 13/13, 42/42, 27/27 | — |

**Smaller things the browser pass surfaced:**
- `/forms/requests/[id]` and `/agency/[id]/bulk-query/[jobId]` sit on "Loading…" forever when the API returns 404. There is no not-found state.
- `/agency/[id]/cases` has a hydration warning: `Badge` renders a `<div>` inside a `<p>`.
- `/home` triggers a React "missing key" warning (`BeneHome.tsx:35`).
- `/` and `/landing` load Google Fonts at runtime through a CSS `@import` (`LandingPage.tsx`). Where fonts.googleapis.com is blocked, the page falls back to system fonts.

**Not seeded, so only the not-found path was exercised:** share links, form-certification requests, generated forms, bulk-query jobs, and a hosted shift (no opportunity has a `totpSecret`).

**How to reproduce:** see the "Prototyping and baseline" follow-up in §6. The baseline script was run ad hoc and is not committed, because this change is docs only.

## 4. Findings

**Blocking or security**
1. **This branch can't build.** `src/AuthContext.tsx` reads `localStorage` in `useState` initialisers (lines 64-74), and those run during prerender.
   - The context was written for a different backend (`api/auth/me`, `api/auth/login` and `api/auth/register` with a Bearer token), and none of those routes exists here.
   - The three pages use it only as a localStorage step counter.
2. **`/dev/inbox` and the demo-login buttons are live on production.** `frontend/apphosting.yaml` sets `DEMO_MODE` and `NEXT_PUBLIC_DEMO_MODE` to `"true"`, which contradicts `DEPLOY.md` §3. This is a decision for the team; if production stays in demo mode, make sure nobody signs up there with a real address.
3. **There is no CI.** `.github/` doesn't exist, so nothing builds or tests a PR before it merges, and finding 1 would only show up as a failed App Hosting rollout.
   - There is also no ESLint config, so `next lint` would stop at an interactive setup prompt.
   - `npm test` is red on both `main` and this branch (finding 6).

**Correctness and UX**

4. **Dead or suspicious links** (from [routes.generated.md](./routes.generated.md#dead-or-suspicious-links)):
   - `BeneHome` has 3 quick links with `href=''`.
   - `Checklist` uses the relative hrefs `requirementCheck` and `hours`, and 5 of its 7 steps point at the exemption page.
   - `LandingPage` links to the relative `./demo`.
5. **Orphans** (nothing links to them): `/landing`, `/chris-demo` (on main), `/organization/[id]/shifts/new`, `/hours`, `/requirementCheck`.
   - `/q`, `/share`, `/shift` and `/verify` are reached by QR or shared links, which is expected.
   - The "Host a shift" page has no entry point in the UI.
6. **`tests/middleware.test.ts:47-49` is stale.** It asserts the protocol upgrade that `src/middleware.ts` (the comment above `canonicalRedirect`) deliberately removed.
7. **`/api/share-links/[id]/revoke` has no caller,** yet `ShareLinkPanel.tsx:93` promises "You can revoke it early anytime".
8. **Duplicate JSON APIs.** Nothing calls `/api/share/[token]` or `/api/verify/[id]`, because their pages read the DB directly. Either remove them or document them as the public API.
9. **`/search` and `/opportunities` are inside the `(app)` shell, so they show BottomNav, but they are not login-gated.** Signed-out visitors see the app nav. Decide whether that is intended.

**Design-system drift**

The deployed system is:
- Tailwind tokens in `src/app/globals.css` (`--primary` teal-green, `--secondary` violet, `--border`, `--muted`, …);
- the primitives in `src/components/ui/*` (Button, Badge, Card, Input, Dialog, Tabs, Avatar);
- the mobile column in `src/app/layout.tsx`.

There is no Select, Textarea or Label primitive. The established pattern is a token-styled native element (`ActivityFieldsForm.tsx:50`). Prototypes bypass all of this:

| Surface | Hard-coded colours / raw controls | How |
|---|---|---|
| `/` and `/landing` | 127 / 0 | Inline `hsl()` copies of the tokens; fonts via `@import`; breaks out of the column with `99vw` |
| `/chris-demo` (main) | 259 / 48 | Hex colours (`bg-[#F5F6F3]`); escapes the layout with `fixed inset-0 z-[100]` |
| BenePOV (4 pages) | 70 / 5 | `emerald-*`/`slate-*`/`oklch()`; `<a>` wrapping `<button>` |
| The whole DB-backed app (52 files, each counted once) | 23 / 41 | 3 of the colours are the BenePOV button on `/login`; most raw controls are token-styled `<select>`/`<textarea>`, the accepted pattern |

`DemoLanding.tsx` and `AdvocacyPanel.tsx` are the reference for token-only styling.

**Hygiene**

10. The `firebase` npm dependency is never imported.
11. The README references `backend/` and `ROADMAP.md`, and neither exists.
12. `e2e/screenshots/` has colliding names: from `maya-07` on, numbers repeat. Screenshots aren't named by route, so they can't be mapped to pages automatically.
13. The `(app)` BottomNav polls `/api/notifications/unread-count` on every route change. That is why all 26 app pages need the DB even to render their chrome.

## 5. Reorganization proposal

**Principle: fence off prototypes; don't move working routes yet.** Moving production pages into new route groups now would only churn files that open work depends on, with no URL change to show for it. Instead, give every frontend-only prototype one home with one set of rules, and use redirects to keep old links working.

### 5.1 `/proto`: one home for every no-backend prototype

```
src/app/proto/
  layout.tsx            Prototype banner, robots: noindex, notFound() unless NEXT_PUBLIC_DEMO_MODE === "true"
  page.tsx              Index built from src/proto/registry.ts (title, owner, issue, status)
  kit/page.tsx          Live gallery: every src/components/ui variant + every globals.css token
  bene/home|checklist|exemptions|hours/page.tsx      ← /home, /newForm, /requirementCheck, /hours
  portal/, volunteer/   ← /chris-demo (only with the author's agreement)
src/proto/
  registry.ts           One entry per prototype; #44/#46 pages listed as "planned"
  fixtures/             Typed sample data built from the seed personas (Maya, Northside, Keystone, DCAO)
  types.ts              Mirrors the real /api/me, /api/activity, /api/opportunities, /api/notifications shapes
  useProtoState.ts      SSR-safe localStorage state (replaces AuthContext)
```

**Visibility.** `/proto` shows only in demo mode, which matches the team's decision. That means `npm run dev`, the docker stack, and snappyforms.org while production runs with `DEMO_MODE=true`. It disappears automatically from any real deployment.

**The fence rule.** Nothing under `src/app/proto` or `src/proto` may import `@/lib/db`, `@prisma/client` or `@/lib/auth/*`, or name an `/api` route. A small import-graph test enforces it. The result:
- prototypes run with no `.env`;
- they can't break or touch production data;
- they use the real `src/components/ui` and tokens because those are the only things available.

**Graduation.** Fixtures are typed against the real response shapes listed in `types.ts`. Promoting a prototype means swapping the fixture import for a `fetch` of the same type and moving the page out of `/proto`.

**Redirects** (`next.config.js`, all `permanent: false`, so the URLs can be reused later):

| From | To | Why |
|---|---|---|
| `/home` | `/proto/bene/home` | Moves into `/proto` |
| `/newForm` | `/proto/bene/checklist` | Moves into `/proto` |
| `/requirementCheck` | `/proto/bene/exemptions` | Moves into `/proto` |
| `/hours` | `/proto/bene/hours` | Frees `/hours` for the CHVC POC's real, protected route |
| `/landing` | `/` | Duplicate |

`/login`'s "Demo | Beneficiary View" button would point at `/proto`.

### 5.2 Keep as is
- `/demo` stays. It is the Maya tour's entry point (`e2e/tours/maya-confirmation.storyboard.yml:26,115,159`) and the target of 3 `LandingPage` links.
  - PR #51 as merged kept it. Its branch form, still on `postgres-demo`, replaced it.
  - If `postgres-demo` is ever merged forward, `/demo` must survive. That is noted here for the #51 author rather than acted on.
- All DB-backed URLs stay unchanged.

### 5.3 Later: route groups with no URL change
Once the CHVC strip (`pa-1938-chvc-poc.md` §3) and the `/proto` move land:
- `(marketing)`: `/`, plus terms pages rendered from `terms/*.md`;
- `(auth)`: `/login`, `/onboarding/*`;
- `(public)`: `/u`, `/o`, `/q`, `/share`, `/shift`, and `/verify` if it survives the strip;
- `(app)`: unchanged;
- `dev/`: `/dev/inbox`.

Doing this after the strip avoids moving files that are about to be deleted.

## 6. Phased follow-up

Each phase is its own PR, and each must leave `next build` and the health baseline green.

1. **Unblock (smallest, do first).** Fix `AuthContext` so it doesn't touch `localStorage` during render, or replace it with `useProtoState`. That makes this branch build again.

   Separately, on `main`: fix the stale assertion in `tests/middleware.test.ts`, and decide on production `DEMO_MODE`.
2. **`/proto` scaffold.**
   - `layout.tsx` with the gate, banner and noindex.
   - The registry index.
   - The `kit` gallery.
   - `fixtures/`, `types.ts` and `useProtoState.ts`.
   - The fence test (`tests/proto-isolation.test.ts`, added to `npm test`).
3. **Move BenePOV into `/proto/bene/*`** and convert it to tokens and primitives: `Card`, `Button asChild` instead of `<a><button>`, token-styled native `<select>`. Add the redirects in §5.1 and delete `src/AuthContext.tsx` and `src/demo/`.
4. **Route health check and CI.**
   - `scripts/check-routes.mjs` reads `routes.generated.json` and GETs every page as its persona; any 5xx fails it.
   - Add `npm run smoke:routes`.
   - Add `.github/workflows/frontend-ci.yml` running:
     - `npm ci`, `tsc` and `next build` with no DB;
     - `routes -- --check`;
     - the unit tests and the fence test;
     - `next start` with no DB, where `/` and `/proto/*` must return 200.
5. **With the #51 author:** move `/chris-demo` to `/proto/portal` and `/proto/volunteer`, and redirect the old URL.
6. **Seed the missing fixtures** (a share link, a certification request, a generated form, a hosted shift, a bulk job) so the health check covers every page's happy path, not just its not-found state.
7. **Route groups** (§5.3), after the CHVC strip.

## 7. Information to gather during the reorg

**Automated.** These are already in [routes.generated.md](./routes.generated.md); re-run `npm run routes` after any route change:
- render mode;
- auth source;
- DB dependence (direct, or through `/api`);
- `DEMO_MODE` gating;
- `/api` calls per page and callers per API route;
- link graph: inbound links, orphans, dead links;
- references that match no API route;
- design-drift counts;
- which smoke, e2e or tour script touches each route.

**Coverage today.**
- 29 of 44 pages and 78 of 91 API routes are not referenced by any test script.
- The browser baseline (§3) covered all 44 pages, but it is not committed yet (phase 4).

**Manual: please confirm or fill in.**
- *Origin* comes from the README phases and git history.
- *CHVC fate* comes from `pa-1938-chvc-poc.md` §3.
- *Persona* and *Owner* need the team.

| Route(s) | Persona | Origin | CHVC fate | Owner |
|---|---|---|---|---|
| `/`, `/landing` | visitor | Landing (#22) | keep (`/landing` → redirect) | |
| `/demo` | visitor | Landing vs demo (#7) | keep | |
| `/chris-demo` | partner | #50/#51 | → `/proto` | |
| `/home`, `/newForm`, `/requirementCheck`, `/hours` | participant | BenePOV (#44) | → `/proto`; CHVC builds the real checklist and `/hours` | |
| `/login`, `/onboarding/*` | all | Phase 1 | keep (onboarding gains enrollment) | |
| `/dashboard` | all | Phase 1 | rework (checklist / queue) | |
| `/qr`, `/search`, `/u`, `/o`, `/q`, `/settings/*`, `/dev/inbox` | all | Phase 1 | keep | |
| `/notifications` | all | Phase 2 | keep | |
| `/activity/*`, `/verify/[id]` | participant, org | Phase 2 | remove | |
| `/forms` | participant | Phase 3 | rework ("My documents") | |
| `/forms/pa-1938` | participant | Phase 3 | remove (inputs come from enrollment) | |
| `/forms/requests/[id]` | participant, org | Phase 3 | keep | |
| `/share/[token]` | public | Phase 3 | keep (forms only) | |
| `/opportunities/*`, `/organization/[id]/opportunities/new` | participant, org | Phase 4 | keep (reworked) | |
| `/organization/[id]/settings` | org admin | Phase 4 | rework (drop domains and locations) | |
| `/organization/[id]/shifts/*`, `/shift/[id]` | org, volunteer | Rotating QR (#5) | remove | |
| `/agency/*`, `/consent` | agency, participant | Phase 5 | remove | |

**Open questions for the team**
1. **Production `DEMO_MODE`:** keep `true`, which keeps `/dev/inbox`, the demo logins and `/proto` public, or switch to `false` as `DEPLOY.md` says?
2. **Live branch:** confirm in the Firebase console that App Hosting deploys `main`. The live routes match `main`, but older commits say `postgres-demo`.
3. **Is `postgres-demo` retired?** It still lacks `/demo` and should not be merged forward as is.
4. **Should signed-out visitors see the app shell** on `/search` and `/opportunities`?
5. **Who owns each prototype,** for the `/proto` registry and the Owner column above?
