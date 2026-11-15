import styles from "./assisting-orgs.module.css";
import Link from "next/link";
import { orgAssistance } from "../../data/orgs_that_help";
import { ArrowUpRight, BookOpen } from "lucide-react";


export default function AssistingOrgs() {
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
                        <h1 className="font-serif text-5 xl leading-tight tracking-tight sm:text-5xl">Need help with SNAP benefits?<br /><span className="text-primary" >Find organizations ready to help.</span></h1>
                        <p className="mt-4 text-lg leading-relaxed text-slate-600">Whether it's education, application, or maintaining benefits, <strong>there’s plenty of help along the way.</strong></p>
                        <h2 className="mt-7 font-serif text-3xl">Discover organizations ready to help.</h2>
                    </section>

                    <section id="table" className="px-6 pb-9 pt-5 sm:px-8">
                        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                            <table className="w-full table-fixed divide-y divide-gray-200 bg-white text-left text-sm ">
                                {/* <caption className="font-serif text-xl bg-[#285d98] text-white py-2">Assisting Organizations</caption> */}
                                <thead className="bg-[#285d98] text-white text-xs font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Organization</th>
                                        <th scope="col" className="px-6 py-3">Website</th>
                                        <th scope="col" className="px-6 py-3">Description</th>
                                        <th scope="col" className="px-6 py-3">Phone</th>
                                        <th scope="col" className="px-6 py-3">E-mail</th>
                                        <th scope="col" className="px-6 py-3">Help Offered</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        orgAssistance.map((org) => (
                                            <tr className="odd:bg-white even:bg-gray-50 hover:bg-blue-50/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900">{org.org_name}</td>
                                                <td className="break-words px-6 py-4 text-blue-600 underline"><a href={org.org_website} target="_blank">{org.org_website}</a></td>
                                                <td className="break-words px-6 py-4">{org.description}</td>
                                                <td className="px-6 py-4">{org.phone ? org.phone : null}</td>
                                                <td className="break-words px-6 py-4 text-blue-600 underline"><a href={`mailto:${org.email}`}>{org.email ? `e-mail`: null}</a></td>
                                                <td className="px-6 py-4">{org.help_type}</td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    </section>



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