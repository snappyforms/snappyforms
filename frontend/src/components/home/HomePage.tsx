"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { Inter, Poppins } from "next/font/google";
import "./home.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-poppins" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });

const CONTACT_EMAIL = "hello@snappyforms.org";

type Audience = "vol" | "org";
type Role = "individual" | "organization";

// Photos are hotlinked from Unsplash (Unsplash License: free for commercial use,
// no credit required). Swap for files in /public before relying on them long term.
const U = (id: string, w: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

const AUD: Record<
  Audience,
  { sub: string; img: { heroL: string; heroR: string; how: string } }
> = {
  vol: {
    sub: "Don't lose your benefits.",
    img: { heroL: U("1544928938-6852c1925194", 900), heroR: U("1758273237729-763de00eedd7", 900), how: U("1615897570286-da936a5dfb81", 1000) },
  },
  org: {
    sub: "Stop filling out forms.",
    img: { heroL: U("1743793174491-bcbdf1882ad5", 900), heroR: U("1791318219716-2ce5458c8257", 900), how: U("1743793174491-bcbdf1882ad5", 1000) },
  },
};

function Icon({ id, size, className = "icon" }: { id: string; size?: number; className?: string }) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg className={className} style={style} aria-hidden="true">
      <use href={`#i-${id}`} />
    </svg>
  );
}

function Tick() {
  return (
    <span className="tick">
      <Icon id="check" size={10} className="" />
    </span>
  );
}

type FormStatus = { kind: "idle" | "sending" | "ok" | "err"; text: ReactNode };

function SignupForm({
  source,
  role,
  inputRef,
}: {
  source: "hero" | "cta";
  role: Role;
  inputRef?: RefObject<HTMLInputElement>;
}) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<FormStatus>({ kind: "idle", text: "" });
  const id = `${source}-email`;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setStatus({ kind: "err", text: "Please enter a valid email address." });
      return;
    }
    setStatus({ kind: "sending", text: "" });
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, role, source, website }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setEmail("");
      setStatus({ kind: "ok", text: "Thanks! We'll email you soon to get you set up." });
    } catch {
      setStatus({
        kind: "err",
        text: (
          <>
            Something went wrong. Please email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </>
        ),
      });
    }
  }

  return (
    <>
      <form className="signup-form" onSubmit={onSubmit} noValidate>
        <label htmlFor={id} className="sr">
          Email address
        </label>
        <input
          ref={inputRef}
          className="field"
          id={id}
          type="email"
          name="email"
          placeholder="Enter your email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {/* Honeypot: hidden from people, filled in by naive bots. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ display: "none" }}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
        <button className="btn btn-cta" type="submit" disabled={status.kind === "sending"}>
          {status.kind === "sending" ? "Sending…" : "Sign up free"}
        </button>
      </form>
      <p className={`form-msg ${status.kind === "ok" || status.kind === "err" ? status.kind : ""}`} role="status" aria-live="polite">
        {status.text}
      </p>
    </>
  );
}

function AudienceToggle({
  audience,
  onChange,
  label,
  labels,
}: {
  audience: Audience;
  onChange: (a: Audience) => void;
  label: string;
  labels: [string, string];
}) {
  return (
    <div className="toggle" role="tablist" aria-label={label}>
      {(["vol", "org"] as const).map((a, i) => (
        <button key={a} type="button" role="tab" aria-selected={audience === a} onClick={() => onChange(a)}>
          {labels[i]}
        </button>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [audience, setAudienceState] = useState<Audience>("vol");
  const [shown, setShown] = useState<Audience>("vol"); // copy/images lag the toggle for the fade
  const [swapping, setSwapping] = useState(false);
  const [role, setRole] = useState<Role>("individual");
  const ctaInput = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  function setAudience(a: Audience) {
    if (a === audience) return;
    setAudienceState(a);
    setRole(a === "org" ? "organization" : "individual");
    setSwapping(true);
    setTimeout(() => {
      setShown(a);
      setSwapping(false);
    }, 220);
  }

  function pickRoleAndJump(r: Role) {
    setRole(r);
    setTimeout(() => ctaInput.current?.focus({ preventScroll: true }), 600);
  }

  // Preload the organization photos so the first switch is instant.
  useEffect(() => {
    Object.values(AUD.org.img).forEach((src) => {
      const i = new Image();
      i.src = src;
    });
  }, []);

  // Fade sections in as they scroll into view.
  useEffect(() => {
    const els = rootRef.current?.querySelectorAll(".reveal") ?? [];
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const copy = AUD[shown];
  const imgStyle = { opacity: swapping ? 0.25 : 1 };

  return (
    <div ref={rootRef} className={`sf-home ${poppins.variable} ${inter.variable}`}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <symbol id="i-leaf" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></symbol>
        <symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></symbol>
        <symbol id="i-ccheck" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></symbol>
        <symbol id="i-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></symbol>
        <symbol id="i-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></symbol>
        <symbol id="i-send" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></symbol>
        <symbol id="i-save" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></symbol>
        <symbol id="i-pen" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></symbol>
        <symbol id="i-link" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></symbol>
        <symbol id="i-doc" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 15l2 2 4-4" /></symbol>
        <symbol id="i-tag" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z" /><circle cx="7.5" cy="7.5" r="1.5" /></symbol>
      </svg>

      <div className="bar">
        <Icon id="tag" size={18} />
        <span>
          <b>100% free</b> for volunteers and organizations
        </span>
      </div>

      <header className="nav">
        <div className="wrap">
          <a className="brand" href="/" aria-label="SnappyForms home">
            <span className="brand-mark"><Icon id="leaf" /></span>snappyforms
          </a>
          <nav className="nav-links" aria-label="Main">
            <a href="#how">How it works</a>
            <a href="#both">Volunteers</a>
            <a href="#both">Organizations</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="nav-cta">
            <a className="nav-login" href="/login">Log in</a>
            <a className="btn btn-cta" href="#join">Sign up</a>
          </div>
        </div>
      </header>

      <main>
        {/* =============== HERO =============== */}
        <section className="hero">
          <div className="wrap">
            <AudienceToggle audience={audience} onChange={setAudience} label="Choose your view" labels={["I'm a volunteer", "I'm an organization"]} />

            <h1>
              Your digital SNAP<br />
              <span className="hl">verification assistant.</span>
            </h1>
            <p className="hero-sub">{copy.sub}</p>

            <SignupForm source="hero" role={role} />
            <div className="hero-meta">
              <span><Icon id="ccheck" />Free for everyone</span>
              <span><Icon id="ccheck" />Works on any phone</span>
              <span>
                <a className="btn btn-link" href="/prototype">Try the demo <Icon id="arrow" size={16} /></a>
              </span>
            </div>

            <div className="stage" aria-hidden="true">
              <div className="blob-bg" />
              <div className="blob blob-l">
                <img src={copy.img.heroL} alt="" style={imgStyle} />
              </div>
              <div className="blob blob-r">
                <img src={copy.img.heroR} alt="" style={imgStyle} />
              </div>

              <div className="phone">
                <div className="screen">
                  <div className="notch" />
                  <div className="ps" hidden={audience !== "vol"}>
                    <div className="ps-top">
                      <span><i><Icon id="leaf" size={11} className="" /></i>snappyforms</span>
                      <span style={{ color: "var(--muted)", fontWeight: 500 }}>Step 7 of 7</span>
                    </div>
                    <div className="ps-steps">{Array.from({ length: 7 }, (_, i) => <span key={i} />)}</div>
                    <h4>Ready to send</h4>
                    <small>Your PA 1938 · saved for next time</small>
                    <div className="ps-form">
                      <div className="ps-form-head">PA 1938 · Volunteer verification</div>
                      <div className="ps-field"><label>Your name</label><div className="row">Jordan Rivera<Tick /></div></div>
                      <div className="ps-field"><label>Address</label><div className="row">412 Elm St, Philadelphia<Tick /></div></div>
                      <div className="ps-field"><label>Organization</label><div className="row">Riverside Community Garden<Tick /></div></div>
                      <div className="ps-field todo"><label>Weekly schedule</label><div className="row">I don&apos;t know yet<span className="tag wait">Org fills</span></div></div>
                      <div className="ps-field"><label>Send link to supervisor</label><div className="row">Text · (215) 555-0142<Tick /></div></div>
                    </div>
                    <div className="ps-btn"><Icon id="send" size={15} />Send link to organization</div>
                  </div>
                  <div className="ps" hidden={audience !== "org"}>
                    <div className="ps-top">
                      <span><i><Icon id="leaf" size={11} className="" /></i>snappyforms</span>
                      <span style={{ color: "var(--muted)", fontWeight: 500 }}>No login needed</span>
                    </div>
                    <div className="ps-sms"><b>Jordan Rivera</b> sent you a volunteer form to sign. <span className="ps-link">snappyforms.org/r/7KQ</span></div>
                    <h4 style={{ marginTop: 14 }}>Review &amp; sign</h4>
                    <small>PA 1938 · 6 of 7 parts already filled</small>
                    <div className="ps-form">
                      <div className="ps-form-head">PA 1938 · Volunteer verification</div>
                      <div className="ps-field"><label>Volunteer</label><div className="row">Jordan Rivera<Tick /></div></div>
                      <div className="ps-field todo"><label>Weekly schedule · add this</label><div className="row">Sat 9–1:30, Tue 4–8<span className="tag wait">You</span></div></div>
                    </div>
                    <div className="sig">
                      <svg width="130" height="32" viewBox="0 0 130 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 24c8-13 14-19 18-17s-6 17-2 17 10-15 16-15-2 13 4 13 8-11 14-11 0 9 6 9 10-7 18-9 14 2 26-2" /></svg>
                    </div>
                    <small style={{ marginTop: 4 }}>Supervisor signature</small>
                    <div className="ps-btn"><Icon id="pen" size={15} />Sign and return</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =============== STRIP =============== */}
        <section className="strip">
          <div className="wrap">
            <div className="strip-item reveal"><span className="strip-ic"><Icon id="save" size={24} /></span><div><h3>Fill it in once</h3><p>Your answers are saved. Next month, your form starts already filled in.</p></div></div>
            <div className="strip-item reveal"><span className="strip-ic"><Icon id="link" size={24} /></span><div><h3>One link to your organization</h3><p>Sent by text or email. It works once and then expires.</p></div></div>
            <div className="strip-item reveal"><span className="strip-ic"><Icon id="doc" size={24} /></span><div><h3>We follow it through</h3><p>From first answer to signed form, you can see every step.</p></div></div>
          </div>
        </section>

        {/* =============== HOW IT WORKS =============== */}
        <section className="how" id="how">
          <div className="wrap">
            <div className="how-card">
              <div className="head reveal">
                <span className="kicker">How it works</span>
                <h2>How <span className="hl">SnappyForms</span> works</h2>
              </div>
              <div className="tabs-center">
                <AudienceToggle audience={audience} onChange={setAudience} label="How it works for" labels={["For volunteers", "For organizations"]} />
              </div>

              <div className="how-grid">
                <div className="how-art reveal">
                  <img src={copy.img.how} alt="" style={imgStyle} />
                  <div className="bubbles" hidden={audience !== "vol"}>
                    <div className="bub me"><small>You</small>I volunteer at Riverside Garden. I need my PA 1938 signed.</div>
                    <div className="bub us"><small>SnappyForms</small>Got it. Your info is saved. We sent a link to your supervisor, Ms. Lee.</div>
                    <div className="bub ok"><Icon id="check" size={18} />Signed. Your form is ready.</div>
                  </div>
                  <div className="bubbles" hidden={audience !== "org"}>
                    <div className="bub me"><small>Text to Ms. Lee</small>Jordan Rivera sent you a volunteer form to sign.</div>
                    <div className="bub us"><small>Ms. Lee</small>Added the schedule and signed. Took two minutes.</div>
                    <div className="bub ok"><Icon id="check" size={18} />Sent back to Jordan</div>
                  </div>
                </div>

                <div className="reveal">
                  <ol className="timeline" hidden={audience !== "vol"}>
                    <li><span className="num">01</span><div><h3>Fill it in once</h3><p>Answer simple questions on your phone. Not sure about something? Tap &quot;I don&apos;t know yet&quot; and your organization fills it in.</p></div></li>
                    <li><span className="num">02</span><div><h3>Send one link</h3><p>We text or email a secure link to your supervisor. They use what they already have. No account needed.</p></div></li>
                    <li><span className="num">03</span><div><h3>We handle it from there</h3><p>We follow up until it&apos;s signed. You get the finished form, ready for your County Assistance Office. Next month, it starts already filled in.</p></div></li>
                  </ol>
                  <ol className="timeline" hidden={audience !== "org"}>
                    <li><span className="num">01</span><div><h3>Get a link</h3><p>Your volunteer sends a link by text or email. Open it on any phone or computer. No login, no new software.</p></div></li>
                    <li><span className="num">02</span><div><h3>Check, add, and sign</h3><p>The form is already filled in. You add only what the volunteer didn&apos;t know, then sign on screen.</p></div></li>
                    <li><span className="num">03</span><div><h3>We handle the rest</h3><p>The signed form goes back to your volunteer. You keep a record of every form you&apos;ve signed, in one place.</p></div></li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =============== HOW WE HELP BOTH =============== */}
        <section className="section" id="both">
          <div className="wrap">
            <div className="head reveal">
              <span className="kicker">Two sides, one form</span>
              <h2>How we help <span className="hl">both</span></h2>
              <p>The PA 1938 needs a volunteer and an organization. We make it easy for each of them.</p>
            </div>
            <div className="both">
              <article className="both-card reveal">
                <div className="both-photo">
                  <img src={U("1758273237729-763de00eedd7", 400) + "&h=400"} alt="Smiling woman in a yellow raincoat checking her phone" />
                </div>
                <span className="pill">Free</span>
                <h3>For volunteers</h3>
                <p>Keep your SNAP benefits without chasing paper.</p>
                <ul className="both-list">
                  <li><Icon id="ccheck" />Fill in your form once. We save it for every month after.</li>
                  <li><Icon id="ccheck" />No trips back to get a signature. We send the link.</li>
                  <li><Icon id="ccheck" />See where your form is, from start to signed.</li>
                  <li><Icon id="ccheck" />Download or share your signed form anytime.</li>
                </ul>
                <a className="btn btn-outline" href="#join" onClick={() => pickRoleAndJump("individual")}>
                  Sign up as a volunteer <Icon id="arrow" />
                </a>
              </article>
              <article className="both-card reveal">
                <div className="both-photo">
                  <img src={U("1743793174491-bcbdf1882ad5", 400) + "&h=400"} alt="Volunteer coordinator helping people at a community event" />
                </div>
                <span className="pill">Free</span>
                <h3>For organizations</h3>
                <p>Help your volunteers keep food on the table, in minutes.</p>
                <ul className="both-list">
                  <li><Icon id="ccheck" />Forms arrive already filled in. You add only the gaps.</li>
                  <li><Icon id="ccheck" />Sign from a text or email. No login, no training.</li>
                  <li><Icon id="ccheck" />Every signed form saved in one place.</li>
                  <li><Icon id="ccheck" />Less paper for your staff, every month.</li>
                </ul>
                <a className="btn btn-outline" href="#join" onClick={() => pickRoleAndJump("organization")}>
                  Sign up your organization <Icon id="arrow" />
                </a>
              </article>
            </div>
            <div className="bridge reveal">
              <span>Volunteer fills it in</span><Icon id="arrow" />
              <span>SnappyForms sends the link</span><Icon id="arrow" />
              <span>Organization signs</span><Icon id="arrow" />
              <span>Form is ready</span>
            </div>
          </div>
        </section>

        {/* =============== GALLERY =============== */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="head reveal">
              <h2>Every volunteer hour <span className="hl">can count</span></h2>
              <p>Food pantries, community gardens, cleanups, and more.</p>
            </div>
            <div className="gallery">
              {[
                ["1788538812851-9aacd4189fa8", "Volunteers tending raised beds in a community garden", "Community gardens"],
                ["1599059813005-11265ba4b4ce", "Volunteers sorting canned food donations", "Food banks"],
                ["1758599669406-d5179ccefcb9", "A group of volunteers holding cleanup bags", "Neighborhood cleanups"],
                ["1791318219716-2ce5458c8257", "A young volunteer and an older woman tending plants", "Neighbors helping neighbors"],
              ].map(([id, alt, caption]) => (
                <figure className="reveal" key={id}>
                  <img src={U(id, 700)} alt={alt} loading="lazy" />
                  <figcaption>{caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* =============== FREE =============== */}
        <section id="free">
          <div className="wrap">
            <div className="free reveal">
              <div>
                <span className="kicker" style={{ color: "var(--sun)" }}>Pricing</span>
                <h2>Free for volunteers.<br />Free for organizations.</h2>
                <p>SnappyForms is a volunteer-run nonprofit. We built it to help people keep their benefits, not to charge anyone.</p>
              </div>
              <div className="free-cards">
                <div>Volunteers <b>$0</b></div>
                <div>Organizations <b>$0</b></div>
                <div>Every signed form <b>$0</b></div>
              </div>
            </div>
          </div>
        </section>

        {/* =============== FAQ =============== */}
        <section className="section" id="faq">
          <div className="wrap">
            <div className="head reveal"><span className="kicker">FAQ</span><h2>Questions? <span className="hl">Answers.</span></h2></div>
            <div className="faq">
              {(
                [
                  ["Is SnappyForms really free?", <>Yes. It is free for volunteers and free for organizations. There is no cost to fill in, send, or sign a form.</>],
                  ["What happens after I fill in my form?", <>After you fill in your form, we send a secure link to your organization, remind them if needed, and return the signed form to you. You can see where it is at every step.</>],
                  ["Does my organization need an account?", <>No. Your supervisor can review and sign from the link in a text or email. Organizations can create a free account later to manage many volunteers in one place.</>],
                  ["Which form does it support?", <>We are starting in Pennsylvania with the PA 1938, the Community Service Volunteer Verification form. More forms and states will follow.</>],
                  [
                    "Do I have SNAP work requirements?",
                    <>
                      It depends on your age, household, and health, and some people qualify for an exemption. Check the{" "}
                      <a href="https://www.pa.gov/en/agencies/dhs/resources/snap/snap-work-requirements-abawds.html" target="_blank" rel="noopener noreferrer">Pennsylvania DHS work requirements page</a>{" "}
                      or take the <a href="https://qualtrics.pa.gov/jfe/form/SV_57usZPSZVouCn78" target="_blank" rel="noopener noreferrer">state screener</a>. Your caseworker can also tell you.
                    </>,
                  ],
                  ["Is this a government website?", <>No. SnappyForms is an independent nonprofit. We do not decide who gets benefits. You still send your signed form to your County Assistance Office.</>],
                ] as [string, ReactNode][]
              ).map(([q, a]) => (
                <details key={q}>
                  <summary>{q}<span className="plus"><Icon id="plus" size={16} /></span></summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* =============== CTA =============== */}
        <section id="join">
          <div className="wrap">
            <div className="cta reveal">
              <div className="cta-body">
                <span className="kicker">Sign up</span>
                <h2>Ready to go <span className="hl">paperless?</span></h2>
                <p>Leave your email and we&apos;ll reach out to get you set up. It&apos;s free.</p>
                <div className="toggle" role="group" aria-label="I am signing up as">
                  <button type="button" aria-pressed={role === "individual"} onClick={() => setRole("individual")}>I&apos;m a volunteer</button>
                  <button type="button" aria-pressed={role === "organization"} onClick={() => setRole("organization")}>I&apos;m an organization</button>
                </div>
                <SignupForm source="cta" role={role} inputRef={ctaInput} />
                <p style={{ marginTop: 18, fontSize: 16 }}>
                  <a className="btn btn-link" href="/prototype">Or try the demo first <Icon id="arrow" size={16} /></a>
                </p>
              </div>
              <div className="cta-photo">
                <img src={U("1788538812809-f22af3a6993a", 1000)} alt="Volunteers working in a community garden" loading="lazy" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div>
            <a className="brand" href="/"><span className="brand-mark"><Icon id="leaf" /></span>snappyforms</a>
            <p style={{ marginTop: 14, maxWidth: 340 }}>Your digital SNAP verification assistant.</p>
            <p style={{ marginTop: 12 }}><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li><a href="#how">How it works</a></li>
              <li><a href="/prototype">Try the demo</a></li>
              <li><a href="/login">Log in</a></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="#faq">FAQ</a></li>
              <li><a href={`mailto:${CONTACT_EMAIL}`}>Contact</a></li>
            </ul>
          </div>
          <p className="legal">
            SnappyForms is not affiliated with any government agency and does not determine benefit eligibility. Names and numbers shown on this page are examples. © {new Date().getFullYear()} SnappyForms.
          </p>
        </div>
      </footer>
    </div>
  );
}
