'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Leaf, FileText, ShieldCheck, Plus, Download, Copy, CheckCircle2, ExternalLink, Maximize2, X, Send, UserRound } from 'lucide-react';
import './beneficiary.css';
import PdfPreview from './PdfPreview';
type Answers = Record<string, string>;
type Entry = {
    id: string;
    answers: Answers;
    status: string;
    created: string;
    expires?: number;
    revoked?: boolean;
    signature?: string;
    receipt?: string;
    deletedAt?: string;
};
const offices = [
    { city: 'Philadelphia', name: 'Philadelphia CAO - West District', fax: '215-560-2053' },
    { city: 'Philadelphia', name: 'Philadelphia CAO - Delancey District', fax: '215-560-2907' },
    { city: 'Philadelphia', name: 'Philadelphia CAO - Elmwood District', fax: '215-560-2065' },
    { city: 'Lancaster', name: 'Lancaster County Assistance Office', fax: '717-299-7565' },
];
const KEY = 'snappy-beneficiary-demo-v1';
const initial: Answers = { name: '', dob: '', ssnLast4: '', address: '', city: '', zip: '', org: '', orgAddress: '', orgCity: '', orgZip: '', orgPhone: '', supervisor: '', mobile: '', start: '', end: '', schedule: '', hours: '', tasks: '', task2: '', task3: '', transport: '', email: '', office: 'Confirm my assigned county office', fax: '' };
const sample: Answers = { ...initial, name: 'Maya Johnson', dob: '1992-06-15', address: '123 Maple Street', city: 'Philadelphia', zip: '19104', org: 'Maple Community Pantry', supervisor: 'Jordan Lee', mobile: '2155550142', start: '2026-11-01', email: 'maya@example.com' };
const steps = [
    { title: 'First, a little about you.', sub: 'Let’s put the right name on your form.', fields: [['name', 'Your full name', 'text'], ['dob', 'Date of birth', 'date'], ['ssnLast4', 'Last 4 digits of Social Security number', 'text']] },
    { title: 'Where do you call home?', sub: 'Your address helps you confirm the right county office.', fields: [['address', 'Street address', 'text'], ['city', 'City', 'text'], ['zip', 'ZIP code', 'text']] },
    { title: 'Where will you volunteer?', sub: 'One organization goes on each form. It’s okay if you don’t have every detail.', fields: [['org', 'Organization name', 'text'], ['orgAddress', 'Organization street address', 'text'], ['orgCity', 'Organization city', 'text'], ['orgZip', 'Organization ZIP code', 'text'], ['orgPhone', 'Organization phone', 'tel']] },
    { title: 'What will your service look like?', sub: 'Share what you know. Your organization will verify these details.', fields: [['start', 'Service start date', 'date'], ['end', 'Expected end date', 'date'], ['schedule', 'Days and times', 'text'], ['hours', 'Estimated hours each week', 'number'], ['tasks', 'Duty 1', 'text'], ['task2', 'Duty 2 (optional)', 'text'], ['task3', 'Duty 3 (optional)', 'text']] },
    { title: 'A ride to your service?', sub: 'Will the organization provide transportation at no cost?', fields: [] },
    { title: 'Who will review your form?', sub: 'We’ll protect organization access with a code to this person’s mobile number.', fields: [['supervisor', 'Supervisor’s full name', 'text'], ['mobile', 'Supervisor’s mobile number', 'tel']] },
    { title: 'Keep your progress safe.', sub: 'Use your email to save your draft and return whenever you need to.', fields: [['email', 'Your email address', 'email']] },
];
const labels: Record<string, string> = Object.fromEntries(steps.flatMap(s => s.fields.map(([k, l]) => [k, l])));
const unknownKeys = ['orgAddress', 'orgCity', 'orgZip', 'orgPhone', 'start', 'end', 'schedule', 'hours', 'tasks', 'transport'];
const required = ['name', 'dob', 'address', 'city', 'zip', 'org', 'supervisor', 'mobile', 'email'];
function normalizeAnswers(saved: Answers): Answers {
    const result = { ...initial, ...saved };
    if (saved.task2 === undefined && saved.task3 === undefined && saved.tasks !== 'Unknown') {
        const duties = (saved.tasks || '').split(',').map(s => s.trim());
        result.tasks = duties[0] || '';
        result.task2 = duties[1] || '';
        result.task3 = duties.slice(2).join(', ');
    }
    return result;
}
function statusClass(s: string) { return s === 'Delivered' ? 'success' : s === 'Delivery failed' ? 'failed' : ''; }
export default function BeneficiaryPrototype() {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [answers, setAnswers] = useState<Answers>(initial);
    const [screen, setScreen] = useState('home');
    const [step, setStep] = useState(0);
    const app = useRef<HTMLDivElement>(null);
    const [id, setId] = useState('');
    const [ready, setReady] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [code, setCode] = useState('');
    const [verified, setVerified] = useState(false);
    const [signature, setSignature] = useState('');
    const [consent, setConsent] = useState(false);
    const [destination, setDestination] = useState(false);
    const [fail, setFail] = useState(false);
    const pdfSequence = useRef(0);
    const [pdf, setPdf] = useState('');
    const [busy, setBusy] = useState(false);
    const [saveCode, setSaveCode] = useState('');
    const [showSavedPdf, setShowSavedPdf] = useState(false);
    const deleteDialog = useRef<HTMLDialogElement>(null);
    const [deletedDraftId, setDeletedDraftId] = useState('');
    const [pendingDeleteId, setPendingDeleteId] = useState('');
    const pendingDelete = entries.find(e => e.id === pendingDeleteId && !e.deletedAt);
    const visibleEntries = entries.filter(e => !e.deletedAt);
    const active = visibleEntries.find(e => e.id === id);
    const locked = !!active && ['Signed', 'Sending', 'Delivered', 'Delivery failed'].includes(active.status);
    useEffect(() => {
        app.current?.scrollTo(0, 0);
    }, [screen, step]);
    useEffect(() => { try {
        const stored = JSON.parse(localStorage.getItem(KEY) || '[]');
        if (Array.isArray(stored))
            setEntries(stored.map((entry: Entry) => ({ ...entry, answers: normalizeAnswers(entry.answers) })));
    }
    catch { } setReady(true); const token = new URLSearchParams(location.search).get('review'); if (token) {
        setId(token);
        setScreen('verify');
    } }, []);
    useEffect(() => { if (ready)
        try {
            localStorage.setItem(KEY, JSON.stringify(entries));
        }
        catch {
            setMessage('Browser storage is unavailable. Keep this tab open to retain your draft.');
        } }, [entries, ready]);
    useEffect(() => { if (screen === 'verify' && active)
        setAnswers(normalizeAnswers(active.answers)); }, [screen, active]);
    useEffect(() => () => { if (pdf)
        URL.revokeObjectURL(pdf); }, [pdf]);
    useEffect(() => { if (ready && (screen === 'questions' || screen === 'organization' && !locked))
        persist(screen === 'questions' ? 'Draft' : 'Awaiting organization'); }, [answers, screen, ready]);
    useEffect(() => { if (screen === 'review' || screen === 'organization' || screen === 'send' || screen === 'shared') {
        ++pdfSequence.current;
        setBusy(true);
        const timer = setTimeout(() => { void generatePdf(); }, 600);
        return () => clearTimeout(timer);
    } }, [answers, screen, active?.signature]);
    function update(k: string, v: string) { setAnswers(a => ({ ...a, [k]: v })); setError(''); }
    function persist(status = active?.status || 'Draft', extra: Partial<Entry> = {}) { const entry: Entry = { id: id || crypto.randomUUID(), answers: { ...answers }, status, created: active?.created || new Date().toISOString(), ...active, ...extra }; entry.answers = { ...answers }; entry.status = status; setId(entry.id); setEntries(es => [entry, ...es.filter(e => e.id !== entry.id)]); return entry; }
    function resetDemo() {
        if (!window.confirm('Reset this demo? This permanently removes all saved demo forms, answers, signatures, and receipts in this browser. Downloaded files are not removed. Close other SnappyForms tabs first.')) return;
        try {
            localStorage.removeItem(KEY);
            // Reload without a review token, disposing pending PDF and delivery work.
            location.replace('/prototype');
        } catch {
            setMessage('Unable to clear browser storage. Check your browser storage settings and try again.');
        }
    }
    function start(prefill = false) { setAnswers(prefill ? { ...initial, ...visibleEntries[0]?.answers, start: '', end: '', schedule: '', hours: '', tasks: '', task2: '', task3: '', transport: '' } : initial); setId(''); setStep(0); setScreen('questions'); setError(''); setSaveCode(''); setVerified(false); setSignature(''); setConsent(false); setDestination(false); }
    function open(e: Entry) { setShowSavedPdf(false); setId(e.id); setAnswers(normalizeAnswers(e.answers)); setScreen(e.status === 'Draft' && !e.answers.email ? 'questions' : e.status === 'Draft' ? 'review' : 'shared'); setStep(0); setVerified(false); setSignature(e.signature || ''); setConsent(false); setDestination(false); }
    function validateLast4() {
        if (answers.ssnLast4 && !/^\d{4}$/.test(answers.ssnLast4)) {
            setError('Enter exactly four digits for the Social Security number, or leave it blank for this demo.');
            return false;
        }
        return true;
    }
    function requestDeleteDraft(entry: Entry) {
        if (entry.status !== 'Draft') return;
        setPendingDeleteId(entry.id);
        deleteDialog.current?.showModal();
    }
    function deleteDraft() {
        if (pendingDelete?.status !== 'Draft') return;
        setEntries(es => es.map(e => e.id === pendingDelete.id ? { ...e, deletedAt: new Date().toISOString() } : e));
        setDeletedDraftId(pendingDelete.id);
        deleteDialog.current?.close();
        setScreen('home');
        setId('');
        setPdf('');
        setError('');
        setMessage('Draft deleted.');
    }
    function undoDeleteDraft() {
        setEntries(es => es.map(e => e.id === deletedDraftId ? { ...e, deletedAt: undefined } : e));
        setDeletedDraftId('');
        setMessage('Draft restored.');
    }
    function next() { if (step === 0 && !validateLast4()) return; const invalid = steps[step].fields.find(([k]) => required.includes(k) && !answers[k].trim()); if (invalid) {
        setError(`Please enter ${invalid[1].toLowerCase()}.`);
        return;
    } if (step === 5 && answers.mobile.replace(/\D/g, '').length !== 10) {
        setError('Enter a 10-digit mobile number for this demo.');
        return;
    } if (step === 6) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email)) {
            setError('Enter a valid email address.');
            return;
        }
        if (saveCode !== '123456') {
            setError('Enter demo code 123456 to save your account.');
            return;
        }
        persist('Draft');
        setScreen('review');
        return;
    } if (step === 4 && !answers.transport) {
        setError('Choose a transportation option.');
        return;
    } setStep(s => s + 1); setError(''); }
    function share() { if (!validateLast4()) return; if (!answers.office || answers.office === 'Confirm my assigned county office') {
        setError('Enter your assigned county office before sharing.');
        return;
    } persist('Awaiting organization', { expires: Date.now() + 14 * 86400000, revoked: false }); setScreen('shared'); setError(''); }
    async function generatePdf() { const sequence = ++pdfSequence.current; setBusy(true); try {
        const { fillBeneficiaryPrototype } = await import('@/lib/pdf/beneficiaryPrototype');
        const response = await fetch('/forms/pa-1938.pdf');
        if (!response.ok || response.redirected || !response.headers.get('content-type')?.includes('application/pdf')) {
            throw new Error('The public PDF template is unavailable.');
        }
        const bytes = await fillBeneficiaryPrototype(await response.arrayBuffer(), answers, active);
        if (sequence !== pdfSequence.current)
            return;
        setPdf(URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })));
        setError('');
    }
    catch {
        if (sequence !== pdfSequence.current) return;
        setError('The PDF could not be generated. Please try again.');
    }
    finally {
        if (sequence === pdfSequence.current)
            setBusy(false);
    } }
    async function copy() { const link = `${location.origin}/prototype?review=${id}`; try {
        await navigator.clipboard.writeText(link);
        setMessage('Review link copied. Opens on this browser only.');
    }
    catch {
        setMessage(link);
    } }
    function submit() { setMessage(''); if (!locked || !destination || !answers.office.trim() || answers.office === 'Confirm my assigned county office') { setError('Confirm the county office and destination before sending.'); return; } if (!answers.fax.match(/^\+?[\d\s()-]{10,18}$/)) {
        setError('Enter a valid destination fax number for the simulated send.');
        return;
    } persist('Sending'); setScreen('shared'); setTimeout(() => { setEntries(es => es.map(e => e.id === id ? { ...e, status: fail ? 'Delivery failed' : 'Delivered', receipt: `DEMO-${Date.now()}` } : e)); setMessage(fail ? 'Demo delivery failed. Your signed copy is saved.' : 'Demo notification: your form was delivered to the county office.'); }, 1800); }
    function receipt() { const text = `SNAPPYFORMS - SIMULATED FAX RECEIPT\nReference: ${active?.receipt}\nVolunteer: ${answers.name}\nDestination: ${answers.office}\nFax: ${answers.fax}\nResult: ${active?.status}\nThis is a demonstration. No fax was sent. Delivery does not indicate benefit approval.`; const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); const a = document.createElement('a'); a.href = url; a.download = 'demo-fax-receipt.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    function field(k: string, label: string, type = 'text', org = false) { return <label key={k} className={`sf-field ${org && unknownKeys.includes(k) && (!answers[k] || answers[k] === 'Unknown') ? 'attention' : ''}`}><span>{label}</span><input type={type} value={answers[k] === 'Unknown' ? '' : answers[k] || ''} placeholder={answers[k] === 'Unknown' ? 'Organization will complete' : undefined} min={type === 'number' ? 0 : undefined} inputMode={k === 'ssnLast4' ? 'numeric' : undefined} pattern={k === 'ssnLast4' ? '[0-9]{4}' : undefined} autoComplete={k === 'ssnLast4' ? 'off' : undefined} maxLength={k === 'ssnLast4' ? 4 : type === 'text' ? 120 : undefined} onChange={e => update(k, k === 'ssnLast4' ? e.target.value.replace(/\D/g, '').slice(0, 4) : e.target.value)} disabled={org && locked}/>{k === 'ssnLast4' && <small>Optional for this demo. Use four fictional digits, never your full Social Security number.</small>}{!org && unknownKeys.includes(k) && <button type="button" className="sf-unknown" onClick={() => update(k, answers[k] === 'Unknown' ? '' : 'Unknown')}>{answers[k] === 'Unknown' ? '✓ Organization will complete' : 'I don’t know yet'}</button>}</label>; }
    const expired = !!active && (active.revoked || !!active.expires && active.expires < Date.now());
    return <div className="sf-app" ref={app}>
      <div className="sf-demo">
        <span><strong>Interactive demo</strong> · Use fictional information only</span>
        <button type="button" className="sf-reset" onClick={resetDemo}>Reset demo</button>
      </div>
      <header className="sf-header">
        <div className="sf-header-inner">
          <a className="sf-brand" href="/" aria-label="SnappyForms home">
            <span className="sf-logo"><Leaf size={22} aria-hidden="true"/></span>snappyforms
          </a>
          <nav aria-label="Demo">
            <button type="button" className={screen === 'home' ? 'selected' : ''} onClick={() => { setScreen('home'); setMessage(''); }}>My forms</button>
          </nav>
        </div>
      </header>
  {message && <div className="sf-toast" role="status">{message}{message === 'Draft deleted.' && deletedDraftId && <button className="sf-undo" onClick={undoDeleteDraft}>Undo</button>}<button onClick={() => setMessage('')} aria-label="Dismiss notification">×</button></div>}
  <main className={screen === 'home' ? "sf-main sf-main-home" : "sf-main"}>
  {screen === 'home' && <div className="sf-hero-band">
    <section className="sf-home-intro">
      <div>
        <h1>Try the SNAP <span>verification demo.</span></h1>
        <div className="sf-sample-profile">
          <span className="sf-sample-avatar">
            <img src="/prototype/sample-volunteer.png" width={374} height={370} alt=""/>
          </span>
          <div>
            <strong>{sample.name}</strong>
            <small>Returning volunteer · Demo profile</small>
          </div>
        </div>
        <p>Start with a fictional volunteer and organization already filled in.</p>
        <button className="sf-primary" onClick={() => { setAnswers(sample); setId(''); setStep(0); setScreen('questions'); }}>Try with sample information <ArrowRight size={18}/></button>
      </div>
      <div className="sf-sample-card">
        <span className="sf-file-icon"><UserRound size={24} aria-hidden="true"/></span>
        <h2>Or see how first-time users meet SnappyForms</h2>
        <button className="sf-secondary" onClick={() => start()}>Start a new form <ArrowRight size={16}/></button>
      </div>
      <aside className="sf-public-notice" aria-label="About this demonstration">Use fictional information. Drafts stay in this browser, and review links only work here. The demo simulates verification, signing, and delivery.</aside>
    </section>
  </div>}
  {screen === 'home' &&
  <section className="sf-forms"><div className="sf-section-title"><div><h2>My forms <span>{visibleEntries.length}</span></h2><p>Your demo progress is saved in this browser.</p></div>{visibleEntries.length > 0 && <button className="sf-secondary" onClick={() => start(true)}><Plus size={16}/> New form with saved info</button>}</div>{!visibleEntries.length ? <div className="sf-empty"><div className="sf-file-icon"><FileText size={28}/></div><div><h3>No saved forms yet</h3><p>Your drafts, signed forms, and delivery receipts will appear here.</p></div></div> : <div className="sf-form-list">{visibleEntries.map(e => <div key={e.id} className="sf-form-item"><button className="sf-form-row" onClick={() => open(e)}><span className="sf-file-icon"><FileText size={23}/></span><span><strong>Volunteer verification</strong><small>{e.answers.org} · {new Date(e.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small></span><span className={`sf-badge ${statusClass(e.status)}`}>{e.status}</span><ArrowRight size={18}/></button>{e.status === 'Draft' && <button className="sf-home-delete" aria-label={`Delete draft for ${e.answers.org || e.answers.name || 'volunteer verification'}`} onClick={() => requestDeleteDraft(e)}>Delete draft</button>}</div>)}</div>}</section>}
  {screen === 'questions' && <div className="sf-wizard"><aside><h2>Volunteer verification</h2><p>We’ll help prepare your PA-1938 for your organization to review and sign.</p><ol>{['About you', 'Your address', 'Organization', 'Your service', 'Transportation', 'Your supervisor', 'Save & review'].map((s, i) => <li className={i === step ? 'current' : i < step ? 'done' : ''} key={s}><span>{i < step ? <Check size={13}/> : i + 1}</span>{s}</li>)}</ol><div className="sf-aside-note"><ShieldCheck size={19}/> Demo only. Please use fictional details.</div></aside><section className="sf-question"><div className="sf-progress-label">Step {step + 1} of 7 <span>{Math.round((step + 1) / 7 * 100)}% complete</span></div><div className="sf-progress"><i style={{ width: `${(step + 1) / 7 * 100}%` }}/></div><h1>{steps[step].title}</h1><p>{steps[step].sub}</p><form onSubmit={e => { e.preventDefault(); next(); }}>{steps[step].fields.map(([k, l, t]) => field(k, l, t))}{step === 4 && <div className="sf-choices">{['Yes', 'No', 'Unknown'].map(v => <button type="button" key={v} className={answers.transport === v ? 'chosen' : ''} onClick={() => { update('transport', v); setStep(5); }}>{v === 'Unknown' ? 'I don’t know yet' : v}<ArrowRight size={18}/></button>)}</div>}{step === 6 && <div className="sf-code-box"><strong>Simulated email verification</strong><p>No email is sent. Enter <b>123456</b> to try the save flow.</p><label className="sf-field"><span>Verification code</span><input value={saveCode} inputMode="numeric" onChange={e => setSaveCode(e.target.value)} maxLength={6}/></label></div>}{error && <p role="alert" className="sf-error">{error}</p>}<div className="sf-actions"><button type="button" className="sf-back" onClick={() => step ? setStep(step - 1) : setScreen('home')}><ArrowLeft size={16}/> Back</button><button className="sf-primary" type="submit">{step === 6 ? 'Save & review my form' : 'Continue'}<ArrowRight size={18}/></button></div></form><div className="sf-bottom-note">Your organization will verify the details before signing.</div></section></div>}
  {screen === 'review' && <><button className="sf-back" onClick={() => setScreen('home')}><ArrowLeft size={16}/> My forms</button><div className="sf-page-heading"><h1>Review your draft</h1><p>Check your details, then invite your organization to finish and sign.</p></div><div className="sf-review-grid"><section className="sf-card"><h2>Your draft</h2><p className="sf-muted">Edit anything below. Blank service details will be flagged for your organization.</p>{Object.entries(labels).map(([k, l]) => field(k, l, k === 'dob' || k === 'start' || k === 'end' ? 'date' : k === 'hours' ? 'number' : k === 'email' ? 'email' : 'text'))}{field('transport', 'Transportation provided')}<h3>County destination</h3><p className="sf-muted">Your address: {answers.city}, PA {answers.zip}. Confirm your assigned office; an address alone may not identify the right district.</p>{offices.filter(o => o.city.toLowerCase() === answers.city.toLowerCase()).length > 0 && <div className="sf-code-box"><strong>Offices to consider near {answers.city}</strong><p>Your assigned district may differ. Select only after confirming it.</p>{offices.filter(o => o.city.toLowerCase() === answers.city.toLowerCase()).map(o => <button key={o.name} className="sf-office-option" onClick={() => setAnswers(a => ({ ...a, office: o.name, fax: o.fax }))}>{o.name}<span>{o.fax}</span></button>)}</div>}{field('office', 'Assigned county assistance office')}{field('fax', 'Office fax number (can be completed by organization)', 'tel')}<small>Demo directory covers selected Philadelphia and Lancaster offices. Source: <a href="https://www.pa.gov/agencies/dhs/contact/cao-information" target="_blank" rel="noreferrer">PA DHS directory</a> · checked October 21, 2026. Enter another office manually.</small>{error && <p className="sf-error" role="alert">{error}</p>}<div className="sf-actions"><button className="sf-secondary" onClick={() => { persist('Draft'); setMessage('Draft saved in this browser.'); }}>Save draft</button><button className="sf-primary" onClick={share}>Create review link <ArrowRight size={17}/></button></div></section><PdfPanel pdf={pdf} busy={busy} generate={generatePdf}/></div></>}
  {screen === 'shared' && active && <><button className="sf-back" onClick={() => setScreen('home')}><ArrowLeft size={16}/> My forms</button><div className="sf-shared"><div className="sf-big-check"><CheckCircle2 size={38}/></div><span className={`sf-badge ${statusClass(active.status)}`}>{active.status}</span><h1>{active.status === 'Delivered' ? 'Your demo form was delivered.' : active.status === 'Delivery failed' ? 'Let’s try that delivery again.' : active.status === 'Sending' ? 'Sending your form…' : active.status === 'Signed' ? 'Your form is signed. Ready to send?' : 'Your form is ready for its next step.'}</h1><p>{active.status === 'Delivered' ? 'Demo notification: your signed form was delivered. A receipt is saved below. This does not mean county approval.' : `Your draft for ${answers.org} is saved. ${answers.supervisor} can review, complete, and sign it.`}</p><ol className="sf-timeline" aria-label="Form progress">
      {['Draft', 'Awaiting organization', 'Signed', 'Delivered'].map((status, index, stages) => {
        const currentStatus = ['Sending', 'Delivery failed'].includes(active.status) ? 'Signed' : active.status;
        const complete = index <= stages.indexOf(currentStatus);
        return (
          <li className={complete ? 'complete' : undefined} key={status}>
            <span className="sf-timeline-marker" aria-hidden="true">{complete && <Check size={16} strokeWidth={3}/>}</span>
            <small>{status === 'Delivered' ? 'Sent to county' : status}</small>
            <span className="sr-only">{complete ? ' (reached)' : ' (upcoming)'}</span>
          </li>
        );
      })}
    </ol>{active.status === 'Awaiting organization' && <div className="sf-share-box"><h3>Invite your organization</h3><p>Copy this link and send it to {answers.supervisor} yourself.</p><div className="sf-link-box"><input readOnly aria-label="Organization review link" value={typeof location !== 'undefined' ? `${location.origin}/prototype?review=${id}` : ''}/><button aria-label="Copy review link" onClick={copy}><Copy size={18}/></button></div><small>Open this demo link in the same browser on this site. It expires after 14 days.</small><div className="sf-actions"><button className="sf-primary" onClick={() => { setScreen('verify'); setVerified(false); setCode(''); }}>Try organization view <ExternalLink size={16}/></button><button className="sf-link" onClick={() => { persist(active.status, { expires: Date.now() + 14 * 86400000, revoked: false }); setMessage('Review access renewed for 14 days.'); }}>Renew access</button><button className="sf-link" onClick={() => { persist(active.status, { revoked: true }); setMessage('Review access revoked.'); }}>Revoke</button></div></div>}{['Signed', 'Delivered', 'Delivery failed'].includes(active.status) && <div className="sf-downloads"><button className="sf-secondary" onClick={() => setShowSavedPdf(v => !v)}><FileText size={17}/>{showSavedPdf ? 'Hide signed form' : 'View signed form'}</button>{active.receipt && <button className="sf-secondary" onClick={receipt}><Download size={17}/> Download demo receipt</button>}{active.status !== 'Delivered' && <button className="sf-primary" onClick={() => { setScreen('send'); setVerified(true); }}>Review & {active.status === 'Delivery failed' ? 'retry' : 'send'}</button>}</div>}{pdf && !busy && <a className="sf-primary" href={pdf} download="pa-1938-demo.pdf">Download prepared PDF <Download size={17}/></a>}{showSavedPdf && locked && <div className="sf-saved-preview"><PdfPanel pdf={pdf} busy={busy} generate={generatePdf}/></div>}</div></>}
  {screen === 'verify' && <section className="sf-verification sf-card"><ShieldCheck size={38}/><div className="sf-eyebrow">ORGANIZATION ACCESS</div><h1>Verify your access</h1>{!active ? <p>This browser has no form for this link. Open it in the browser where the demo form was created.</p> : expired ? <p>This review link has expired or was revoked. The user can renew it from My forms.</p> : locked ? <><p>This form has already been signed. Editing is closed.</p><button className="sf-primary" onClick={() => setScreen(active.status === 'Signed' || active.status === 'Delivery failed' ? 'send' : 'shared')}>{active.status === 'Signed' || active.status === 'Delivery failed' ? 'Continue to send to CAO' : 'View status'}</button></> : <><p>Review a volunteer verification for <strong>{answers.name}</strong>. The demo code goes to the designated supervisor’s number ending in {answers.mobile.slice(-4)}.</p><div className="sf-code-box">SMS is simulated. Demo code: <strong>123456</strong></div><label className="sf-field"><span>Verification code</span><input inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value)}/></label>{error && <p className="sf-error" role="alert">{error}</p>}<button className="sf-primary" onClick={() => { if (code !== '123456') {
        setError('Use the demo code 123456.');
        return;
    } setVerified(true); setScreen('organization'); setError(''); }}>Verify & review <ArrowRight size={17}/></button><button className="sf-link" onClick={() => setMessage('Demo code resent: 123456. No SMS was sent.')}>Resend code</button><small>Verification is simulated and provides no real access security.</small></>}</section>}
  {screen === 'organization' && verified && active && <><div className="sf-page-heading"><div className="sf-eyebrow">ORGANIZATION REVIEW</div><h1>Review and sign the form</h1><p>Verify {answers.name}’s draft, complete the missing details, and sign.</p></div><div className="sf-review-grid"><section className="sf-card"><div className="sf-code-box"><strong>{locked ? 'Signed copy · editing closed' : 'Needs your attention'}</strong><p>{locked ? 'Review the destination below before the simulated send.' : 'Highlighted fields are missing or were left for your organization. These highlights do not appear on the PDF.'}</p></div>{Object.entries(labels).filter(([k]) => k !== 'email' && k !== 'mobile').map(([k, l]) => field(k, l, k === 'dob' || k === 'start' || k === 'end' ? 'date' : k === 'hours' ? 'number' : 'text', true))}{field('transport', 'Transportation provided (Yes / No)', 'text', true)}<p className="sf-muted">Required monthly hours are reserved for the CAO or its contractor.</p>{!locked && <><h3>Supervisor certification</h3><label className="sf-field"><span>Type your full name to sign this demo</span><input value={signature} onChange={e => setSignature(e.target.value)}/></label><label className="sf-checkbox"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}/>I have reviewed this draft and confirm the volunteer service details for this demonstration.</label><button className="sf-primary" onClick={() => { if (!validateLast4()) return; if (answers.end < answers.start) {
        setError('The end date must be on or after the start date.');
        return;
    } if (!Number.isFinite(Number(answers.hours)) || Number(answers.hours) <= 0 || Number(answers.hours) > 168) {
        setError('Enter weekly hours between 1 and 168.');
        return;
    } const missing = unknownKeys.filter(k => !answers[k] || answers[k] === 'Unknown'); if (missing.length) {
        setError('Complete all highlighted service and organization fields before signing.');
        return;
    } if (!['Yes', 'No'].includes(answers.transport)) {
        setError('Transportation must be Yes or No.');
        return;
    } if (!signature.trim() || !consent) {
        setError('Enter your name and confirm the certification.');
        return;
    } persist('Signed', { signature: signature.trim() }); setScreen('send'); setDestination(false); setError(''); }}>Sign demonstration form <Check size={17}/></button></>}{error && <p className="sf-error" role="alert">{error}</p>}<p className="sf-muted">After signing, you’ll confirm the county destination and send this form in a separate step.</p></section><PdfPanel pdf={pdf} busy={busy} generate={generatePdf}/></div></>}
  {screen === 'send' && active && locked && <><button className="sf-back" onClick={() => setScreen('shared')}><ArrowLeft size={16}/> Form status</button><div className="sf-page-heading"><div className="sf-eyebrow">FINAL STEP · SEND TO COUNTY</div><h1>Send the signed form</h1><p>Your signature is saved. Confirm the destination below to finish submitting your form.</p></div><div className="sf-review-grid"><section className="sf-card"><div className="sf-code-box"><strong><CheckCircle2 size={18}/> Signed by {active.signature}</strong><p>Signing saves the form. Sending delivers it to the county office.</p></div><h2>Send to your CAO</h2>{field('office', 'Confirmed county office')}{field('fax', 'Confirmed office fax number', 'tel')}<label className="sf-checkbox"><input type="checkbox" checked={destination} onChange={e => setDestination(e.target.checked)}/>I confirmed this is the correct destination for this form.</label><details className="sf-test-options"><summary>Demo presentation options</summary><label className="sf-checkbox"><input type="checkbox" checked={fail} onChange={e => setFail(e.target.checked)}/>Demonstrate a delivery failure</label></details>{error && <p className="sf-error" role="alert">{error}</p>}<button className="sf-primary sf-send-button" disabled={!destination || active.status === 'Delivered'} onClick={submit}><Send size={17}/>{active.status === 'Delivery failed' ? 'Retry sending to CAO (demo)' : 'Send to CAO (demo)'}</button><p className="sf-muted">Demo only: no fax is sent. The next screen shows simulated delivery and a downloadable receipt. Signature acceptance must be confirmed before a real pilot.</p></section><PdfPanel pdf={pdf} busy={busy} generate={generatePdf}/></div></>}
  <dialog ref={deleteDialog} className="sf-delete-dialog" aria-labelledby="sf-delete-title" onClose={() => setPendingDeleteId('')}><h2 id="sf-delete-title">Delete this draft?</h2><p>This removes your unfinished volunteer verification for {pendingDelete?.answers.org || pendingDelete?.answers.name || 'this organization'} from My forms. You can undo this after deleting.</p><div className="sf-actions"><button className="sf-secondary" autoFocus onClick={() => deleteDialog.current?.close()}>Keep draft</button><button className="sf-delete-confirm" onClick={deleteDraft}>Delete draft</button></div></dialog>
  </main><footer className="sf-footer"><a className="sf-brand" href="/"><Leaf size={17} aria-hidden="true"/> snappyforms</a><span>PA-1938 volunteer verification demo</span></footer></div>;
}
function PdfPanel({ pdf, busy, generate }: { pdf: string; busy: boolean; generate: () => void }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [zoom, setZoom] = useState(1);
    const src = pdf || '/forms/pa-1938.pdf';
    return <aside className="sf-pdf sf-card"><div className="sf-section-title"><div><h3>Your PA-1938</h3><p>Official form · editable download</p></div><FileText size={22}/></div>
        <div className="sf-pdf-toolbar"><button className="sf-secondary" onClick={() => { setExpanded(true); dialog.current?.showModal(); }}><Maximize2 size={16}/> View PDF full screen</button><button className="sf-link" onClick={generate} disabled={busy}>{busy ? 'Updating preview…' : 'Refresh preview'}</button></div>
        <p className="sf-muted" role="status">{busy ? 'Updating your PDF with the latest answers…' : 'Preview is up to date. Edits to a downloaded copy do not update this demo.'}</p>
        <PdfPreview src={src}/>
        {pdf && !busy && <a className="sf-primary" href={pdf} download="pa-1938-demo.pdf"><Download size={16}/> Download fillable PDF</a>}
        <dialog ref={dialog} className="sf-pdf-dialog" aria-labelledby="sf-fullscreen-title" onClose={() => setExpanded(false)}><div className="sf-fullscreen-toolbar"><div><h2 id="sf-fullscreen-title">Your PA-1938</h2><span role="status">{busy ? 'Updating with your latest answers…' : 'Full-screen preview'}</span></div><div><button className="sf-secondary" aria-label="Zoom out PDF" disabled={zoom <= 1} onClick={() => setZoom(z => Math.max(1, z - .25))}>−</button><span className="sf-zoom-label">{Math.round(zoom * 100)}%</span><button className="sf-secondary" aria-label="Zoom in PDF" disabled={zoom >= 2} onClick={() => setZoom(z => Math.min(2, z + .25))}>+</button>{pdf && !busy && <a className="sf-secondary" href={pdf} download="pa-1938-demo.pdf"><Download size={16}/> Download</a>}<button className="sf-secondary" aria-label="Close full-screen PDF" onClick={() => dialog.current?.close()}><X size={20}/> Close</button></div></div>{expanded && <PdfPreview src={src} fullScreen zoom={zoom}/>}</dialog>
    </aside>;
}
