/**
 * Emails the team when someone leaves their address on the home page.
 *
 * Sends through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email)
 * with a plain fetch, so there is no SDK dependency. Configure with:
 *   RESEND_API_KEY       — required to actually send; without it the sign-up is only logged.
 *   SIGNUP_NOTIFY_EMAIL  — inbox that receives sign-ups (default hello@snappyforms.org).
 *   SIGNUP_FROM_EMAIL    — sender. Resend's shared onboarding@resend.dev works with no
 *                          domain setup, but only delivers to the Resend account's own
 *                          address. Verify snappyforms.org in Resend to send from it.
 */

export type SignupRole = "individual" | "organization";

export type Signup = {
  email: string;
  role: SignupRole;
  source: string;
};

export type SignupNotifyResult = "sent" | "not_configured";

const RESEND_URL = "https://api.resend.com/emails";

export async function notifySignup(signup: Signup): Promise<SignupNotifyResult> {
  const roleLabel = signup.role === "organization" ? "organization" : "volunteer";
  const receivedAt = new Date().toISOString();

  // Always log first: if the email fails, Cloud Logging still holds the sign-up.
  console.info("[signup]", JSON.stringify({ ...signup, receivedAt }));

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[signup] RESEND_API_KEY is not set; sign-up was logged but not emailed.");
    return "not_configured";
  }

  const to = process.env.SIGNUP_NOTIFY_EMAIL || "hello@snappyforms.org";
  const from = process.env.SIGNUP_FROM_EMAIL || "SnappyForms <onboarding@resend.dev>";

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: to.split(",").map((s) => s.trim()).filter(Boolean),
      // Hitting "reply" in the inbox goes straight to the person who signed up.
      reply_to: signup.email,
      subject: `New SnappyForms sign-up (${roleLabel}): ${signup.email}`,
      text: [
        `Someone asked to get started with SnappyForms.`,
        ``,
        `Email: ${signup.email}`,
        `Signing up as: ${roleLabel}`,
        `Form: ${signup.source}`,
        `Received: ${receivedAt}`,
        ``,
        `Reply to this email to reach them.`,
      ].join("\n"),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend returned ${res.status}: ${detail.slice(0, 300)}`);
  }
  return "sent";
}
