/**
 * Emails the team when someone leaves their address on the home page.
 *
 * Posts the sign-up to a Formspree form (https://formspree.io), which emails it
 * to the form's target inbox. Formspree sends from its own domain, so there is
 * no DNS or sender setup on our side. Configure with:
 *   SIGNUP_FORMSPREE_URL — the form endpoint, e.g. https://formspree.io/f/abcdwxyz.
 *                          Not a secret: anyone can post to a Formspree form.
 *                          Without it the sign-up is only logged.
 * The target inbox (hello@snappyforms.org) is set on the form in Formspree.
 */

export type SignupRole = "individual" | "organization";

export type Signup = {
  email: string;
  role: SignupRole;
  source: string;
};

export type SignupNotifyResult = "sent" | "not_configured";

export async function notifySignup(signup: Signup): Promise<SignupNotifyResult> {
  const roleLabel = signup.role === "organization" ? "organization" : "volunteer";
  const receivedAt = new Date().toISOString();

  // Always log first: if the email fails, Cloud Logging still holds the sign-up.
  console.info("[signup]", JSON.stringify({ ...signup, receivedAt }));

  const endpoint = process.env.SIGNUP_FORMSPREE_URL;
  if (!endpoint) {
    console.warn("[signup] SIGNUP_FORMSPREE_URL is not set; sign-up was logged but not emailed.");
    return "not_configured";
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      email: signup.email,
      signing_up_as: roleLabel,
      form: signup.source,
      received_at: receivedAt,
      // Formspree reads these: subject line, and "reply" goes to the person who signed up.
      _subject: `New SnappyForms sign-up (${roleLabel}): ${signup.email}`,
      _replyto: signup.email,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Formspree returned ${res.status}: ${detail.slice(0, 300)}`);
  }
  return "sent";
}
