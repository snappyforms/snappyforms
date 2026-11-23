import { inter, poppins } from "@/components/home/fonts";
import SnappyWordmark from "@/components/SnappyWordmark";
import type { Metadata } from "next";
import styles from "./snap-education.module.css";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "SNAP education · SnappyForms",
  description: "Learn what SNAP is, when it can help, and find official Pennsylvania resources for applying, work requirements, exemptions, and reporting.",
};

const guidance = "https://www.pa.gov/agencies/dhs/resources/snap/snap-work-requirements-abawds";
const exemptionScreener = "https://qualtrics.pa.gov/jfe/form/SV_57usZPSZVouCn78";
const cao = "https://www.pa.gov/agencies/dhs/contact/cao-information";
const cls = "https://clsphila.org/highlights/snaplibrary/";
const volunteerSearch = "https://pa-navigate.org/";
const assistingOrgs = "/assisting-orgs";

export default function SnapEducationPage() {
  return (
    <div className={`${styles.page} ${poppins.variable} ${inter.variable}`}>
      <div className={styles.backdrop} aria-hidden="true"><span /><span /><span /><span /><span /></div>
      <div className={styles.shell}>
        <a href="#main" className="sr-only focus:not-sr-only focus:block focus:p-4">Skip to content</a>
        <header className="flex items-center justify-between border-b px-6 py-5">
          <Link href="/" className="text-lg"><SnappyWordmark /></Link>
          <span className="text-xs font-medium text-slate-600">Resource library</span>
        </header>

        <main id="main" className={styles.paper}>
          <section id="overview" className={styles.overview}>
            <p className={styles.guide}><BookOpen size={14} aria-hidden="true" /> PENNSYLVANIA · SNAP GUIDE</p>
            <h1>Need help with SNAP benefits?<br /><span>Find resources that work for you.</span></h1>
            <p className={styles.intro}><strong>SNAP</strong> (the Supplemental Nutrition Assistance Program) helps Pennsylvanians buy groceries each month. It can be a good fit when money is tight, your work hours or income have changed, or you’re between jobs.</p>
            <p className={styles.intro}>Whether it's education, application, or maintaining benefits, <strong>there’s plenty of help along the way.</strong></p>
            <h2 className={styles.overviewHeading}>Discover the resources available to you.</h2>
          </section>

          <nav aria-label="On this page" className={styles.contents}>
            <a href="#overview">Overview</a>
            <a href="#applications">Application help</a>
            <a href="#work-help">Work requirement help</a>
            <a href="#volunteer">Volunteer opportunities</a>
          </nav>

          <div className={styles.sections}>
            <section id="applications" className={styles.section}>
              <div>
                <p className={styles.kicker}>GET STARTED</p>
                <h2>Help with SNAP applications</h2>
                <p>Connect with your County Assistance Office (CAO) or a local non-profit for application assistance and questions about SNAP.</p>
                <div className={styles.actions}>
                  <a href={cao} className={styles.primaryAction}>Find your county office</a>
                  <a href={assistingOrgs} className={styles.sectionAction}>Find local organizations</a>
                </div>
              </div>
            </section>

            <section id="work-help" className={styles.section}>
              <div>
                <p className={styles.kicker}>KNOW YOUR OPTIONS</p>
                <h2>Help with work requirements</h2>
                <p>Your CAO can explain exemptions, which documents to share, and how reporting works.</p>
                <div className={styles.actions}>
                  <div className={styles.actionGroup}>
                    <a href={exemptionScreener} className={styles.primaryAction} target="_blank" rel="noopener noreferrer">Check if you’re exempt<span className="sr-only"> (opens in a new tab)</span></a>
                    <div className={styles.extraResource}>
                      <h3>Exemption Screener</h3>
                      <p>You may be exempt from work requirements. Your caseworker can confirm your results.</p>
                      <a href={guidance} className={styles.resourceLink}>Read the official work rules</a>
                    </div>
                  </div>
                  <div className={styles.actionGroup}>
                    <a href={cao} className={styles.sectionAction}>Contact your CAO</a>
                    <div className={styles.extraResource}>
                      <h3>Community Legal Services</h3>
                      <p>Plain-language SNAP guides on work rules, exemptions, and appeals.</p>
                      <a href={cls} className={styles.resourceLink}>Explore the SNAP library</a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="volunteer" className={styles.section}>
              <div>
                <p className={styles.kicker}>MAKE A DIFFERENCE</p>
                <h2>Find volunteer opportunities</h2>
                <p>Search for opportunities near you with PA Navigate. Volunteering may count toward work requirements while helping your community.</p>
                <div className={styles.actions}>
                  <div>
                    <a href={volunteerSearch} target="_blank" className={styles.primaryAction}>Find volunteer opportunities</a>
                    <ol className={styles.searchSteps}>
                      <li>Enter your <strong>ZIP code</strong> → Search.</li>
                      <li>On the next page, search <strong>“snap work requirements”</strong> at the top left → click the magnifying glass.</li>
                    </ol>
                  </div>
                  <a href={assistingOrgs} target="_blank" className={`h-fit ${styles.sectionAction}`}>Find local organizations</a>

                </div>
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
