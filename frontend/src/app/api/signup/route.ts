import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/apiError";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { notifySignup } from "@/lib/signupNotify";

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(["individual", "organization"]),
  source: z.string().max(20).default("unknown"),
  // Honeypot: a hidden field real visitors never fill in.
  website: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const limit = checkRateLimit(`signup:${ip}`, 10 * 60 * 1000, 5);
    if (!limit.allowed) {
      return NextResponse.json({ error: "rate_limited", retryAfterMs: limit.retryAfterMs }, { status: 429 });
    }

    const body = signupSchema.parse(await request.json());

    // Answer bots exactly like a real sign-up so they learn nothing, but send nothing.
    if (body.website) {
      return NextResponse.json({ ok: true });
    }

    await notifySignup({ email: body.email, role: body.role, source: body.source });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
