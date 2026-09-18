# Plan: Move the SnappyForms backend from Next.js to Django

> **Status:** Milestone **M0a (repo restructure) is done** — the Next.js app now
> lives in `frontend/` (see PR "Restructure into frontend/ + backend/ monorepo
> layout"). This document is the roadmap for **M0b onward**: building the Django
> backend in `backend/`. A fresh session can start at M0b.

## Context

SnappyForms runs today as one Next.js 14 app. Next.js does two jobs at once:
it serves the React UI, and it answers all API calls under `frontend/src/app/api/**`
(91 route files) using Prisma against PostgreSQL.

The goal is to keep the React frontend as-is and move all backend logic to a
new Django app. The existing database data is disposable, so Django does not
need to read or decrypt any existing rows. Django starts from a fresh database.

This plan produces a **Django + Django Ninja** backend that answers the same
`/api/...` endpoints with the same JSON, so the React frontend does not change.
Django Ninja gives a FastAPI-style experience: request and response schemas are
**Pydantic models**, and it auto-generates OpenAPI/Swagger docs from them. It
runs on plain Django ORM, migrations, and auth.

## Locked decisions

- **Architecture:** keep the React frontend. Django serves only JSON APIs.
- **API framework:** Django Ninja. Pydantic request/response schemas and
  auto-generated OpenAPI/Swagger docs, FastAPI-style.
- **Frontend types:** generate Zod schemas + TS types from Ninja's OpenAPI spec.
  Pydantic is the single source of truth; the frontend contract is generated,
  not hand-written.
- **Wiring:** Next.js `rewrites()` proxy `/api/*` to Django. The browser sees
  one origin. The login cookie stays first-party. No CORS. No CSRF cross-origin
  work. The frontend `fetch("/api/...")` calls do not change.
- **Repo:** symmetric monorepo. The Next.js app is in `frontend/` (it keeps its
  own `src/`), and the Django project goes in `backend/`. Repo-level files
  (docker-compose.yml, README, ROADMAP, SECURITY, DEPLOY, .github) stay at root.
  All `src/...` paths in this document are relative to `frontend/`.
- **Cutover:** big-bang. Build the whole Django API, flip the proxy, then delete
  the TypeScript API.
- **Data is disposable:** Django uses its own crypto. It must match behavior and
  the API contract, not byte-for-byte storage.

## Target architecture

```
Browser ──▶ Next.js (:3000)  ──rewrite /api/*──▶  Django Ninja (:8000)  ──▶  Postgres
             serves React                          all backend logic
```

The browser never talks to Django directly. This choice is reversible: a future
mobile app can add token auth to the same Django backend without changing this.

## Repo layout

Symmetric two-service monorepo (M0a done):

```
snappyforms/
  frontend/            the entire Next.js app (keeps its own src/)
    src/ package.json next.config.js tsconfig.json tailwind.config.ts
    prisma/ scripts/ docker/ e2e/ smoke.mjs shift-flow.mjs pa1895-flow.mjs
    firebase.json apphosting.yaml
  backend/             new Django + Ninja app (see layout below)
  docker-compose.yml   root; orchestrates both services
  README.md ROADMAP.md SECURITY.md DEPLOY.md .github/   root-level
```

**Deploy note (from M0a):** the Firebase App Hosting backend **root directory**
must be set to `/frontend` before the next rollout, or the build will not find
the app. The GitHub Hosting workflows and docker-compose contexts already point
at `frontend/`.

## Contracts the frontend depends on (must match exactly)

1. **URL paths** of ~60 endpoints under `/api/...` (see the route catalog in the
   milestones below).
2. **JSON response shapes.** Define one Pydantic `Schema` per response shape, and
   set it as the endpoint's `response=` model. Match key names, nesting, and null
   rules. The schemas double as the auto-generated OpenAPI contract.
   - `GET /api/me`: `{ user: null }` when logged out. Else
     `{ user: { id, email, phone, participant: {displayName, handle, qrId,
     searchable}|null, organizations: [{id, name, handle, role, qrId,
     membershipDisplayName}] } }`. Note: `/api/me` does **not** include agencies.
3. **Error envelope** (`src/lib/apiError.ts`): `{ "error": "<code>", ...optional }`.
   Optional keys: `details` (Zod flatten shape), `retryAfterMs`, `message`.
   Codes in use include `invalid_input`, `rate_limited`, `unauthenticated`,
   `invalid_identifier`, `unexpected_error`, plus domain codes like
   `demo_mode_disabled`, `already_checked_in`, `consent_required`, `not_found`.
   A single Ninja exception handler (`api.exception_handler`) must reproduce this
   envelope. Do not use Ninja's default `{"detail": ...}` error shape.
4. **Session cookie:** name `verwovo_session` (from `src/lib/constants.ts`),
   HttpOnly, SameSite=Lax, Path=/, Max-Age 604800 (7 days). Secure flag gate:
   `secure = not DEBUG and INSECURE_HTTP_COOKIES != "true"`.
   The Next middleware only checks cookie **presence** for the protected
   prefixes, so Django only needs to set this exact name on login.
5. **DEMO_MODE behavior:** demo-login for 4 seeded accounts, demo-join guest
   identities, and the `/dev/inbox` dev-notification list. Django reads
   `DEMO_MODE`. The frontend keeps `NEXT_PUBLIC_DEMO_MODE` for UI.

## Django project layout (`backend/`)

Each app holds `models.py`, a `schemas.py` (Pydantic request/response models),
and an `api.py` (a Ninja `Router`). One root `NinjaAPI` in `config/` mounts each
router under `/api/...` and serves the auto-generated OpenAPI docs. Ports of the
business logic (`activity.py`, `formCertification.py`, PDF, TOTP, encryption)
live in `services/` modules, unchanged by the framework choice.

Model-to-app map:

- **accounts:** User, Session, AuthenticationMethod, VerificationCode, Handle,
  ParticipantProfile, QRIdentifier. Holds all auth logic.
- **organizations:** Organization, OrganizationMembership, OrganizationDomain,
  OrganizationLocation, VolunteerOpportunity, OpportunitySignup.
- **activity:** ActivityRecord, RecordConfirmation, RecordDispute,
  FraudReviewFlag.
- **forms:** GeneratedForm, FormCertificationRequest, FaxTransmission,
  AdvocacyMessage.
- **agency:** Agency, AgencyMembership, BenefitProgram, ParticipantCase,
  Consent, BulkQueryJob, BulkQueryResult.
- **agency_api:** APIClient, APIRequest, and the external partner endpoint.
- **common:** AuditLog, Notification, DevNotification, the error handler, the
  rate-limit helper, the audit/notify services.
- **sharing:** ShareLink and the public read endpoints.

Cross-app foreign keys use string model references (`"app.Model"`). Order the
migrations to resolve the FK cycles (QRIdentifier→organizations,
OpportunitySignup→activity, forms→agency/activity).

## Data model note: keep string primary keys

The Prisma models use `cuid()` string IDs. `QRIdentifier` and `ShareLink` use
`uuid()`. The frontend puts these IDs in URLs and treats them as strings.

A Django `BigAutoField` would serialize `id` as a JSON number and break the
contract. So every model must set an explicit string PK:
`id = CharField(primary_key=True, default=<cuid>, ...)`. Add `common/ids.py`
with a `cuid` callable (the `cuid2` package) and a `uuid4` callable. Because the
database is fresh, no data migration is needed.

## Auth design

Use a **custom Ninja auth callable over a ported `Session` model**. Do not use
`django.contrib.sessions` (wrong cookie name and table) and do not use DRF.

- `Session` model: `token_hash` (unique), `user_agent`, `ip_address`,
  `expires_at`, `revoked_at`, `last_seen_at`.
- `CookieSessionAuth(request)`: read the `verwovo_session` cookie, hash it with
  SHA-256, find a non-revoked non-expired `Session`, return the user (or `None`).
  Set it as the router-level `auth=` on protected routers. Public endpoints use
  `auth=None`.
- Cookie helper `set_session_cookie(response, token)` sets the exact name and
  flags above. `logout` deletes the cookie.
- Do **not** enable Django CSRF on these endpoints. Ninja does not enforce CSRF
  by default; keep it off. The cookie is SameSite=Lax and the frontend sends no
  CSRF token today.

Auth flows to port (all POST unless noted):

- `request-code`: 6-digit OTP, SHA-256 at rest, 10-min TTL, 5 attempts, 45s
  cooldown, 5/hr per identifier. Write a `DevNotification` row instead of
  sending. `verify-code`: create user + session, return `{ok, needsOnboarding}`.
- `magic-link/request` (POST) and `magic-link/consume` (GET): random token,
  SHA-256 at rest.
- `password-login`: bcrypt via the `bcrypt` package, rate-limit 8/15min.
- `demo-login` and `demo-join`: 403 `demo_mode_disabled` when DEMO_MODE is off.
- `logout`, `sessions` (GET), `sessions/[id]/revoke`, `sessions/revoke-all`.

Port the rate limiter (`src/lib/auth/rateLimit.ts`) onto Django's cache
framework. Keep the same numeric limits. `find_or_create_user_by_identifier`
and `needsOnboarding` (no participant profile AND no org memberships AND no
agency memberships) drive the post-login redirect.

## Python library choices

- **TOTP (shift check-in):** port `src/lib/shiftTotp.ts` line-for-line with
  `hmac`/`hashlib`/`struct`. Do **not** use pyotp. The scheme is HMAC-SHA256,
  8 digits, 30s step, skew ±1, hex secret. Keep `totpSecret` out of every
  response schema.
- **Case-number encryption:** use Fernet (`cryptography.fernet`). Derive the key
  from `CASE_DATA_ENCRYPTION_KEY`. Keep `caseNumberLast4` in plaintext for list
  views and the masked display strings. Decrypt only inside the audited,
  rate-limited reveal endpoint.
- **QR:** use `qrcode` or `segno`. Reproduce the data-URL PNG for the render
  endpoint and the server-rendered pages.
- **PDF:**
  - `pa1895.ts` fills a real AcroForm. Copy the template asset
    `src/lib/pdf/templates/pa1895.pdf` to `backend/forms/templates/` byte-for-byte.
    Use `pypdf` to set the exact named fields. Keep the field-name strings
    identical. `pa1895-flow.mjs` reads them back, so this is the most fragile
    artifact.
  - `pa1938.ts`, `render.ts`, `genericForm.ts` draw from scratch. Port to
    `reportlab`.
  - Fax bundle (`fax.ts`): render a cover sheet with reportlab, then join it to
    the form with `pypdf`. Keep the confirmation-number format and the
    "SIMULATED TRANSMISSION" copy. Store PDF bytes in a `BinaryField`.

## Next.js side changes

1. **Add `rewrites()` to `next.config.js`.** This is the cutover switch:
   ```js
   async rewrites() {
     return [{ source: "/api/:path*",
       destination: `${process.env.DJANGO_ORIGIN || "http://localhost:8000"}/api/:path*` }];
   }
   ```
2. **Convert the 5 server components that import `@/lib/db`** (they break when
   `db.ts` is deleted). Add these new read endpoints and have the pages `fetch`
   them, forwarding the inbound `Cookie` header:
   - `dashboard/page.tsx` → new `GET /api/dashboard` (activity counts).
   - `u/[handle]/page.tsx` → new `GET /api/u/[handle]` (profile, QR, viewer flags).
   - `o/[handle]/page.tsx` → new `GET /api/o/[handle]` (org profile, opportunities).
   - `q/[opaqueId]/page.tsx` → `GET /api/qr/[opaqueId]` returns the redirect target.
   - `dev/inbox/page.tsx` → new `GET /api/dev/notifications` (demo-gated).
   The `verify/[id]` and `share/[token]` pages point at the ported Django
   endpoints through the same rewrite.
3. **Keep** `src/middleware.ts`, `src/lib/constants.ts`, `src/lib/appUrl.ts`,
   and the non-`db` client libs. These are frontend/edge code.
4. **docker-compose:** add a `backend` service (Django, same `db`). Point
   `webapp` at it with `DJANGO_ORIGIN=http://backend:8000`. Run `migrate` and
   `seed_demo` on backend start. The Playwright story services stay pointed at
   `webapp:3000`.
5. **Env vars:** `DATABASE_URL` via `dj-database-url` (strip `?schema=public`).
   `CASE_DATA_ENCRYPTION_KEY`, `DEMO_MODE`, `APP_BASE_URL`,
   `INSECURE_HTTP_COOKIES` carry over. Add `DJANGO_ORIGIN`. `SESSION_SECRET` is
   unused today; reuse it only as Django `SECRET_KEY` if wanted.

## Frontend type generation (Zod from OpenAPI)

Pydantic is the single source of truth. The frontend contract is generated from
the OpenAPI spec that Ninja emits. Flow:

```
Pydantic schemas ──▶ Ninja /api/openapi.json ──▶ codegen ──▶ Zod + TS types
```

- **Export step:** a `manage.py export_openapi` command (or a `curl` in CI) writes
  `openapi.json` from `api.get_openapi_schema()`.
- **Codegen:** run `orval` (Zod + optional fetch client) or `openapi-zod-client`
  against `openapi.json`. Output goes to `src/lib/api/` as generated Zod schemas
  and TS types. Add an npm script (e.g. `gen:api`) and a note that the output is
  generated, not edited by hand.
- **Use:** in fetch calls, parse responses through the generated Zod schema, e.g.
  `const me = MeSchema.parse(await res.json())`. A contract drift throws at once.
- **Parity bonus:** the generated Zod schemas validate Django responses against
  the contract, so they double as a check in the parity tests.

This layer is additive. It does not block cutover; adopt it during M6 or after.

## Build sequence (milestones)

- **M0a — Repo restructure (done).** `git mv` the Next.js app into `frontend/`;
  update firebase.json, apphosting.yaml (root dir `/frontend`), the two GitHub
  workflows, and docker-compose `context:` paths.
- **M0b — Scaffold + models (2–3 d).** `backend/` Django project, all 34 models,
  string PKs, cross-app FK order, `migrate` on a fresh DB, admin for review.
- **M1 — Auth spine + `/api/me` + error envelope (3–4 d).** Root `NinjaAPI`,
  Session model, cookie auth callable, cookie helper, exception handler,
  rate-limit port, all auth flows. Gate: `smoke.mjs` login + `/api/me` parity,
  Next middleware redirect works, Swagger UI renders the schemas.
- **M2 — `seed_demo` command (2 d).** Port `prisma/seed.ts` + `demo.ts`.
  Gate: `smoke.mjs` fully green.
- **M3 — Activity + organizations (4–5 d).** State machine, fraud flags,
  transactional routes, membership lifecycle, domains, locations,
  opportunities, shifts, TOTP, scan-confirm. Gate: `shift-flow.mjs`.
- **M4 — Forms + PDF + fax (4–5 d).** PDF ports, certification state machine,
  form generate, downloads, fax bundle, advocacy. Gate: `pa1895-flow.mjs`.
- **M5 — Agency + agency-api + sharing/consent/notifications (4–5 d).** Case
  encryption + masking, audited reveal, case-hours, inline bulk-query, API-key
  auth + request logging, the hand-crafted `/api/agency-api/v1/openapi.json`
  (keep serving the exact partner spec, separate from Ninja's auto docs),
  consent, share links, public share/verify/qr endpoints, notifications.
- **M6 — Server-component conversion + new read endpoints + Zod codegen (3–4 d).**
  `/api/dashboard`, `/api/u|o/[handle]`, `/api/qr/[opaqueId]`,
  `/api/dev/notifications`. Convert the 5 pages, forwarding cookies. Add the
  `export_openapi` command and the `orval` codegen script; generate the Zod
  schemas into `src/lib/api/` and wire the converted pages to parse through them.
- **M7 — Big-bang cutover (1 d).** Add `rewrites()`. Run the full parity suite
  and Playwright stories green. Delete `src/app/api/**` and `src/lib/db.ts`.
  Remove Prisma deps and scripts (`@prisma/client`, `prisma`, `postinstall`,
  `db:*`, `prisma/`, `scripts/migrate-on-build.mjs`). Ship the docker-compose
  with the `backend` service.

Rough total: ~5–6 weeks for one engineer.

## Verification

The repo already ships black-box HTTP tests that hit `/api` with cookie replay:
`smoke.mjs`, `shift-flow.mjs`, `pa1895-flow.mjs`, and the Playwright stories in
`e2e/`. They are backend-agnostic, so they become the parity suite for free.

1. **Golden capture:** run the current Next stack, hit every GET and a scripted
   path through the POSTs, and save each response body to `scratchpad/golden/`.
   Normalize volatile fields (IDs, timestamps, confirmation numbers).
2. **Run both stacks:** toggle `DJANGO_ORIGIN` to send `/api/*` to Next or to
   Django. Run the three `.mjs` flows against each. Diff exit codes and bodies
   against the golden files.
3. **Strict gates:** `pa1895-flow.mjs` reads AcroForm field values back, so it
   verifies the PDF field-name port. `shift-flow.mjs` gates the TOTP port and the
   scan-confirm transaction. Keep both green before cutover.
4. **Playwright stories** run against the proxied docker stack and verify the
   cookie set by Django is read by the Next middleware.
5. **Django unit tests** for the risky ports only: TOTP vectors (mirror
   `tests/shiftTotp.test.ts`), the OTP/rate-limit logic, the activity state
   machine, `computeFraudFlags`, and encryption round-trip + masking.

Run locally: `docker compose up backend` + `npm run dev`, then
`BASE_URL=http://localhost:3000 node smoke.mjs`.

## Key risks

- **String PKs are load-bearing.** A numeric ID breaks the frontend. Force
  explicit string PKs on every model.
- **Datetime format drift.** JS emits `...Z`; Pydantic may emit `+00:00`. Add a
  field serializer / JSON encoder that matches the golden files.
- **Zod `.flatten()` error shape.** Ninja's Pydantic `ValidationError` has its own
  format. Map it in the exception handler to `{formErrors, fieldErrors}` in case
  client code reads `details.fieldErrors`.
- **Custom TOTP, not pyotp.** Port the file exactly.
- **Transactional routes.** `scan-confirm` and activity `revise` rely on
  `$transaction` + unique constraints. Use `transaction.atomic()` +
  `select_for_update`, catch `IntegrityError`, return `409 already_checked_in`.
- **Agency-api logs on every branch.** Write `APIRequest` for rate-limited,
  auth-failed, forbidden, not-found, no-consent, and success. Match all six.
- **Inline bulk-query.** Keep it synchronous in the request handler. No Celery.
- **`totpSecret` must never serialize.** Never add it to any response schema.
- **Keep CSRF off.** Do not add Django's CSRF middleware to these endpoints; the
  frontend sends no CSRF token and every POST would 403.
- **Server-component cookie forwarding.** The converted pages must forward the
  inbound `Cookie` header on their server-side `fetch`, or viewer context
  silently degrades to logged-out.

## Critical files to read during implementation

Paths are under `frontend/`.

- `src/../prisma/schema.prisma` — the 34 models (`frontend/prisma/schema.prisma`).
- `src/lib/auth/session.ts` — session token and cookie behavior.
- `src/lib/apiError.ts` — the error envelope.
- `src/lib/shiftTotp.ts` — the custom TOTP to port exactly.
- `src/lib/pdf/pa1895.ts` + `src/lib/pdf/templates/pa1895.pdf` — the AcroForm.
- One representative `route.ts` per group — the exact JSON shapes.
