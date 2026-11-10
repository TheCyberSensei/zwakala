export const institutions = [
  { id: 'demo-bank', name: 'Example Bank (fictional)' },
  { id: 'demo-mobile', name: 'Example Mobile Network (fictional)' },
  { id: 'demo-payments', name: 'Example Payments (fictional)' },
] as const;
export const relationships = ['impersonated', 'service_involved', 'potential_responder', 'unclear'] as const;
export const relationshipLabels: Record<string, string> = {
  impersonated: 'Someone pretended to represent them', service_involved: 'Their service was used or mentioned',
  potential_responder: 'They might be able to help', unclear: 'I’m not sure how they are connected',
};
export const writtenLanguages = ['Afrikaans', 'English', 'isiNdebele', 'isiXhosa', 'isiZulu', 'Sepedi', 'Sesotho', 'Setswana', 'siSwati', 'Tshivenda', '\u0058itsonga'];
export const channels = ['SMS', 'Phone call', 'Messaging app', 'Email', 'Website', 'Social media', 'Other'] as const;
export type Role = 'contributor' | 'moderator' | 'institution';
export type Actor = { id: string; name: string; role: Role; institutionId: string | null };
export type Association = { institutionId: string; relationship: typeof relationships[number]; allowInstitutionSharing: boolean };
export type CommunityApproval = { sourceDigest: string; textDigest: string };
export type InstitutionApproval = CommunityApproval & { recipientsDigest: string };
export const requestedActions = ['unsure', 'share_code', 'send_money', 'open_link', 'install_app', 'share_details', 'other'] as const;
export const actionLabels: Record<string, string> = { unsure: 'I’m not sure', share_code: 'Share a security code', send_money: 'Send money', open_link: 'Open a link', install_app: 'Install an app', share_details: 'Share personal details', other: 'Something else' };
export type ReportInput = {
  fictional: true; title: string; narrative: string; incidentDate: string; channel: string;
  outcome: 'attempted' | 'completed' | 'unsure'; languages: string[];
  associations: Association[]; allowCommunitySharing: boolean; communityText: string;
  communityApproval: CommunityApproval | null;
  requestedAction?: typeof requestedActions[number];
  institutionText?: string; institutionApproval?: InstitutionApproval | null;
};
export type Report = ReportInput & {
  id: string; ownerId: string; version: number; status: 'private'; createdAt: string; updatedAt: string;
  communityApprovedAt: string | null; communityApprovalVersion: number | null;
};
// Deliberately a faithful copy, not a claim of automatic redaction or anonymity.
export const prepareCommunityVersion = (original: string) => original;
export const recipientBinding = (associations: Association[]) => JSON.stringify(associations.filter(a => a.allowInstitutionSharing)
  .map(a => ({ institutionId: a.institutionId, relationship: a.relationship }))
  .sort((a, b) => (a.institutionId + ':' + a.relationship).localeCompare(b.institutionId + ':' + b.relationship, 'en')));
async function hashText(value: string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))
  .map(byte => byte.toString(16).padStart(2, '0')).join(''); }
export async function communityApprovalFor(narrative: string, communityText: string): Promise<CommunityApproval> {
  return { sourceDigest: await hashText(narrative), textDigest: await hashText(communityText) };
}
export async function institutionApprovalFor(narrative: string, text: string, associations: Association[]): Promise<InstitutionApproval> {
  return { ...await communityApprovalFor(narrative, text), recipientsDigest: await hashText(recipientBinding(associations)) };
}
export class AppError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
const fail = (message: string): never => { throw new AppError(400, message); };
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('Expected a report object.');
  return value as Record<string, unknown>;
}
function text(value: unknown, name: string, min: number, max: number): string {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/u.test(value))
    return fail(`${name} must contain ${min}–${max} characters and no control characters.`);
  return value; // Preserve original Unicode and punctuation, including mixed-language content.
}
function choice(value: unknown, allowed: readonly string[], name: string): string {
  if (typeof value !== 'string' || !allowed.includes(value)) return fail(`Choose a valid ${name}.`);
  return value;
}
function bool(value: unknown, name: string): boolean {
  if (typeof value !== 'boolean') return fail(`Choose ${name} explicitly.`);
  return value;
}
export function validateReport(value: unknown): ReportInput {
  const v = object(value);
  const keys = ['fictional', 'title', 'narrative', 'incidentDate', 'channel', 'outcome', 'languages', 'associations', 'allowCommunitySharing', 'communityText', 'communityApproval', 'requestedAction', 'institutionText', 'institutionApproval'];
  if (Object.keys(v).some(k => !keys.includes(k))) fail('Unexpected report fields.');
  if (v.fictional !== true) fail('Only fictional demonstration incidents may be saved.');
  const date = text(v.incidentDate, 'Incident date', 10, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || date > new Date().toISOString().slice(0, 10) || date < '2000-01-01') fail('Choose a valid past or current incident date (2000 onwards).');
  if (!Array.isArray(v.languages) || !v.languages.length || v.languages.length > 12) fail('Choose at least one written language or Mixed / other.');
  const selected = (v.languages as unknown[]).map(x => choice(x, [...writtenLanguages, 'Mixed / other'], 'language'));
  if (new Set(selected).size !== selected.length) fail('Do not repeat languages.');
  if (!Array.isArray(v.associations) || v.associations.length > 12) fail('You can add up to 12 organisation connections.');
  const associations = (v.associations as unknown[]).map(value => {
    const a = object(value);
    if (Object.keys(a).some(k => !['institutionId', 'relationship', 'allowInstitutionSharing'].includes(k))) fail('Unexpected institution fields.');
    return {
      institutionId: choice(a.institutionId, institutions.map(x => x.id), 'institution'),
      relationship: choice(a.relationship, relationships, 'relationship') as Association['relationship'],
      allowInstitutionSharing: bool(a.allowInstitutionSharing, 'institution disclosure'),
    };
  });
  if (new Set(associations.map(a => `${a.institutionId}:${a.relationship}`)).size !== associations.length) fail('Do not repeat the same organisation connection.');
  const allowCommunitySharing = bool(v.allowCommunitySharing, 'community sharing');
  const communityText = text(v.communityText, 'Community version', allowCommunitySharing ? 10 : 0, 6000);
  let communityApproval: CommunityApproval | null = null;
  if (allowCommunitySharing) {
    if (!v.communityApproval) fail('Review and approve the exact community version before continuing.');
    const approval = object(v.communityApproval);
    if (Object.keys(approval).some(k => !['sourceDigest', 'textDigest'].includes(k)) ||
      typeof approval.sourceDigest !== 'string' || !/^[a-f0-9]{64}$/.test(approval.sourceDigest) ||
      typeof approval.textDigest !== 'string' || !/^[a-f0-9]{64}$/.test(approval.textDigest)) fail('Review and approve the community version again.');
    communityApproval = { sourceDigest: approval.sourceDigest as string, textDigest: approval.textDigest as string };
  } else if (v.communityApproval != null) fail('Community approval must be cleared when community sharing is off.');
  const extra: Partial<ReportInput> = {};
  if (v.requestedAction !== undefined) extra.requestedAction = choice(v.requestedAction, requestedActions, 'requested action') as ReportInput['requestedAction'];
  if (v.institutionText !== undefined || v.institutionApproval !== undefined) {
    extra.institutionText = text(v.institutionText, 'Organisation version', v.institutionApproval ? 10 : 0, 6000);
    extra.institutionApproval = null;
    if (v.institutionApproval != null) {
      const approval = object(v.institutionApproval);
      if (!associations.some(a => a.allowInstitutionSharing) || Object.keys(approval).some(k => !['sourceDigest', 'textDigest', 'recipientsDigest'].includes(k)) ||
        !['sourceDigest', 'textDigest', 'recipientsDigest'].every(k => typeof approval[k] === 'string' && /^[a-f0-9]{64}$/.test(approval[k] as string))) fail('Review the organisation version and selected recipients again.');
      extra.institutionApproval = approval as InstitutionApproval;
    }
  }
  return {
    fictional: true, title: text(v.title, 'Title', 5, 120), narrative: text(v.narrative, 'Your experience', 20, 6000),
    incidentDate: date, channel: choice(v.channel, channels, 'channel'),
    outcome: choice(v.outcome, ['attempted', 'completed', 'unsure'], 'outcome') as ReportInput['outcome'],
    languages: selected, associations, allowCommunitySharing, communityText, communityApproval, ...extra,
  };
}
