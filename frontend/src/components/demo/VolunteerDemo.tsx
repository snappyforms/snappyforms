"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Send,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, ReactNode, useState } from "react";
import { BrandMark, DemoSwitcher, FormProgress } from "./DemoShared";
import { DemoView } from "./demoData";

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-[#C8D2CC] bg-white px-3 text-sm text-[#263836] outline-none placeholder:text-[#A2AAA7] focus:border-[#275D7A] focus:ring-2 focus:ring-[#275D7A]/15";

type VolunteerProps = {
  view: DemoView;
  setView: (view: DemoView) => void;
  onSubmitted: () => void;
};

function Field({
  label,
  id,
  children,
  hint,
}: {
  label: string;
  id: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#2D403D]" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1.5 text-[11px] leading-4 text-[#75817F]">{hint}</p>
      )}
    </div>
  );
}

function AboutYou({ name, setName }: { name: string; setName: (name: string) => void }) {
  return (
    <div>
      <FormHeading
        description="Enter your information as it should appear on your volunteer verification form."
        title="Tell us about yourself"
      />
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id="full-name" label="Legal name">
            <input
              className={inputClass}
              id="full-name"
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </Field>
        </div>
        <Field id="dob" label="Date of birth">
          <input
            className={inputClass}
            defaultValue="1993-06-14"
            id="dob"
            required
            type="date"
          />
        </Field>
        <Field
          hint="Enter only the last four digits."
          id="case-reference"
          label="Case reference"
        >
          <input
            className={inputClass}
            defaultValue="4821"
            id="case-reference"
            inputMode="numeric"
            maxLength={4}
          />
        </Field>
        <Field id="email" label="Email">
          <input
            className={inputClass}
            defaultValue="maya.johnson@example.com"
            id="email"
            required
            type="email"
          />
        </Field>
        <Field id="phone" label="Phone number">
          <input
            className={inputClass}
            defaultValue="(412) 555-0184"
            id="phone"
            type="tel"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field id="home-address" label="Home address">
            <input
              className={inputClass}
              defaultValue="1842 Penn Avenue, Pittsburgh, PA 15222"
              id="home-address"
              required
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Service({ hours, setHours }: { hours: string; setHours: (hours: string) => void }) {
  return (
    <div>
      <FormHeading
        description="Report the dates, hours, and tasks you completed with Northside Community Resource Center."
        title="Describe your service"
      />
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <Field id="start-date" label="Start date">
          <input
            className={inputClass}
            defaultValue="2026-09-02"
            id="start-date"
            required
            type="date"
          />
        </Field>
        <Field id="end-date" label="End date">
          <input
            className={inputClass}
            defaultValue="2026-09-27"
            id="end-date"
            required
            type="date"
          />
        </Field>
        <Field id="assigned-hours" label="Hours assigned per month">
          <input
            className={inputClass}
            defaultValue="20"
            id="assigned-hours"
            min="0"
            required
            type="number"
          />
        </Field>
        <Field id="completed-hours" label="Hours completed">
          <input
            className={inputClass}
            id="completed-hours"
            min="0"
            onChange={(event) => setHours(event.target.value)}
            required
            type="number"
            value={hours}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field id="tasks" label="Tasks performed">
            <textarea
              className="mt-2 min-h-28 w-full rounded-lg border border-[#C8D2CC] bg-white p-3 text-sm leading-6 text-[#263836] outline-none focus:border-[#275D7A] focus:ring-2 focus:ring-[#275D7A]/15"
              defaultValue="Prepared pantry orders, restocked shelves, and helped neighbors carry groceries to the pickup area."
              id="tasks"
              required
            />
          </Field>
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-semibold text-[#2D403D]">
            Did the organization provide transportation?
          </legend>
          <div className="mt-3 flex gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-[#C8D2CC] px-4 py-3 text-sm">
              <input className="accent-[#3F6B58]" name="transport" type="radio" /> Yes
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-[#3F6B58] bg-[#F0F6F2] px-4 py-3 text-sm">
              <input
                className="accent-[#3F6B58]"
                defaultChecked
                name="transport"
                type="radio"
              />{" "}
              No
            </label>
          </div>
        </fieldset>
      </div>
    </div>
  );
}

function Review({ name, hours }: { name: string; hours: string }) {
  const rows = [
    ["Volunteer", name],
    ["Service period", "September 2–27, 2026"],
    ["Hours", `${hours} completed · 20 assigned`],
    ["Organization", "Northside Community Resource Center"],
  ];
  return (
    <div>
      <FormHeading
        description="Check the information below. Northside Community Resource Center will review it before signing."
        title="Review and attest"
      />
      <div className="mt-6 divide-y divide-[#E2E7E3] rounded-xl border border-[#D7DFDA]">
        {rows.map(([label, value]) => (
          <div className="grid gap-1 p-4 sm:grid-cols-[140px_1fr]" key={label}>
            <span className="text-xs font-semibold text-[#7A8684]">{label}</span>
            <span className="text-sm font-medium text-[#293C39]">{value}</span>
          </div>
        ))}
      </div>
      <label className="mt-6 flex items-start gap-3 rounded-xl border border-[#BFD1C5] bg-[#F0F6F2] p-4 text-sm leading-6 text-[#344B44]">
        <input
          className="mt-1 h-4 w-4 accent-[#3F6B58]"
          required
          type="checkbox"
        />
        <span>
          I attest that the information in this submission is true and complete
          to the best of my knowledge.
        </span>
      </label>
      <div className="mt-5">
        <Field id="attestation-name" label="Type your full name to attest">
          <input
            className={inputClass}
            defaultValue={name}
            id="attestation-name"
            required
          />
        </Field>
      </div>
    </div>
  );
}

function FormHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#162A2B]">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-[#687573]">{description}</p>
    </div>
  );
}

function OrganizationContext() {
  return (
    <aside className="order-2 rounded-xl bg-[#244F45] p-5 text-white md:sticky md:top-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold">Northside Community</p>
          <p className="text-xs text-white/65">Resource Center</p>
        </div>
      </div>
      <div className="mt-5 border-t border-white/15 pt-5">
        <p className="text-xs font-semibold text-white/70">Volunteer instructions</p>
        <p className="mt-2 text-xs leading-5 text-white/80">
          Use this form for food pantry, meal delivery, and neighborhood resource
          desk service completed in September.
        </p>
      </div>
      <div className="mt-5 flex gap-2 rounded-lg bg-white/10 p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-[11px] leading-4 text-white/75">
          Your information is shared only with this organization for review and
          document preparation.
        </p>
      </div>
      <p className="mt-5 text-[10px] leading-4 text-white/50">
        SnappyForms is not a government agency and does not determine benefit
        eligibility.
      </p>
    </aside>
  );
}

function Confirmation({ setView }: { setView: (view: DemoView) => void }) {
  return (
    <div className="min-h-[calc(100vh-40px)] bg-[#EEF3EF]">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-lg items-center px-5 py-12">
        <section className="w-full rounded-2xl border border-[#D2DDD6] bg-white p-7 text-center shadow-[0_14px_50px_rgba(31,64,54,0.12)] sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#DDEDE2] text-[#356247]">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-[-0.03em] text-[#162A2B]">
            Your form was submitted.
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#667370]">
            Northside Community Resource Center will review your information. We
            sent a private status link to your email.
          </p>
          <div className="mt-6 rounded-xl bg-[#F3F6F3] p-4">
            <p className="text-[11px] font-semibold text-[#75817F]">
              Confirmation number
            </p>
            <p className="mt-1 text-xl font-bold tracking-[0.08em]">SF-24018</p>
          </div>
          <button
            className="mt-6 text-sm font-semibold text-[#275D7A] hover:underline"
            onClick={() => setView("portal")}
            type="button"
          >
            See it in the organization portal
          </button>
        </section>
      </div>
    </div>
  );
}

export default function VolunteerDemo({
  view,
  setView,
  onSubmitted,
}: VolunteerProps) {
  const [step, setStep] = useState(1);
  const [complete, setComplete] = useState(false);
  const [name, setName] = useState("Maya Johnson");
  const [hours, setHours] = useState("18");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      setComplete(true);
      onSubmitted();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (complete) return <Confirmation setView={setView} />;

  return (
    <div className="min-h-[calc(100vh-40px)] bg-[#EEF3EF]">
      <header className="border-b border-[#D8E0DB] bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-stretch justify-between gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
          <BrandMark />
          <DemoSwitcher setView={setView} view={view} />
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl gap-7 px-4 py-7 sm:px-6 sm:py-10 md:grid-cols-[minmax(0,1fr)_270px] md:items-start">
        <form
          className="order-1 overflow-hidden rounded-2xl border border-[#D4DDD7] bg-white shadow-[0_8px_35px_rgba(31,64,54,0.09)]"
          onSubmit={submit}
        >
          <div className="flex items-center gap-2 border-b border-[#E2E7E3] bg-[#F3F7F4] px-5 py-3 text-xs font-semibold text-[#35564C] md:hidden">
            <Building2 className="h-4 w-4" /> Northside Community Resource Center
          </div>
          <div className="border-b border-[#E2E7E3] px-5 py-6 sm:px-8">
            <FormProgress step={step} />
          </div>
          <div className="px-5 py-7 sm:px-8 sm:py-8">
            {step === 1 && <AboutYou name={name} setName={setName} />}
            {step === 2 && <Service hours={hours} setHours={setHours} />}
            {step === 3 && <Review hours={hours} name={name} />}
          </div>
          <div className="flex items-center justify-between border-t border-[#E2E7E3] bg-[#FAFBF9] px-5 py-4 sm:px-8">
            <button
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#566562] ${step === 1 ? "invisible" : "hover:bg-[#EEF1EE]"}`}
              onClick={() => setStep(step - 1)}
              type="button"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-[#275D7A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
              type="submit"
            >
              {step === 3 ? "Submit form" : "Continue"}
              {step === 3 ? (
                <Send className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>
        <OrganizationContext />
      </main>
    </div>
  );
}
