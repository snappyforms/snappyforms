# Beneficiary prototype

Run `npm run dev` from `frontend`, then visit `/prototype` (use the port printed by Next.js). The existing `/chris-demo` remains available.

## Demonstration walkthrough

1. Choose **Try with sample information** or start a blank form.
2. Complete the seven short steps. Unknown organization/service details can be left for the supervisor. Demo email code: `123456`.
3. Review and edit the answers alongside the official PA-1938. The PDF updates automatically; download retains fillable fields. CAO-required monthly hours remain blank.
4. Confirm an office, optionally selecting from the small Philadelphia/Lancaster directory, then create a review link.
5. Choose **Try organization view** and enter demo SMS code `123456`.
6. Complete highlighted details and certify with a typed demo signature. Signing locks service details.
7. Signing automatically opens **Send to your CAO**. Confirm the destination and fax number, check the destination confirmation, and choose **Send to CAO (demo)**. Presentation options include a delivery failure scenario with retry.
8. Return to **My forms** for status, signed demo PDFs, text receipts, or a new form using saved personal information.

## Boundaries

- Fictional data only. Entries and progress live in localStorage under `snappy-beneficiary-demo-v1`; there is no backend or real account.
- Share URLs only work in the originating browser profile and origin, with its stored data. They do not carry the form data. Verification is a UI simulation, not security.
- Link expiry is 14 days, with renew/revoke controls. No actual SMS, email, signature service, or fax provider is called.
- PDF edits made outside the app are not imported. Preview fields synchronize from the app's answers.
- Signatures and document footers are marked as demonstration. No county acceptance is claimed.
- CAO candidates come from https://www.pa.gov/agencies/dhs/contact/cao-information (checked October 21, 2026). City matching suggests candidates, not assigned districts. Both sides must confirm the destination. This small directory needs maintenance before any pilot.
- Receipts are simulated text downloads. Delivery does not mean county approval.
- Existing package-lock changes predate this implementation.

## Validation

TypeScript: `npx tsc --noEmit` from `frontend`.
Browser walkthrough: beneficiary intake, save code, PDF generation, share, organization verification, completion, signing lock, simulated failure and successful retry.

PDF field regression check: `npx tsx tests/beneficiaryPdf.test.ts` from `frontend`. Both pages of a generated sample were rendered and visually inspected.

## Review improvements

- Live previews use PDF.js with a locally served worker, so embedded PDF plug-ins are not required. Full-screen review includes both pages and zoom controls. Downloads remain fillable.
- CAO selection updates a dedicated destination field; the template’s shared blank widgets are hidden so they cannot cover the value.
- Duty 1, Duty 2, and Duty 3 map to the corresponding numbered fields. Duties 2 and 3 are optional; older comma-separated drafts are migrated.
- The PDF worker is copied from the installed package by postinstall, predev, and build.

## Identity and draft controls

- The first step includes an optional four-digit SSN suffix field, with numeric input and a four-character limit. It preserves leading zeros and maps to the official “Last 4 digits of SSN” PDF field. Fictional digits only in this demo.
- Use Delete draft beside an unfinished form on My forms. The intake and review screens do not show deletion controls. Confirm the dialog to remove it from My forms; Undo restores it with its answers. The browser-local record is soft-deleted. Shared and signed forms have no draft deletion control.
- Verified cancel, deletion, Undo, retained answers, and PDF suffix mapping (including leading zeros and blank values).
