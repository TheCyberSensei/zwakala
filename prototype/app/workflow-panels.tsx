'use client';
import { useEffect, useState } from 'react';
import type { Actor, Report, Association } from '../lib/domain';
import { institutions, relationshipLabels } from '../lib/domain';
import { api } from '../lib/client';

type Decision = { decision: string; reason: string; actorName: string; at: string; version: number };
type Update = { id: string; kind: string; message: string; actorName: string; at: string; feedback: { decision: string; reason: string; actorName: string; at: string }[] };
type Notification = { id: string; version: number; institutionId: string; status: string; staleReason: string | null; deliveredAt: string; updates: Update[]; text: string; relationships: Association['relationship'][]; caveat: string };
type JourneyData = { version: number; submitted: object | null; withdrawal: object | null; communityVisible: boolean; moderation: Decision[]; notifications: Notification[]; institutionReady: boolean; communityReady: boolean };
type Suggestion = { leftId: string; leftVersion: number; leftTitle: string; rightId: string; rightVersion: number; rightTitle: string; kind: string; reasons: string[]; caveat: string; sameContributor: boolean; decision: { id: string; decision: string; reason: string; actorName: string } | null };
const org = (id: string) => institutions.find(i => i.id === id)?.name ?? id;
const label = (value: string) => ({ approve: 'Approved for sharing', withhold: 'Withheld', clarification: 'Clarification requested', acknowledged: 'Acknowledged', investigating: 'Investigation reported', action_reported: 'Action reported', resolution_reported: 'Resolution reported — not independently verified', confirmed: 'Contributor confirms outcome', disputed: 'Contributor disputes outcome', pending: 'Queued for simulated delivery', delivered: 'Delivered to simulated inbox', cancelled: 'Delivery cancelled' }[value] ?? value.replaceAll('_', ' '));
const date = (value: string) => new Date(value).toLocaleString('en-ZA');
function useAction() {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  async function run(task: () => Promise<void>) { setBusy(true); setError(''); setMessage(''); try { await task(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  return { busy, run, message, setMessage, feedback: <>{error && <p role="alert" className="error">{error}</p>}{message && <p role="status" className="success">{message}</p>}</> };
}
function Reason({ id, value, onChange, title = 'Reason or update', disabled = false }: { disabled?: boolean; id: string; value: string; onChange: (v: string) => void; title?: string }) {
  return <><label htmlFor={id}>{title}</label><textarea disabled={disabled} id={id} rows={2} minLength={5} maxLength={2000} value={value} onChange={e => onChange(e.target.value)} /><p className="hint">5–2,000 characters. Fictional information only. Your action is recorded with your demo account and time.</p></>;
}
function Updates({ updates, contributor = false, refresh }: { updates: Update[]; contributor?: boolean; refresh?: () => Promise<void> }) {
  return <ol className="timeline">{updates.map(u => <li key={u.id}><h4>{label(u.kind)}</h4><p className="meta">{u.actorName} · {date(u.at)}</p><p className="preserve">{u.message}</p>
    {u.feedback.map((f, i) => <div className="outcome-feedback" key={i}><strong>{label(f.decision)}</strong><p className="meta">{f.actorName} · {date(f.at)}</p><p className="preserve">{f.reason}</p></div>)}
    {contributor && ['action_reported', 'resolution_reported'].includes(u.kind) && <Feedback updateId={u.id} refresh={refresh!} />}
  </li>)}</ol>;
}
function Feedback({ updateId, refresh }: { updateId: string; refresh: () => Promise<void> }) {
  const [reason, setReason] = useState(''); const a = useAction();
  return <details><summary>Confirm or dispute this outcome</summary><Reason disabled={a.busy} id={'feedback-' + updateId} value={reason} onChange={setReason} title="Your experience of this outcome" /><div className="actions">{['confirmed', 'disputed'].map(decision => <button key={decision} disabled={a.busy} className="secondary" onClick={() => a.run(async () => { await api('updates/' + updateId + '/feedback', 'POST', { decision, reason }); setReason(''); await refresh(); a.setMessage('Your response is recorded against this specific update.'); })}>{decision === 'confirmed' ? 'Confirm outcome' : 'Dispute outcome'}</button>)}</div>{a.feedback}</details>;
}
export function Journey({ report, actor, onChanged, onWithdrawal }: { report: Report; actor: Actor; onChanged: () => Promise<void>; onWithdrawal: (v: boolean) => void }) {
  const [data, setData] = useState<JourneyData | null>(null), [reason, setReason] = useState(''); const a = useAction();
  const refresh = async () => { const current = await api('reports/' + report.id + '/journey'); setData(current); onWithdrawal(!!current.withdrawal); if (current.version !== report.version) await onChanged(); };
  useEffect(() => { let active = true; api('reports/' + report.id + '/journey').then(d => { if (active) { setData(d); onWithdrawal(!!d.withdrawal); } }).catch(() => { if (active) setData(null); }); return () => { active = false; }; }, [report.id, report.version]);
  return <section className="journey"><h2>What happened next?</h2><button className="secondary" disabled={a.busy} onClick={() => a.run(refresh)}>Refresh progress</button>{a.feedback}{!data ? <p>Progress unavailable. Use Refresh progress to retry.</p> : <>
    <p className="notice">{data.withdrawal ? 'Withdrawn. Further sharing has stopped; previously delivered copies and history remain.' : data.submitted ? 'This version was submitted for review.' : 'This version is saved privately and has not been submitted for review.'} {data.communityVisible ? 'Your exact approved community version is visible in this local demo.' : 'This report is not currently visible to the community.'}</p>
    {actor.role === 'contributor' && !data.withdrawal && <><div className="actions"><button disabled={a.busy || !!data.submitted || !(data.communityReady || data.institutionReady)} onClick={() => a.run(async () => { await api('reports/' + report.id + '/submit', 'POST', { version: report.version }); await refresh(); })}>{data.submitted ? 'Submitted for review' : 'Submit approved version for review'}</button></div><p className="hint">Saving does not submit. Corrections stop further sharing and require a new submission and moderator review. If submission is unavailable, edit your sharing choices and approve the exact text for at least one audience.</p></>}
    <h3>Moderator decisions</h3>{!data.moderation.length ? <p>No review decision yet.</p> : <ol className="timeline">{data.moderation.map((m, i) => <li key={i}><strong>{label(m.decision)} · version {m.version}</strong><p className="meta">{m.actorName} · {date(m.at)}</p><p className="preserve">{m.reason}</p></li>)}</ol>}
    <h3>Organisation progress</h3><p className="hint">Delivery is not acknowledgement, investigation or resolution. All representatives and actions here are simulated.</p>
    {!data.notifications.length ? <p>No notification has been queued.</p> : data.notifications.map(n => <article className="notification" key={n.id}><h4>{org(n.institutionId)} · version {n.version}</h4><p><strong>{label(n.status)}</strong>{n.deliveredAt && ' · ' + date(n.deliveredAt)}</p>{n.staleReason && <p className="notice">{n.staleReason}</p>}<Updates updates={n.updates} contributor={actor.role === 'contributor'} refresh={refresh} /></article>)}
    {actor.role === 'contributor' && !data.withdrawal && <details className="withdrawal"><summary>Withdraw this report from further sharing</summary><p>Community visibility and pending deliveries stop. Already delivered information is not recalled. The private report and history remain read-only.</p><Reason disabled={a.busy} id="withdraw-reason" value={reason} onChange={setReason} title="Why are you withdrawing?" /><button className="secondary" disabled={a.busy} onClick={() => a.run(async () => { await api('reports/' + report.id + '/withdraw', 'POST', { version: report.version, reason }); await refresh(); await onChanged(); })}>Withdraw report</button></details>}
  </>}</section>;
}
export function Community() {
  const [data, setData] = useState<{ experiences: { id: string; text: string; label: string }[]; notices: { id: string; text: string; experienceIds: string[] }[] } | null>(null); const a = useAction();
  const refresh = async () => setData(await api('community'));
  useEffect(() => { void a.run(refresh); }, []); // Only reads the authenticated, filtered local community endpoint.
  return <section className="workspace"><h1>Experiences we can learn from</h1><p className="lede">People’s own words, shared by choice. A moderator review is not verification of an allegation.</p><p className="notice">Fictional local community demonstration. No real incidents or public reporting.</p><button className="secondary" disabled={a.busy} onClick={() => a.run(refresh)}>Refresh community</button>{a.feedback}
    <h2>Qualified pattern notices</h2>{data?.notices.length ? data.notices.map(n => <article className="pattern-notice" key={n.id}><p>{n.text}</p><ul>{n.experienceIds.map((id, i) => <li key={id}><a href={'#experience-' + id}>Read linked experience {i + 1}</a></li>)}</ul></article>) : <p>No reviewed pattern notices yet.</p>}
    <h2>Shared experiences</h2>{data?.experiences.length ? data.experiences.map(e => <article className="community-story" id={'experience-' + e.id} key={e.id}><p className="tag">{e.label}</p><p dir="auto" className="preserve">{e.text}</p></article>) : <p>No experiences are currently approved for community display.</p>}
  </section>;
}
export function Moderation() {
  const [data, setData] = useState<{ queue: { report: Report; review: Decision | null; communityReady: boolean; institutionReady: boolean }[]; suggestions: Suggestion[] } | null>(null); const a = useAction();
  const refresh = async () => setData(await api('moderation'));
  useEffect(() => { void a.run(refresh); }, []);
  return <section className="workspace"><h1>Review with care</h1><p className="lede">Protect the contributor’s choices. Approve only the exact versions they authorised, and keep uncertainty visible.</p><div className="actions"><button className="secondary" disabled={a.busy} onClick={() => a.run(refresh)}>Refresh review queue</button><button className="secondary" disabled={a.busy} onClick={() => a.run(async () => { const result = await api('deliveries/retry', 'POST', {}); a.setMessage(result.delivered + ' delivered; ' + result.cancelled + ' cancelled. Simulated inboxes only.'); await refresh(); })}>Retry pending deliveries</button></div>{a.feedback}
    <fieldset disabled={a.busy} className="queue-content"><legend className="sr-only">Review actions</legend><h2>Submitted reports</h2>{data?.queue.length ? data.queue.map(row => <Review key={row.report.id + ':' + row.report.version} row={row} refresh={refresh} />) : <p>No current submissions. Contributors must save and explicitly submit an approved version first.</p>}
    <h2>Possible connections</h2><p>Suggestions use reported channel, organisation relationship, requested action and a 14-day window. Identical text/date/channel is flagged separately as a possible duplicate. These rules do not establish a shared scam campaign.</p>
    {data?.suggestions.length ? data.suggestions.map(s => <Connection key={s.leftId + s.rightId + s.leftVersion + s.rightVersion} suggestion={s} refresh={refresh} />) : <p>No pairs meet the current suggestion rules.</p>}</fieldset>
  </section>;
}
function Review({ row, refresh }: { row: { report: Report; review: Decision | null; communityReady: boolean; institutionReady: boolean }; refresh: () => Promise<void> }) {
  const r = row.report; const [reason, setReason] = useState(''); const a = useAction();
  return <article className="review-item"><h3>{r.title}</h3><p className="meta">Version {r.version} · {r.channel} · {r.incidentDate}</p><p>{row.review ? label(row.review.decision) + ' — ' + row.review.reason + ' (' + row.review.actorName + ')' : 'Awaiting review'}</p>
    <details><summary>Read private original and connections</summary><p className="preserve">{r.narrative}</p><ul>{r.associations.map((x, i) => <li key={i}>{org(x.institutionId)} — {relationshipLabels[x.relationship]} · {x.allowInstitutionSharing ? 'Authorised recipient' : 'No sharing permission'}</li>)}</ul></details>
    {row.communityReady && <section><h4>Contributor-approved community text</h4><p className="preserve">{r.communityText}</p></section>}
    {row.institutionReady && <section><h4>Contributor-approved organisation text</h4><p className="preserve">{r.institutionText}</p></section>}
    <p className="hint">Approval displays only the approved community text and immediately queues the approved organisation text for simulated delivery. Relevance does not imply responsibility. Withholding or requesting clarification stops further sharing.</p>
    <Reason disabled={a.busy} id={'review-' + r.id} value={reason} onChange={setReason} title="Review reason" /><div className="actions">{(['approve', 'withhold', 'clarification'] as const).map(decision => <button key={decision} className={decision === 'approve' ? '' : 'secondary'} disabled={a.busy} onClick={() => a.run(async () => { const result = await api('reports/' + r.id + '/moderate', 'POST', { version: r.version, decision, reason }); await refresh(); a.setMessage(result.deliveryPending ? 'Review saved. Delivery is pending; use Retry pending deliveries.' : 'Decision recorded.'); })}>{decision === 'approve' ? 'Approve sharing' : decision === 'withhold' ? 'Withhold sharing' : 'Request clarification'}</button>)}</div>{a.feedback}
  </article>;
}
function Connection({ suggestion: s, refresh }: { suggestion: Suggestion; refresh: () => Promise<void> }) {
  const [reason, setReason] = useState(''); const a = useAction();
  return <article className="review-item"><h3>{s.leftTitle} / {s.rightTitle}</h3><strong>{s.kind === 'possible_duplicate' ? 'Possible duplicate — not independent evidence' : 'Potentially related experiences'}</strong><ul>{s.reasons.map(r => <li key={r}>{r}</li>)}</ul><p>{s.caveat} {s.sameContributor && 'Both reports come from the same demo contributor; a community pattern notice is unavailable.'}</p>
    {s.decision && <p>Latest decision: <strong>{label(s.decision.decision)}</strong> — {s.decision.reason} ({s.decision.actorName})</p>}
    <Reason disabled={a.busy} id={'link-' + s.leftId + s.rightId} value={reason} onChange={setReason} title="Association or notice reason" /><div className="actions">{['related', 'duplicate', 'rejected'].map(decision => <button className="secondary" key={decision} disabled={a.busy} onClick={() => a.run(async () => { await api('links', 'POST', { leftId: s.leftId, leftVersion: s.leftVersion, rightId: s.rightId, rightVersion: s.rightVersion, decision, reason }); await refresh(); })}>{decision === 'related' ? 'Confirm possible relationship' : decision === 'duplicate' ? 'Mark as duplicate' : 'Reject association'}</button>)}</div>
    {s.decision?.decision === 'related' && !s.sameContributor && <button disabled={a.busy} onClick={() => a.run(async () => { await api('notices', 'POST', { linkId: s.decision!.id, reason }); a.setMessage('Qualified notice is visible only while both exact community versions remain approved.'); })}>Display qualified community notice</button>}{a.feedback}
  </article>;
}
export function Inbox() {
  const [items, setItems] = useState<Notification[]>([]); const a = useAction();
  const refresh = async () => setItems((await api('inbox')).notifications);
  useEffect(() => { void a.run(refresh); }, []);
  return <section className="workspace"><h1>Your simulated inbox</h1><p className="lede">Information shared with your organisation by choice. Being relevant does not mean being responsible.</p><p className="notice">Fictional representatives and updates only. No real organisation is notified.</p><button className="secondary" disabled={a.busy} onClick={() => a.run(refresh)}>Refresh inbox</button>{a.feedback}
    {!items.length ? <p>No information has been delivered to this organisation.</p> : items.map(n => <InboxItem key={n.id} item={n} refresh={refresh} />)}
  </section>;
}
function InboxItem({ item: n, refresh }: { item: Notification; refresh: () => Promise<void> }) {
  const [message, setMessage] = useState(''), [kind, setKind] = useState('investigating'); const a = useAction();
  return <article className="notification"><h2>Shared with {org(n.institutionId)}</h2><p className="meta">Simulated delivery · {date(n.deliveredAt)} · version {n.version}</p><p className="preserve">{n.text}</p><ul>{n.relationships.map(r => <li key={r}>{relationshipLabels[r]}</li>)}</ul><p className="hint">{n.caveat}</p>{n.staleReason && <p className="notice">{n.staleReason} This historical copy is read-only.</p>}<Updates updates={n.updates} />
    {!n.staleReason && <><Reason disabled={a.busy} id={'response-' + n.id} value={message} onChange={setMessage} title="Update for the contributor" />{!!n.updates.length && <><label htmlFor={'kind-' + n.id}>Update stage</label><select disabled={a.busy} id={'kind-' + n.id} value={kind} onChange={e => setKind(e.target.value)}><option value="investigating">Investigation reported</option><option value="action_reported">Action reported</option><option value="resolution_reported">Resolution reported</option></select></>}<button disabled={a.busy} onClick={() => a.run(async () => { await api('inbox/' + n.id + '/updates', 'POST', { kind: n.updates.length ? kind : 'acknowledged', message }); setMessage(''); await refresh(); })}>{n.updates.length ? 'Record update' : 'Acknowledge receipt'}</button><p className="hint">An institutional claim of resolution is not contributor confirmation. The contributor can confirm or dispute reported outcomes.</p></>}{a.feedback}
  </article>;
}
