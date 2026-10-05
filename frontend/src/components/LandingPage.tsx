"use client";

import { useEffect, useState } from "react";

const fontImport = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
`;

function useStamp(delay = 900) {
  const [stamped, setStamped] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStamped(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return stamped;
}

function StatusPill({ state }: { state: "pending" | "confirmed" }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide transition-colors duration-500"
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        borderColor:
          state === "confirmed" ? "hsl(164 60% 32% / 0.35)" : "hsl(220 15% 88%)",
        backgroundColor:
          state === "confirmed" ? "hsl(164 60% 32% / 0.08)" : "hsl(220 20% 95%)",
        color: state === "confirmed" ? "hsl(164 60% 26%)" : "hsl(220 10% 45%)",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor:
            state === "confirmed" ? "hsl(164 60% 32%)" : "hsl(220 10% 65%)",
        }}
      />
      {state === "confirmed" ? "CONFIRMED" : "AWAITING"}
    </span>
  );
}

function RecordCard() {
  const stamped = useStamp(900);
  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* drop shadow card stack for a "physical record" feel */}
      <div
        className="absolute inset-x-3 -bottom-3 top-3 rounded-2xl border"
        style={{ backgroundColor: "hsl(0 0% 100%)", borderColor: "hsl(220 15% 88%)", opacity: 0.5 }}
      />
      <div
        className="relative overflow-hidden rounded-2xl border shadow-sm"
        style={{ backgroundColor: "hsl(0 0% 100%)", borderColor: "hsl(220 15% 88%)" }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-3"
          style={{ borderColor: "hsl(220 15% 88%)" }}
        >
          <span
            className="text-[11px] font-medium uppercase tracking-[0.14em]"
            style={{ color: "hsl(220 10% 45%)", fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Activity record
          </span>
          <StatusPill state={stamped ? "confirmed" : "pending"} />
        </div>

        <div className="px-5 pt-4">
          <p
            className="text-[11px]"
            style={{ color: "hsl(220 10% 45%)", fontFamily: "'IBM Plex Mono', monospace" }}
          >
            @maya-j
          </p>
          <p className="mt-1 text-lg font-semibold" style={{ color: "hsl(222 30% 12%)" }}>
            Weekend Food Pantry Volunteer
          </p>
          <p className="text-sm" style={{ color: "hsl(220 10% 45%)" }}>
            Northside Community Resource Center · 4.5 hrs
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between px-5 pb-5">
          <p
            className="text-[11px]"
            style={{ color: "hsl(220 10% 45%)", fontFamily: "'IBM Plex Mono', monospace" }}
          >
            REC-2f91-8b
          </p>

          {/* the stamp */}
          <div
            className="grid h-14 w-14 place-items-center rounded-full border-2 text-center transition-all duration-700 ease-out"
            style={{
              borderColor: "hsl(164 60% 32%)",
              color: "hsl(164 60% 32%)",
              transform: stamped ? "rotate(-8deg) scale(1)" : "rotate(-8deg) scale(0)",
              opacity: stamped ? 1 : 0,
            }}
          >
            <div className="leading-none">
              <div className="text-[8px] font-bold tracking-widest">VERIFIED</div>
              <div className="mt-0.5 text-[8px] font-bold tracking-widest">BY ORG</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  index,
  title,
  copy,
}: {
  index: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex gap-4">
      <div
        className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-semibold"
        style={{
          borderColor: "hsl(164 60% 32% / 0.35)",
          color: "hsl(164 60% 32%)",
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        {index}
      </div>
      <div>
        <h3 className="text-base font-semibold" style={{ color: "hsl(222 30% 12%)" }}>
          {title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed" style={{ color: "hsl(220 10% 45%)" }}>
          {copy}
        </p>
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  copy,
  accent = "primary",
}: {
  title: string;
  copy: string;
  accent?: "primary" | "secondary";
}) {
  const dot = accent === "primary" ? "hsl(164 60% 32%)" : "hsl(262 55% 55%)";
  return (
    <div
      className="rounded-xl border p-5"
      style={{ borderColor: "hsl(220 15% 88%)", backgroundColor: "hsl(0 0% 100%)" }}
    >
      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />
      <h3 className="mt-3 text-[15px] font-semibold" style={{ color: "hsl(222 30% 12%)" }}>
        {title}
      </h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: "hsl(220 10% 45%)" }}>
        {copy}
      </p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div
      // className="min-h-screen"
      style={{
        backgroundColor: "hsl(30 40% 98%)",
        color: "hsl(222 30% 12%)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        width: "99vw",
        marginLeft: "calc(50% - 50vw)",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: fontImport }} />

      {/* ---------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ---------------------------------------------------------------- */}
      <header
        className="sticky top-0 z-20 border-b backdrop-blur"
        style={{ borderColor: "hsl(220 15% 88%)", backgroundColor: "hsl(30 40% 98% / 0.85)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div
              className="grid h-7 w-7 place-items-center rounded-md text-xs font-bold"
              style={{ backgroundColor: "hsl(164 60% 32%)", color: "hsl(0 0% 100%)" }}
            >
              S
            </div>
            <span
              className="text-[15px] font-semibold tracking-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              SnappyForms
            </span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex" style={{ color: "hsl(220 10% 45%)" }}>
            <a href="#how-it-works" className="hover:text-current transition-colors">
              How it works
            </a>
            <a href="#organizations" className="hover:text-current transition-colors">
              For organizations
            </a>
            <a href="#features" className="hover:text-current transition-colors">
              What's inside
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden text-sm font-medium sm:inline-block"
              style={{ color: "hsl(222 30% 12%)" }}
            >
              Log in
            </a>
            <a
              href="/demo"
              className="rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: "hsl(164 60% 32%)", color: "hsl(0 0% 100%)" }}
            >
              Create my account
            </a>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
        <div className="grid items-center gap-14 md:grid-cols-[1.1fr_0.9fr]">
          <div>

            <h1
              className="mt-5 text-[2.6rem] leading-[1.08] tracking-tight md:text-[3.4rem]"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              Work Requirement Tracking & Verification
              <br />
              <span style={{ color: "hsl(164 60% 32%)" }}>Simplified</span>.
            </h1>

            <p className="mt-6 max-w-xl text-[17px] leading-relaxed" style={{ color: "hsl(220, 7%, 35%)" }}>
              Portable, verified documentation of work, volunteering, and training for <br /><span style={{ color: "hsl(164 60% 32%)" }}>Beneficiaries</span>. <br /><br />
              Simplified volunteer acquisition and management for <br /><span style={{ color: "hsl(164 60% 32%)" }}>Organizations</span>.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="./demo"
                className="rounded-lg px-5 py-3 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: "hsl(164 60% 32%)", color: "hsl(0 0% 100%)" }}
              >
                Create my demo account
              </a>
              <a
                href="#how-it-works"
                className="rounded-lg border px-5 py-3 text-sm font-semibold transition-colors hover:bg-black/[0.02]"
                style={{ borderColor: "hsl(220 15% 88%)", color: "hsl(222 30% 12%)" }}
              >
                See how it works
              </a>
            </div>

            <p className="mt-6 text-[12.5px] leading-relaxed" style={{ color: "hsl(220 10% 45%)" }}>
              This is a demonstration only. It does not determine benefit eligibility,
              is not affiliated with any government agency, and every record on this
              site is fictional.
            </p>
          </div>

          <RecordCard />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* How it works                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section id="how-it-works" className="border-t py-20" style={{ borderColor: "hsl(220 15% 88%)" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-xl">
            <h2 className="text-3xl tracking-tight" style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}>
              Three steps, no paperwork chase
            </h2>
            <p className="mt-3 text-[15px]" style={{ color: "hsl(220 10% 45%)" }}>
              Every record follows the same path, whether it's work, training,  <br />or volunteering.
            </p>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-3">
            <StepCard
              index="01"
              title="Request or log"
              copy="Ask an organization to confirm something you did, or let them log it for you on the spot — a shift, a training, a volunteer hour."
            />
            <StepCard
              index="02"
              title="They confirm"
              copy="The organization reviews and confirms the record. If anything's off, either side can correct it — every change stays visible in the audit trail."
            />
            <StepCard
              index="03"
              title="Carry it anywhere"
              copy="Turn confirmed records into a document, a time-limited share link, or a public verification page — no login required to check it."
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* For individuals / organizations                                  */}
      {/* ---------------------------------------------------------------- */}
      <section id="organizations" className="border-t py-20" style={{ borderColor: "hsl(220 15% 88%)" }}>
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2">
          <div
            className="rounded-2xl border p-8"
            style={{ borderColor: "hsl(220 15% 88%)", backgroundColor: "hsl(0 0% 100%)" }}
          >
            <span
              className="text-[11px] font-medium uppercase tracking-[0.14em]"
              style={{ color: "hsl(164 60% 32%)", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              For individuals
            </span>
            <h3 className="mt-3 text-2xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}>
              Participate. Verify. Share
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "hsl(220 10% 45%)" }}>
              Pick a handle, scan a QR code to connect with an organization, and
              request verification for the work you've done. Every record saved and ready to export for sharing.
            </p>
          </div>

          <div
            className="rounded-2xl border p-8"
            style={{ borderColor: "hsl(220 15% 88%)", backgroundColor: "hsl(0 0% 100%)" }}
          >
            <span
              className="text-[11px] font-medium uppercase tracking-[0.14em]"
              style={{ color: "hsl(262 55% 55%)", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              For organizations
            </span>
            <h3 className="mt-3 text-2xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}>
              Gather & Manage Volunteers in One Place.
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "hsl(220 10% 45%)" }}>
              Post opportunities, simplify check-in with a QR code, and digitally certify volunteers' hours. Expand your volunteer network without expanding administrative friction.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Feature grid                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section id="features" className="border-t py-20" style={{ borderColor: "hsl(220 15% 88%)" }}>
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl tracking-tight" style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}>
            What's inside
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="QR connect"
              copy="Scan or share a code to link with an organization — the code carries only an opaque ID, never your name."
            />
            <FeatureCard
              title="Corrections, not overwrites"
              copy="Fixing a confirmed record creates a linked revision. The original stays visible as superseded."
              accent="secondary"
            />
            <FeatureCard
              title="Documents on demand"
              copy="Turn a set of confirmed records into a downloadable summary, clearly marked as self-prepared."
            />
            <FeatureCard
              title="Time-limited sharing"
              copy="Share a record or document with an expiring link, or point someone to its public verification page."
              accent="secondary"
            />
            <FeatureCard
              title="Full audit log"
              copy="Every state change — confirmed, corrected, disputed, revoked — stays visible to organization admins."
            />
            <FeatureCard
              title="Consent-gated sharing"
              copy="Anything shared with a benefit program stays behind an explicit, revocable consent from the record owner."
              accent="secondary"
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* CTA                                                               */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-t py-20" style={{ borderColor: "hsl(220 15% 88%)" }}>
        <div
          className="mx-auto max-w-4xl rounded-2xl px-8 py-14 text-center"
          style={{ backgroundColor: "hsl(222 30% 12%)" }}
        >
          <h2 className="text-3xl tracking-tight" style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, color: "hsl(30 40% 98%)" }}>
            Start building your record today
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px]" style={{ color: "hsl(220 10% 65%)" }}>
            It takes about a minute to pick a handle and send your first
            verification request.
          </p>
          <a
            href="/demo"
            className="mt-7 inline-block rounded-lg px-6 py-3 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: "hsl(164 55% 45%)", color: "hsl(222 30% 8%)" }}
          >
            Create my demo account
          </a>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Footer                                                            */}
      {/* ---------------------------------------------------------------- */}
      <footer className="border-t py-10" style={{ borderColor: "hsl(220 15% 88%)" }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-[12.5px] md:flex-row md:items-center md:justify-between" style={{ color: "hsl(220 10% 45%)" }}>
          <p className="max-w-xl leading-relaxed">
            SnappyForms is a hackathon-sprint demonstration prototype. It does not
            determine benefit eligibility, is not affiliated with or a system of any
            government agency, and never transmits real records anywhere. All
            accounts and data referenced here are fictional.
          </p>
          <div className="flex items-center gap-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "hsl(164 60% 32%)" }} />
            <span>v0.5 — Phase 5 prototype</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
