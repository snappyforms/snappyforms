import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/apiError";
import { checkCooldown, checkRateLimit } from "@/lib/auth/rateLimit";
import { notifySignup } from "@/lib/signupNotify";

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(["individual", "organization"]),
  source: z.string().max(20).default("unknown"),
  // Honeypot: a hidden field real visitors never fill in.
  website: z.string().optional(),
});

const WINDOW_MS = 10 * 60 * 1000;
// Hard ceiling on sign-up emails per instance, whatever the caller claims to be.
// X-Forwarded-For is client-controlled, so the per-IP limit below is only a
// first filter; this cap is what actually bounds inbox flooding and Resend usage.
const GLOBAL_MAX_PER_WINDOW = 30;

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const perIp = checkRateLimit(`signup:${ip}`, WINDOW_MS, 5);
    if (!perIp.allowed) {
      return NextResponse.json({ error: "rate_limited", retryAfterMs: perIp.retryAfterMs }, { status: 429 });
    }

    const body = signupSchema.parse(await request.json());

    // Answer bots exactly like a real sign-up so they learn nothing, but send nothing.
    if (body.website) {
      return NextResponse.json({ ok: true });
    }

    // The same address twice within the window is a double-click or a repeat
    // visit, not a new lead: thank them again without a second email.
    if (!checkCooldown(`signup-email:${body.email}`, WINDOW_MS).allowed) {
      return NextResponse.json({ ok: true });
    }

    const global = checkRateLimit("signup:global", WINDOW_MS, GLOBAL_MAX_PER_WINDOW);
    if (!global.allowed) {
      // Keep the lead in the logs even when the email budget is spent.
      console.warn("[signup] global cap reached; not emailed:", JSON.stringify({ email: body.email, role: body.role }));
      return NextResponse.json({ error: "rate_limited", retryAfterMs: global.retryAfterMs }, { status: 429 });
    }

    await notifySignup({ email: body.email, role: body.role, source: body.source });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
