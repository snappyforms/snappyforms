# Adding the form prototype

The original marketing home page remains at `/`. Its form-prototype links open
`/prototype`; the existing `/demo` and account flow remain unchanged. Review links
and Reset demo use `/prototype`. No hosting mode or demo-login flags are changed.
This remains a fictional-data demonstration, not a production personal-data service.

From `frontend/`, validate with `npx tsc --noEmit`,
`node --import tsx tests/middleware.test.ts`, and
`node --import tsx tests/beneficiaryPdf.test.ts`.
After rollout, verify the home page, `/demo`, `/prototype`, PDF preview/download,
and Reset demo. Each browser has its own saved forms; review links require that
same browser and origin. Reset removes saved prototype forms, not downloaded files.

Push the feature branch, open a pull request into the backend's connected live
branch, and merge after review. Confirm the live branch in Firebase App Hosting
backend settings; the repository alone cannot confirm that console setting.
No deployment is performed by these source changes.

---

# Deploying SnappyForms to Firebase App Hosting

SnappyForms is a Next.js 14 (App Router) app backed by PostgreSQL via Prisma. Firebase
App Hosting builds the app from your GitHub repo, serves it on Cloud Run, and resolves
secrets from Google Cloud Secret Manager. Configuration lives in
[`frontend/apphosting.yaml`](frontend/apphosting.yaml).

> **Root directory:** `/frontend`. This is a monorepo — the Next.js app lives in
> `frontend/` (`package.json`, `next.config.js`, `src/`, `prisma/` are all under
> `frontend/`), and the Django backend lives in `backend/`. Run every command in
> this guide from the `frontend/` directory unless stated otherwise.

---

## 0. Prerequisites

- A Firebase project on the **Blaze (pay-as-you-go)** plan (App Hosting requires it).
- The Firebase CLI **v13.x or newer**:
  ```bash
  npm install -g firebase-tools
  firebase --version   # >= 13
  firebase login
  ```
- Your code pushed to a **GitHub** repository (App Hosting deploys from GitHub).
- A reachable **PostgreSQL** database (e.g. Neon). Use a **pooled** connection string
  — App Hosting scales to multiple instances and a direct connection will exhaust
  Postgres connection slots.

---

## 1. Prepare the production database

Migrations run **automatically at build time**, so the first deploy applies the schema
for you. That is wired up in [`frontend/scripts/migrate-on-build.mjs`](frontend/scripts/migrate-on-build.mjs),
which `npm run build` calls before `next build`; it reads `MIGRATE_DATABASE_URL`
(created in step 2) and fails the build if a migration fails, so a release can never
reach users ahead of its own schema.

The step is a no-op when `MIGRATE_DATABASE_URL` is absent, which keeps `npm run build`
offline-safe for the Docker image, CI, and local builds.

To apply the schema by hand instead — a first run against an empty database, or to
verify before deploying:

```bash
# Use the DIRECT (non-pooled) URL for migrations — pooled endpoints don't support DDL well.
DATABASE_URL="postgresql://<user>:<pass>@<direct-host>/<db>?sslmode=require" \
  npx prisma migrate deploy
```

This applies everything in `prisma/migrations/`. Do **not** seed a real deployment with
the demo data — `prisma/seed.ts` is for local/demo use only.

---

## 2. Create the secrets

The app needs three secret values. Generate strong ones:

```bash
openssl rand -hex 32   # -> SESSION_SECRET
openssl rand -hex 32   # -> CASE_DATA_ENCRYPTION_KEY
```

Store all three in Secret Manager via the CLI. `apphosting:secrets:set` creates the
secret and grants the App Hosting backend access in one step:

```bash
firebase apphosting:secrets:set DATABASE_URL
#   paste your POOLED connection string when prompted

firebase apphosting:secrets:set SESSION_SECRET
#   paste the first openssl value

firebase apphosting:secrets:set CASE_DATA_ENCRYPTION_KEY
#   paste the second openssl value
```

These names match the `secret:` references in `apphosting.yaml`. If you create the
backend before the secrets, re-grant access afterwards with
`firebase apphosting:secrets:grantaccess <NAME> --backend <BACKEND_ID>`.

---

## 3. Set your app domain

Edit [`frontend/apphosting.yaml`](frontend/apphosting.yaml) and replace the placeholder:

```yaml
  - variable: APP_BASE_URL
    value: https://REPLACE-with-your-app-domain   # <- your App Hosting URL
```

`APP_BASE_URL` is used to build QR-code payload links and magic-link URLs, so it must
match the domain the app is actually served on. You can fill in the real value after
the first deploy tells you the URL, then redeploy.

`DEMO_MODE` and `NEXT_PUBLIC_DEMO_MODE` are already set to `"false"` for production —
leave them off unless you deliberately want the seeded demo-login buttons and
`/dev/inbox`.

---

## 4. Create the App Hosting backend

Link the GitHub repo to a backend. This walks you through installing the GitHub app,
picking the repo, the **live branch** (e.g. `main`), and a region:

```bash
firebase apphosting:backends:create --project <YOUR_PROJECT_ID>
```

When prompted for the repository root, set it to `/frontend` (not the default `/`).
For an existing backend, change the root directory to `/frontend` in the Firebase
console (App Hosting → your backend → settings) before the next rollout.

---

## 5. Deploy

App Hosting uses **continuous deployment**: every push to the connected live branch
triggers a build + rollout.

```bash
git push origin main
```

Watch the rollout:

```bash
firebase apphosting:backends:list
# or view build logs in the Firebase console → App Hosting → your backend
```

To trigger a rollout manually (e.g. without a new commit):

```bash
firebase apphosting:rollouts:create <BACKEND_ID>
```

What runs during the build (no action needed — this is just what happens):
1. `npm ci` → the `postinstall` script runs `prisma generate`.
2. `npm run build` → `next build`.
3. The image is deployed to Cloud Run with the `apphosting.yaml` env/secrets.

---

## 6. Verify

- Open the backend URL. `/login` should render (the password sign-in form; demo-login
  buttons are hidden because `NEXT_PUBLIC_DEMO_MODE=false`).
- Sign in with a real account and confirm the session sticks — App Hosting serves
  HTTPS, so the `Secure` session cookie works. **Do not** set `INSECURE_HTTP_COOKIES`
  here; that flag exists only for the local plain-HTTP container stack.
- Check the App Hosting logs for any Prisma connection errors (usually a sign the
  `DATABASE_URL` isn't the pooled endpoint, or the secret didn't resolve).

---

## Ongoing: schema changes

For any future migration:

```bash
# 1. locally, against a dev DB:
npx prisma migrate dev --name <change>
git add frontend/prisma/migrations && git commit -m "migration: <change>"

# 2. push — the build applies it before the new code goes live:
git push origin main
```

The build runs `prisma migrate deploy` against `MIGRATE_DATABASE_URL` before
`next build`, so the schema is always in place before the rollout that needs it, and a
failed migration fails the build rather than shipping.

Two things this does **not** protect you from, both inherent to migrating forward:

- **A rollback leaves the schema ahead of the code.** Keep migrations additive
  (add columns/tables; don't drop or rename in the same release as the code change)
  so the previous version still runs against the new schema.
- **A migration that builds but never ships.** If the build succeeds and the rollout
  is then cancelled, the database is already migrated. Additive migrations make that
  harmless.

---

## Environment variable reference

| Variable | Source | Notes |
|---|---|---|
| `DATABASE_URL` | Secret | **Pooled** Postgres URL for the running app (RUNTIME only) |
| `MIGRATE_DATABASE_URL` | Secret (BUILD) | **Direct**, non-pooled URL used only by the build-time `prisma migrate deploy` |
| `SESSION_SECRET` | Secret | Signs/authenticates session cookies (`openssl rand -hex 32`) |
| `CASE_DATA_ENCRYPTION_KEY` | Secret | AES-256-GCM key for `ParticipantCase.caseNumberEncrypted` (`openssl rand -hex 32`) |
| `APP_BASE_URL` | Plain | Public https URL; used for QR/magic-link generation |
| `DEMO_MODE` | Plain | `"false"` in production |
| `NEXT_PUBLIC_DEMO_MODE` | Plain (BUILD) | `"false"`; inlined into the client bundle at build time |
