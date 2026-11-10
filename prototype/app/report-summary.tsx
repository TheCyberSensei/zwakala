import type { ReportInput } from '../lib/domain';
import { institutions, relationshipLabels } from '../lib/domain';

const nameOf = (id: string) => institutions.find(i => i.id === id)?.name ?? id;
export default function ReportSummary({ report, saved = false }: { report: ReportInput; saved?: boolean }) {
  const recipients = [...new Set(report.associations.filter(a => a.allowInstitutionSharing).map(a => a.institutionId))];
  return <div className="summary-layout">
    <section className="story-summary"><h2>{report.title}</h2>
      <p className="meta">{report.incidentDate} · {report.channel} · {report.languages.join(', ')}</p>
      <h3>Your experience <span className="tag">Private original</span></h3><p className="preserve" dir="auto">{report.narrative}</p>
      <p className="hint">{report.outcome === 'attempted' ? 'You did not complete the requested action.' : report.outcome === 'completed' ? 'You completed some or all of the requested action.' : 'You are unsure how far it went.'}</p>
      <h3>Organisations mentioned</h3>
      {report.associations.length === 0 ? <p>No organisations added.</p> : <ul className="connections">{report.associations.map(a => <li key={a.institutionId + ':' + a.relationship}>
        <strong>{nameOf(a.institutionId)}</strong><span>{relationshipLabels[a.relationship]}</span>
        <span className="hint">{a.allowInstitutionSharing ? 'Selected to receive the approved organisation version after review.' : 'Not selected to receive information.'}</span>
      </li>)}</ul>}
      <p className="hint">A connection does not establish that an organisation caused a scam, suffered a breach or acted improperly.</p>
    </section>
    <section className="sharing-summary"><h2>Your sharing choices</h2>
      <dl><dt>Who can see the original?</dt><dd>The contributor and demo moderator only.</dd>
        <dt>Selected organisations</dt><dd>{recipients.length ? recipients.map(id => nameOf(id)).join('; ') : 'None — keep this private from organisations.'}</dd>
        <dt>Organisation text</dt><dd>{report.institutionApproval ? 'Exact text and recipients approved by the contributor.' : 'No exact organisation version approved.'}</dd>
        <dt>Community</dt><dd>{!report.allowCommunitySharing ? 'Not selected for sharing.' : report.communityApproval ? 'Exact version approved by the contributor for moderator review.' : 'Review needed. Earlier sharing preference is saved, but no exact version is approved.'}</dd>
        <dt>Sharing progress</dt><dd>{saved ? 'See “What happened next?” below for current visibility and deliveries.' : 'Saving does not submit or share. Submit the saved version separately for review.'}</dd></dl>
      {report.communityText && <details className="community-preview"><summary>{report.allowCommunitySharing && report.communityApproval ? 'View approved community version' : 'View unapproved community draft'}</summary>
        <p className="hint">{report.allowCommunitySharing && report.communityApproval ? 'Only this exact text is eligible for community display after submission and moderator approval.' : 'This text is private and is not eligible for community review until you approve it.'}</p>
        <p className="preserve" dir="auto">{report.communityText}</p></details>}
      {report.institutionText && <details><summary>View organisation version</summary><p className="preserve" dir="auto">{report.institutionText}</p></details>}
      <p className="hint">Selecting an organisation does not give it access to your full original. No real organisations are connected.</p>
    </section>
  </div>;
}
