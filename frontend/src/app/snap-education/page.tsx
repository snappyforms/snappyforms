import type { Metadata } from "next";
import styles from "./snap-education.module.css";
import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "SNAP education · SnappyForms",
  description: "Learn what SNAP is, when it can help, and find official Pennsylvania resources for applying, work requirements, exemptions, and reporting.",
};

const guidance = "https://www.pa.gov/agencies/dhs/resources/snap/snap-work-requirements-abawds";
const exemptionScreener = "https://qualtrics.pa.gov/jfe/form/SV_57usZPSZVouCn78";
const cao = "https://www.pa.gov/agencies/dhs/contact/cao-information";
const cls = "https://clsphila.org/highlights/snaplibrary/";
const volunteerSearch = "https://pa-navigate.org/";

export default function SnapEducationPage() {
  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true"><span /><span /><span /><span /><span /></div>
      <div className={styles.shell}>
        <a href="#main" className="sr-only focus:not-sr-only focus:block focus:p-4">Skip to content</a>
        <header className="flex items-center justify-between border-b px-6 py-5">
          <Link href="/" className="text-lg font-bold tracking-tight">SnappyForms<span className="text-primary">.</span></Link>
          <span className="text-xs font-medium text-slate-600">Resource library</span>
        </header>

        <main id="main" className={styles.paper}>
          <section id="overview" className="px-6 pb-9 pt-10 sm:px-8">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600"><BookOpen size={14} aria-hidden="true" /> PENNSYLVANIA · SNAP GUIDE</p>
            <h1 className="font-serif text-5 xl leading-tight tracking-tight sm:text-5xl">Need help with SNAP benefits?<br /><span className="text-primary" >Find resources that work for you.</span></h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600"><strong>SNAP</strong> (the Supplemental Nutrition Assistance Program) helps Pennsylvanians buy groceries each month. It can be a good fit when money is tight, your work hours or income have changed, or you’re between jobs.</p>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">Whether it's education, application, or maintaining benefits, <strong>there’s plenty of help along the way.</strong></p>
            <h2 className="mt-7 font-serif text-3xl">Discover the resources available to you.</h2>
          </section>

          <nav aria-label="On this page" className="flex flex-wrap gap-x-5 gap-y-3 border-y bg-white px-6 py-4 text-sm font-medium text-primary sm:px-8">
            <a href="#overview" className="underline underline-offset-4">Overview</a>
            <a href="#applications" className="underline underline-offset-4">Application help</a>
            <a href="#work-help" className="underline underline-offset-4">Work requirement help</a>
            <a href="#volunteer" className="underline underline-offset-4">Volunteer opportunities</a>
          </nav>

          <div className={styles.sections}>
            <section id="applications" className={styles.section}>
              <span className={styles.sectionNumber} aria-hidden="true">01</span>
              <div>
                <p className={styles.kicker}>GET STARTED</p>
                <h2>Help with SNAP applications</h2>
                <p>Connect with your County Assistance Office (CAO) or a local non-profit for application assistance and questions about SNAP.</p>
                <div className="grid grid-cols-2 justify-between gap-10">
                <a href={cao} className={styles.sectionAction}>Find your county office <ArrowUpRight size={18} aria-hidden="true" /></a>
                <a href={cao} className={styles.sectionActionSecondary}>Find local non-profits <ArrowUpRight size={18} aria-hidden="true" /></a>
              </div>
              </div>
            </section>

            <section id="work-help" className={styles.section}>
              <span className={styles.sectionNumber} aria-hidden="true">02</span>
              <div>
                <p className={styles.kicker}>KNOW YOUR OPTIONS</p>
                <h2>Help with work requirements</h2>
                <p>Your CAO can explain exemptions, which documents to share, and how reporting works.</p>
                <div className="grid grid-cols-2 justify-between gap-10">
                  <div className="flex flex-col">
                    <a href={exemptionScreener} className={styles.sectionAction} target="_blank" rel="noopener noreferrer">Check if you’re exempt <ArrowUpRight size={18} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
                    <div className={styles.extraResource}>
                      <h3>Exemption Screener</h3>
                      <p className="mt-4 text-sm leading-relaxed text-slate-600">You may be exempt from work requirements. Your caseworker can confirm your results.</p>
                      <a href={guidance} className={styles.resourceLink}>Read the official work rules <ArrowUpRight size={17} aria-hidden="true" /></a>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <a href={cao} className={styles.sectionActionSecondary}>Contact your CAO <ArrowUpRight size={18} aria-hidden="true" /></a>
                    <div className={styles.extraResource}>
                      <h3>Community Legal Services</h3>
                      <p>Plain-language SNAP guides on work rules, exemptions, and appeals.</p>
                      <a href={cls} className={styles.resourceLink}>Explore the SNAP library <ArrowUpRight size={17} aria-hidden="true" /></a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="volunteer" className={styles.section}>
              <span className={styles.sectionNumber} aria-hidden="true">03</span>
              <div>
                <p className={styles.kicker}>MAKE A DIFFERENCE</p>
                <h2>Find volunteer opportunities</h2>
                <p>Search for opportunities near you with PA Navigate. Volunteering may count toward work requirements while helping your community.</p>
                <a href={volunteerSearch} className={styles.primaryAction}>Find volunteer opportunities <ArrowUpRight size={18} aria-hidden="true" /></a>
                <ol className={styles.searchSteps}>
                  <li>Enter your <strong>ZIP code</strong> → Search.</li>
                  <li>On the next page, search <strong>“snap work requirements”</strong> at the top left → click the magnifying glass.</li>
                </ol>
                <p className={styles.smallNote}>Your caseworker can confirm what counts and how to report your hours.</p>
              </div>
            </section>
          </div>
        </main>
        <footer className="border-t px-6 py-6 text-xs leading-relaxed text-slate-600 sm:px-8">
          <p>Resources: PA DHS · Community Legal Services · PA Navigate</p>
          <p className="mt-3">SnappyForms is independent of DHS. Your caseworker confirms which rules apply to you. This page does not submit information to DHS.</p>
          <Link href="/" className="mt-4 inline-block font-medium text-primary underline">Back to SnappyForms</Link>
        </footer>
      </div>
    </div>
  );
}