'use client';
import { useEffect, useRef, useState } from 'react';
import type { Actor, Report, ReportInput } from '../lib/domain';
import { actionLabels, requestedActions, institutionApprovalFor, channels, communityApprovalFor, institutions, prepareCommunityVersion, relationships, relationshipLabels, validateReport, writtenLanguages } from '../lib/domain';
import ReportSummary from './report-summary';
import { api, RequestError } from '../lib/client';
import { Community, Inbox, Journey, Moderation } from './workflow-panels';

type SharingChoice = 'private' | 'organisations' | 'community' | 'both';
const steps = ['Your experience', 'Organisations', 'Sharing choices', 'Review & save'];
const blank = (): ReportInput => ({ fictional: true, title: '', narrative: '', incidentDate: '', channel: 'SMS', outcome: 'attempted', languages: ['English'], associations: [], allowCommunitySharing: false, communityText: '', communityApproval: null, institutionText: '', institutionApproval: null, requestedAction: 'unsure' });
const example = (): ReportInput => ({ ...blank(), title: 'Fictional message asking for a security code', narrative: 'Fictional demonstration: a message claimed to be from Example Bank and asked me to send a security code. It arrived on a phone using Example Mobile Network. I did not send a code. I do not know who sent the message.', incidentDate: '2026-11-01', associations: [
  { institutionId: 'demo-bank', relationship: 'impersonated', allowInstitutionSharing: false },
  { institutionId: 'demo-mobile', relationship: 'service_involved', allowInstitutionSharing: false },
] });
const nameOf = (id: string) => institutions.find(i => i.id === id)?.name ?? 'Choose an organisation';
const preference = (r: ReportInput): SharingChoice => r.associations.some(a => a.allowInstitutionSharing) ? (r.allowCommunitySharing ? 'both' : 'organisations') : (r.allowCommunitySharing ? 'community' : 'private');
function editable(report: Report): ReportInput {
  const { id: _id, ownerId: _owner, version: _version, status: _status, createdAt: _created, updatedAt: _updated, communityApprovedAt: _approvedAt, communityApprovalVersion: _approvedVersion, ...input } = report;
  return input;
}
export default function Workspace() {
  const [surface, setSurface] = useState<'reports' | 'community' | 'moderation' | 'inbox'>('reports');
  const [actor, setActor] = useState<Actor | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [account, setAccount] = useState('contributor-a');
  const [key, setKey] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [draft, setDraft] = useState<ReportInput>(blank);
  const [withdrawn, setWithdrawn] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);
  const [view, setView] = useState<'edit' | 'saved'>('edit');
  const [step, setStep] = useState(0);
  const [sharing, setSharing] = useState<SharingChoice>('private');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);
  const [confirmedFictional, setConfirmedFictional] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const errorBox = useRef<HTMLParagraphElement>(null);
  useEffect(() => { api('session').then(({ actor }) => { setActor(actor); if (actor?.role === 'institution') setSurface('inbox'); if (actor?.role === 'moderator') setSurface('moderation'); }).catch(() => {}).finally(() => setInitializing(false)); }, []);
  useEffect(() => { let active = true; if (actor) api('reports').then(({ reports }) => { if (active) setReports(reports); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [actor]);
  useEffect(() => { if (actor) heading.current?.focus(); }, [view, step, actor, selected?.id]);
  useEffect(() => { const h = document.querySelector<HTMLElement>('main h1'); if (actor && h) { h.tabIndex = -1; h.focus(); } }, [surface, actor]);
  useEffect(() => { if (error) errorBox.current?.focus(); }, [error]);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  function reset() { setSurface('reports'); setReports([]); setSelected(null); setDraft(blank()); setStep(0); setView('edit'); setDirty(false); setSharing('private'); setConfirmedFictional(false); }
  async function run(fn: () => Promise<void>) { setBusy(true); setError(''); setMessage(''); try { await fn(); } catch (e) { if (e instanceof RequestError && e.status === 401) { setActor(null); reset(); } setError(e instanceof Error ? e.message : 'Request failed. Retry.'); } finally { setBusy(false); } }
  async function login(event: React.FormEvent) { event.preventDefault(); await run(async () => { const result = await api('session', 'POST', { account, key }); setActor(result.actor); setSurface(result.actor.role === 'moderator' ? 'moderation' : result.actor.role === 'institution' ? 'inbox' : 'reports'); setKey(''); }); }
  const mayLeave = () => !dirty || window.confirm('Leave without saving your changes? Your last saved report will stay unchanged.');
  async function logout() { if (!mayLeave()) return; await run(async () => { await api('session', 'DELETE'); setActor(null); reset(); }); }
  function newReport() { if (!mayLeave()) return; setWithdrawn(false); setSelected(null); setDraft(blank()); setView('edit'); setStep(0); setSharing('private'); setDirty(false); setError(''); setMessage(''); setConfirmedFictional(false); }
  function update<K extends keyof ReportInput>(name: K, value: ReportInput[K]) {
    setDirty(true); setError(''); setMessage('');
    setDraft(d => ({ ...d, [name]: value, ...(['narrative', 'communityText'].includes(name) ? { communityApproval: null } : {}), ...(['narrative', 'institutionText', 'associations'].includes(name) ? { institutionApproval: null } : {}) }));
  }
  function chooseSharing(choice: SharingChoice) {
    setSharing(choice); setDirty(true); setError(''); setMessage('');
    const community = choice === 'community' || choice === 'both';
    const organisations = choice === 'organisations' || choice === 'both';
    setDraft(d => ({ ...d, allowCommunitySharing: community,
      communityText: community && !d.communityText ? prepareCommunityVersion(d.narrative) : d.communityText,
      communityApproval: community ? d.communityApproval : null,
      institutionText: organisations && !d.institutionText ? d.narrative : d.institutionText,
      institutionApproval: organisations ? d.institutionApproval : null,
      associations: d.associations.map(a => ({ ...a, allowInstitutionSharing: organisations && a.allowInstitutionSharing })),
    }));
  }
  async function approveVersion() {
    await run(async () => {
      if (draft.communityText.trim().length < 10) throw new Error('Keep at least 10 characters in the community version, or choose not to share it.');
      const approval = await communityApprovalFor(draft.narrative, draft.communityText);
      setDraft(d => d.narrative === draft.narrative && d.communityText === draft.communityText ? { ...d, communityApproval: approval } : d);
      setDirty(true); setMessage('You approved this text for review. Saving alone does not publish it.');
    });
  }
  async function approveInstitution() {
    await run(async () => {
      if (!draft.associations.some(a => a.allowInstitutionSharing)) throw new Error('Choose at least one recipient first.');
      if ((draft.institutionText ?? '').trim().length < 10) throw new Error('Review at least 10 characters for the selected organisations.');
      const approval = await institutionApprovalFor(draft.narrative, draft.institutionText!, draft.associations);
      setDraft(d => d === draft ? { ...d, institutionApproval: approval } : d);
      setDirty(true);
    });
  }
  function next(event: React.FormEvent) {
    event.preventDefault(); setError(''); setMessage('');
    try {
      if (step < 2) validateReport({ ...draft, associations: step === 0 ? [] : draft.associations, allowCommunitySharing: false, communityApproval: null, institutionApproval: null });
      else {
        if ((sharing === 'organisations' || sharing === 'both') && !draft.associations.some(a => a.allowInstitutionSharing)) throw new Error('Select at least one organisation to receive reviewed information, or choose a different sharing option.');
        validateReport(draft);
        if (draft.associations.some(a => a.allowInstitutionSharing) && !draft.institutionApproval) throw new Error('Please approve the exact organisation text and recipients before continuing.');
      }
      setStep(step + 1);
    } catch (e) { setError((e as Error).message); }
  }
  function backTo(index: number) { setStep(index); setError(''); setMessage(''); }
  async function save(event: React.FormEvent) { event.preventDefault(); await run(async () => {
    if (!confirmedFictional) throw new Error('Confirm that this report contains only fictional demonstration data.');
    const result = selected ? await api('reports/' + selected.id, 'PUT', { version: selected.version, report: draft }) : await api('reports', 'POST', draft);
    setSelected(result.report); setView('saved'); setDirty(false); setMessage('Saved privately. You can return to it or change your choices at any time.');
    setReports((await api('reports')).reports);
  }); }
  async function open(id: string) { if (!id || !mayLeave()) return; await run(async () => { const { report } = await api('reports/' + id); setSelected(report); setView('saved'); setDirty(false); }); }
  function edit(index = 0) { if (!selected) return; setDraft(editable(selected)); setSharing(preference(selected)); setConfirmedFictional(true); setView('edit'); setStep(index); setMessage(''); setError(''); setDirty(false); }
  const isContributor = actor?.role === 'contributor';
  const title = view === 'saved' ? (isContributor ? 'Your report is saved' : 'Saved private report') : !isContributor ? 'Private report access' : ['Tell us what happened', 'Who was mentioned?', 'Who should know about this?', 'Review your report'][step];
  return <>
    <a href="#main" className="skip">Skip to workspace</a>
    <div className="demo-banner"><strong>Fictional demonstration.</strong> Please use made-up experiences only. No real names, banking details or security codes.</div>
    <header><div className="brand">Digital safety<span>Experiences that can help others</span></div>
      {actor && <div className="identity"><span>{actor.name}</span><button className="quiet on-dark" disabled={busy} onClick={logout}>Sign out</button></div>}
    </header>
    <main id="main">
      {initializing ? <p role="status">Opening your workspace…</p> : !actor ? <div className="login-layout">
        <section><h1>Your experience matters.<br />Your choices come first.</h1><p className="lede">Tell your story once. Choose who might learn from it or help, while keeping your original private.</p>
          <p>This local demonstration saves fictional reports. Sharing happens only after your approval and moderator review, within simulated local community and organisation views.</p><p className="hint">This is not an emergency or real incident-reporting service.</p></section>
        <form onSubmit={login} className="login-panel"><h2>Open your demo workspace</h2><p>Use your locally generated demo key. <span className="hint">Keys are in <code>.demo/account-keys.local.txt</code>.</span></p>
          <label htmlFor="account">Demo account</label><select id="account" value={account} onChange={e => setAccount(e.target.value)}>
            <option value="contributor-a">Contributor A</option><option value="contributor-b">Contributor B</option><option value="moderator">Moderator</option><option value="institution-bank">Example Bank representative</option><option value="institution-mobile">Example Mobile representative</option>
          </select>
          <label htmlFor="key">Local demo key</label><input id="key" type="password" autoComplete="current-password" required maxLength={200} value={key} onChange={e => setKey(e.target.value)} />
          <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in to demo'}</button>
          {error && <p className="error" role="alert" ref={errorBox} tabIndex={-1}>{error}</p>}
        </form></div> : <>
        <nav className="surface-nav" aria-label="Workspace views">{([['reports', actor.role === 'moderator' ? 'Private reports' : 'My reports'], ['community', 'Community'], ...(actor.role === 'moderator' ? [['moderation', 'Review queue']] : []), ...(actor.role === 'institution' ? [['inbox', 'Simulated inbox']] : [])] as const).filter(([key]) => actor.role !== 'institution' || key !== 'reports').map(([key, label]) => <button key={key} aria-current={surface === key ? 'page' : undefined} onClick={() => { if (mayLeave()) { setSurface(key as typeof surface); if (dirty) { setDraft(selected ? editable(selected) : blank()); setSharing(selected ? preference(selected) : 'private'); setStep(0); } setDirty(false); } }}>{label}</button>)}</nav>
        {surface === 'community' ? <Community /> : surface === 'moderation' ? <Moderation /> : surface === 'inbox' ? <Inbox /> : <>
        <div className="workspace-toolbar"><div className="report-picker"><label htmlFor="saved-report">{actor.role === 'moderator' ? 'Reports you can read' : 'Your saved reports'}</label>
          <select id="saved-report" value={selected?.id ?? ''} disabled={busy || !reports.length} onChange={e => open(e.target.value)}><option value="">{reports.length ? 'Choose a saved report' : 'No saved reports yet'}</option>{reports.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}</select></div>
          {isContributor && <button className="secondary" disabled={busy} onClick={newReport}>Start a new report</button>}
          <p className="privacy-note">Private by default.<br /><strong>Sharing needs your approval and review.</strong></p>
        </div>
        <section className="workspace" aria-busy={busy}>
          {isContributor && view === 'edit' && <nav aria-label="Reporting progress"><ol className="steps">{steps.map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined} className={step === index ? 'current' : index < step ? 'complete' : ''}><button type="button" disabled={index >= step || busy} onClick={() => backTo(index)}><span aria-hidden="true">{index + 1}</span>{label}</button></li>)}</ol></nav>}
          <div className="page-heading"><h1 ref={heading} tabIndex={-1}>{title}</h1>
            {view === 'saved' && selected && <p className="meta">Saved {new Date(selected.updatedAt).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })} · Version {selected.version} · Fictional demonstration</p>}
          </div>
          {error && <p className="error" role="alert" ref={errorBox} tabIndex={-1}>{error}</p>}{message && <p className="success" role="status">{message}</p>}
          {view === 'saved' && selected ? <><ReportSummary report={selected} saved /><Journey key={selected.id + ':' + selected.version} report={selected} actor={actor} onWithdrawal={setWithdrawn} onChanged={async () => { setSelected((await api('reports/' + selected.id)).report); setReports((await api('reports')).reports); }} />{isContributor && !withdrawn && <div className="actions"><button disabled={busy} onClick={() => edit(0)}>Edit your experience</button><button disabled={busy} className="secondary" onClick={() => edit(2)}>Change sharing choices</button></div>}</> : !isContributor ? <p>{actor.role === 'moderator' ? 'Choose a saved report to read. Only its contributor can edit their words or sharing choices. Use Review queue for submitted versions.' : 'No information has been sent to this organisation. Mentioning an organisation or choosing it for future sharing does not give it access to private reports.'}</p> : step === 3 ? <form onSubmit={save}>
            <ReportSummary report={draft} /><div className="save-area"><label className="check"><input type="checkbox" required checked={confirmedFictional} onChange={e => setConfirmedFictional(e.target.checked)} />I confirm this report uses only fictional demonstration data.</label>
              <div className="actions"><button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save private report'}</button><button type="button" className="secondary" disabled={busy} onClick={() => backTo(2)}>Back to sharing choices</button></div></div>
          </form> : <form onSubmit={next}>
            <fieldset className="step-fields" disabled={busy}><legend className="sr-only">{steps[step]}</legend>
            {step === 0 && <div className="form-layout"><section className="form-main">
              <p className="lede">Start wherever it makes sense to you. You don’t need to know what kind of scam it might have been.</p>
              <label htmlFor="narrative">Your experience</label><p id="narrative-help" className="hint">Describe what happened in your own words. Mix languages if you like. Use fictional details only.</p>
              <textarea id="narrative" dir="auto" rows={7} required minLength={20} maxLength={6000} aria-describedby="narrative-help" value={draft.narrative} onChange={e => update('narrative', e.target.value)} />
              <div className="text-meta"><button type="button" className="text-button" onClick={() => { if (!mayLeave()) return; setDraft(example()); setSharing('private'); setDirty(true); setConfirmedFictional(false); }}>Try a fictional example</button><span>{draft.narrative.length.toLocaleString()} / 6,000 characters</span></div>
              <label htmlFor="title">Give your report a short title</label><input id="title" required minLength={5} maxLength={120} value={draft.title} onChange={e => update('title', e.target.value)} />
              <div className="two-columns"><div><label htmlFor="date">When did it happen?</label><input id="date" type="date" min="2000-01-01" max={new Date().toISOString().slice(0, 10)} required value={draft.incidentDate} onChange={e => update('incidentDate', e.target.value)} /></div>
                <div><label htmlFor="channel">How did it reach you?</label><select id="channel" value={draft.channel} onChange={e => update('channel', e.target.value)}>{channels.map(c => <option key={c}>{c}</option>)}</select></div></div>
              <label htmlFor="requested-action">What were you asked to do?</label><select id="requested-action" value={draft.requestedAction ?? 'unsure'} onChange={e => update('requestedAction', e.target.value as ReportInput['requestedAction'])}>{requestedActions.map(a => <option key={a} value={a}>{actionLabels[a]}</option>)}</select>
              <label htmlFor="outcome">Did you do what the message or person asked?</label><select id="outcome" value={draft.outcome} onChange={e => update('outcome', e.target.value as ReportInput['outcome'])}><option value="attempted">No, I did not</option><option value="completed">Yes, some or all of it</option><option value="unsure">I’m not sure</option></select>
              <details className="language-picker"><summary>Languages in your experience <span>{draft.languages.length ? draft.languages.join(', ') : 'Choose one or more'}</span></summary>
                <fieldset><legend>Choose all the languages you used</legend><div className="checks">{[...writtenLanguages, 'Mixed / other'].map(lang => <label className="check" key={lang}><input type="checkbox" checked={draft.languages.includes(lang)} onChange={e => update('languages', e.target.checked ? [...draft.languages, lang] : draft.languages.filter(l => l !== lang))} />{lang}</label>)}</div></fieldset>
              </details>
            </section><aside className="guidance"><h2>Your original stays private</h2><p>Only you and the demo moderator can read it after you save. You’ll choose separately what could reach others.</p>
              <h3>Write in your own language</h3><p>All 11 written official South African languages and mixed-language text are welcome. The interface is currently English; text is not automatically interpreted or translated.</p>
              <p className="hint">South African Sign Language is part of the intended platform. SASL video submission is not available yet.</p></aside></div>}
            {step === 1 && <div className="form-layout"><section className="form-main"><p className="lede">Add organisations that were mentioned, whose services were used, or that might be able to help. This is optional.</p>
              {!draft.associations.length && <p className="empty-note">It’s okay if you don’t know. You can continue without adding an organisation.</p>}
              {draft.associations.map((a, index) => <fieldset className="connection-editor" key={index}><legend>Organisation connection {index + 1}</legend>
                <label htmlFor={'org-' + index}>Organisation</label><select id={'org-' + index} required value={a.institutionId} onChange={e => update('associations', draft.associations.map((x, n) => n === index ? { ...x, institutionId: e.target.value, allowInstitutionSharing: false } : x))}><option value="">Choose an organisation</option>{institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
                <label htmlFor={'rel-' + index}>How is this organisation connected to what happened?</label><select id={'rel-' + index} value={a.relationship} onChange={e => update('associations', draft.associations.map((x, n) => n === index ? { ...x, relationship: e.target.value as typeof a.relationship, allowInstitutionSharing: false } : x))}>{relationships.map(r => <option value={r} key={r}>{relationshipLabels[r]}</option>)}</select>
                <button type="button" className="text-button" onClick={() => update('associations', draft.associations.filter((_, n) => n !== index))}>Remove connection {index + 1}</button>
              </fieldset>)}
              <button type="button" className="secondary" disabled={draft.associations.length >= 12} onClick={() => update('associations', [...draft.associations, { institutionId: '', relationship: 'unclear', allowInstitutionSharing: false }])}>Add an organisation</button>
            </section><aside className="guidance"><h2>Connected doesn’t mean responsible</h2><p>Someone may pretend to represent a bank. That bank could still help, even if it did nothing wrong.</p><p>Mentioning an organisation does not establish a breach, blame or wrongdoing.</p><p className="hint">You can add several organisations, or more than one connection to the same one. Choosing “I’m not sure” is fine. All organisations in this demo are fictional.</p></aside></div>}
            {step === 2 && <div className="sharing-layout"><section className="sharing-controls"><p className="lede">Choose the exact information each audience may receive after you submit it and a moderator approves.</p>
              <fieldset className="sharing-options"><legend>Who would you like to share your experience with?</legend>{([
                ['private', 'Keep it private for now', 'Only you and the demo moderator.'],
                ['organisations', 'Relevant organisations', 'Choose which ones may receive reviewed information.'],
                ['community', 'The community', 'Review and approve a version that could help other people.'],
                ['both', 'Organisations and community', 'Make a separate choice for each audience.'],
              ] as const).map(([value, label, help]) => <label className={'sharing-option ' + (sharing === value ? 'chosen' : '')} key={value}><input type="radio" name="sharing" value={value} checked={sharing === value} onChange={() => chooseSharing(value)} /><span><strong>{label}</strong><small>{help}</small></span></label>)}</fieldset>
              {(sharing === 'organisations' || sharing === 'both') && <fieldset className="recipient-choices"><legend>Which organisations may receive information?</legend>
                <p className="hint">Only relevant, reviewed details about the connections you select. This does not include private contact details or automatic access to your full original.</p>
                {draft.associations.length ? draft.associations.map((a, index) => <label className="check recipient" key={a.institutionId + ':' + a.relationship}><input type="checkbox" checked={a.allowInstitutionSharing} onChange={e => update('associations', draft.associations.map((x, n) => n === index ? { ...x, allowInstitutionSharing: e.target.checked } : x))} /><span><strong>{nameOf(a.institutionId)}</strong><small>{relationshipLabels[a.relationship]}</small></span></label>) : <p>No organisations added. <button type="button" className="text-button" onClick={() => backTo(1)}>Add an organisation first</button>, or choose to keep it private from organisations.</p>}
                <label htmlFor="institution-text">Text for selected organisations</label><p className="hint">A private copy to edit. All selected organisations receive this same text, plus only their own approved relationships. Remove anything they should not receive.</p>
                <textarea id="institution-text" dir="auto" rows={6} minLength={10} maxLength={6000} required value={draft.institutionText ?? ''} onChange={e => update('institutionText', e.target.value)} />
                <button type="button" disabled={busy || !!draft.institutionApproval} onClick={approveInstitution}>{draft.institutionApproval ? 'Organisation version approved' : 'Approve organisation text and recipients'}</button>
                <p className="hint">Changing your original, this text or the recipients requires approval again.</p>
              </fieldset>}
              <p className="notice">Only the approved versions can appear in the local community and simulated inboxes. No real organisations are connected.</p>
            </section>
            {draft.allowCommunitySharing ? <section className="community-editor"><h2>Prepare your community version</h2><p>A new draft starts as a copy of your experience; any earlier edits are kept. Remove names, contact details and anything you don’t want others to see.</p><p id="community-help" className="hint">This is not automatic redaction. A copy may still identify someone. Your private original stays separate.</p>
              <label htmlFor="community">Proposed community version</label><textarea id="community" dir="auto" rows={10} minLength={10} maxLength={6000} required aria-describedby="community-help" value={draft.communityText} onChange={e => update('communityText', e.target.value)} />
              <button type="button" className="text-button" onClick={() => { if (window.confirm('Replace this proposed version with a fresh copy of your current experience? Any edits to the proposed version will be replaced.')) update('communityText', prepareCommunityVersion(draft.narrative)); }}>Copy from my current experience again</button>
              <div className="approval"><p>{draft.communityApproval ? 'You approved this exact text. Saving changes stops current sharing; submit the saved version for a new moderator review.' : 'Review needed. Read the whole version before approving. Changes to your original or this text require approval again.'}</p>
                <button type="button" className={draft.communityApproval ? 'secondary' : ''} disabled={busy || !!draft.communityApproval} onClick={approveVersion}>{draft.communityApproval ? 'This version is approved' : 'Approve this exact version'}</button></div>
            </section> : <aside className="guidance"><h2>You remain in control</h2><p>Choosing an audience does not share your report now. You can change these choices after saving.</p><p>If you choose the community, you’ll review a copy of the experience you already wrote. There’s no need to tell your story again.</p></aside>}
            </div>}
            <div className="step-actions"><span className="hint">Changes stay unsaved until the final step.</span><div className="actions">{step > 0 && <button type="button" className="secondary" onClick={() => backTo(step - 1)}>Back</button>}<button type="submit">{step === 0 ? 'Continue to organisations' : step === 1 ? 'Continue to sharing choices' : 'Review your report'}</button></div></div>
            </fieldset>
          </form>}
        </section></>}
      </>}
    </main><footer>Independent participant prototype · Andela × OpenAI Codex Accelerator, Cape Town Cohort 2026.<br />No endorsement or institutional participation is implied. This is a fictional demonstration, not a real reporting service.</footer>
  </>;
}
