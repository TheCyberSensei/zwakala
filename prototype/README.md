# Digital-safety reporting prototype

Local fictional demonstration of the participant's original reporting-to-response idea. **Milestones 1–2 are participant-tested and approved.** No real institutions participate, no external notifications are sent, and this is not an emergency or real reporting service. Milestone 3 starts with feasibility only; no AI dependency is active.

## Run locally (PowerShell)

Use Node **22.23.4**. From this directory:

```powershell
npm.cmd ci --ignore-scripts
npm.cmd run setup
Get-Content .demo/account-keys.local.txt
$env:NEXT_TELEMETRY_DISABLED = '1'
npm.cmd run dev
```

Open [the local demo](http://127.0.0.1:3000). Choose a demo account and paste its generated key. Keep the key file private. Setup creates five fictional accounts and no reports; it refuses to overwrite existing accounts/keys. **For an existing installation, skip installation/setup and run only the server.** Existing reports and keys remain usable. No reset is required: the additive workflow migration creates separate tables without rewriting old reports.

For a compiled run: `npm.cmd run build`, then `npm.cmd start`. Both bind to 127.0.0.1. Stop with Ctrl+C. Never expose through a public host, tunnel or proxy. The app makes no external AI/service requests.

## Demonstrate the connected journey

1. **Contributor A:** choose **Try a fictional example** or write a fictional experience. Select context, languages and requested action. Add multiple organisations/relationships if relevant. Relevance never establishes fault.
2. Choose independent audiences. Approve the exact **community version** and, separately, the **organisation text and selected recipient relationships**. Both begin as editable copies; copying is not redaction. Every selected organisation receives the same approved organisation text, but only its own authorised relationship context. Remove information that any selected recipient should not receive. Private originals/titles/context are never automatically included.
3. Review and **Save private report**, then explicitly **Submit approved version for review**. Private-only saving remains available without submission or a second narrative. Older recipient preferences are not exact text approval: review and approve before submission.
4. **Moderator:** open **Review queue**, inspect original, approved versions and connections; give a reason and approve, withhold or request clarification. Approval displays eligible exact community text and immediately delivers approved institutional snapshots to simulated inboxes. All decisions retain actor/time/version. Withholding/clarification stops further sharing.
5. **Contributor B:** submit a distinct fictional experience with similar structured context. As moderator, inspect **Possible connections** and their reasons. Confirm a possible relationship, mark a duplicate or reject. For two currently community-approved versions from different demo contributors, explicitly **Display qualified community notice**. This never declares a shared campaign.
6. **Community:** read the exact approved narratives and qualified notice with links. No original, private title, owner identity or private matching reason is returned by this endpoint. It is an authenticated local view, not public deployment.
7. **Example Bank representative:** read its **Simulated inbox**, including impersonation context. Acknowledge receipt; record investigation, action and then reported resolution. Example Mobile sees only its own notifications. Delivery does not imply acknowledgement, and institutional resolution is an attributed claim, not verified fact.
8. **Contributor:** reopen the report to see decisions and progress in **What happened next?** Confirm or dispute individual action/resolution updates with reasons. Earlier feedback remains in history.
9. Correct a report or change permissions. Existing community display/notices stop, pending notifications cancel and delivered versions become historical/read-only. Submit the new version for another review. **Withdraw report** stops further sharing and makes the saved report read-only. Private records/history remain; delivered copies are not recalled or deleted.

Refresh buttons reload moderation/community/inbox after changes in another account. Use **Refresh progress** on a saved report to see new responses or a newer report version. If a simulated delivery fails, its persistent pending row remains; moderators can **Retry pending deliveries**. A unique report/version/institution key prevents duplicate delivery. Reapproving the same version does not redeliver.

Example Payments is a fictional selectable recipient but has no seeded representative account. Routing is persistent; the interactive response demonstration uses Example Bank and Example Mobile. No new account infrastructure was added.

## Architecture and safeguards

- One Next.js/React/TypeScript app and Node SQLite, with no new dependency, ORM, queue service, hosted database, AI SDK or external transport.
- `lib/domain.ts`: validation, choices, exact-content bindings. `store.ts`: sessions, ownership, report persistence, optimistic versions. `workflow-schema.ts`: additive schema, revision snapshots and invalidation. `workflow.ts`: submissions, moderation, candidate matching, publication filtering, durable deliveries and response history. `http.ts`: role/session/origin enforcement and allowlisted requests. UI remains separate in `app/`.
- SHA-256 approvals bind original, exact audience text and (for institutions) sorted approved recipient relationships. These are authenticated consent records, not proof of comprehension, anonymity or digital signatures. Community approval records server time/version; institutional approval is retained in the saved revision and submission with server time/actor/version. Every correction requires new submission/review, even where unchanged community text approval can be retained.
- Historical revisions are private and stored before modification and after saves. Old reports are snapshotted lazily before modification; missing pre-M2 history cannot be reconstructed. The ledger is not tamper-evident against a filesystem administrator.
- Rule matching: identical normalized original/date/channel suggests a possible duplicate. Otherwise the same organisation and relationship, dates within 14 days, and either the same channel or known requested action suggest a possible relation. Unknown/other actions are not matching evidence. Explanations are moderator-only. Same-contributor pairs cannot create community notices. Different demo accounts are not proof of independent people.
- Notices deliberately use qualified template wording and links to approved text. They do not publish private structured matching fields, count incidents as verified, merge reports or infer institutional fault. Moderator association decisions and notices bind exact versions; corrections and rejection hide stale notices.
- Server sessions determine actors/roles. Contributors access only their own reports; moderators review originals; institutions access only delivered snapshots for their own organisation. Unknown/unauthorised objects use indistinguishable 404s. API replies are private/no-store. Community excludes private originals, titles, owners and internal report IDs.
- Random account keys are scrypt-hashed; opaque session tokens are SHA-256-hashed, expire after eight hours and are revoked on logout. Cookies are HttpOnly/SameSite=Strict; Secure is used on HTTPS. HTTP is permitted only for the loopback demo. The developer possessing demo keys is not an independently verified identity system.
- Parameterised SQL, transactions, exact field validation, 64 KB JSON limit (three bounded text versions), origin checks, escaped React text, and a global 10 sign-in-attempts/minute limit. No production abuse-resistance claim.
- All 11 written official languages plus mixed text are accepted. English UI only; no translation/interpretation claim. SASL media remains unavailable.
- SQLite, keys, screenshots and preservation evidence stay in Git-ignored `.demo/`, outside static assets. They are **not encrypted at rest**. Keep real incidents out. `node:sqlite` remains experimental on the pinned version. CSP retains Next development allowances; public deployment requires separate security, identity, retention and consent work.

## Verification

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

Node tests exercise real SQLite and the actual HTTP handler: foundation permissions, consent, matching, moderation, routing, deduplication, failure/retry, attribution, disputes, correction, withdrawal and persistence. No real data/services are used.

Observed final results (10 November 2026): **49 automated tests, 21 foundation browser checks and 10 Milestone 2 browser checks passed**, with TypeScript and production build passing. See Activity 015 in the development log for actual failures corrected and evidence boundaries.

Browser tests use the existing workspace Playwright runtime and installed Edge, without a project dependency. Use a **new** ignored data directory; never reset existing demo data. In one terminal after building:

```powershell
$env:DEMO_DATA_DIR = Join-Path (Get-Location) '.demo/acceptance-new'
npm.cmd run setup
$env:NEXT_TELEMETRY_DISABLED = '1'
npm.cmd start -- --port 3100
```

In a second terminal with the same directory setting:

```powershell
$env:DEMO_DATA_DIR = Join-Path (Get-Location) '.demo/acceptance-new'
node tests/browser-check.cjs "C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"
node tests/workflow-browser.cjs "C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"
```

The runtime path is workspace-specific. Elsewhere use an already-installed Playwright location; no browser is downloaded. Browser scripts create fictional records and should each run once against the fresh acceptance store. If rerunning, choose another directory instead of clearing data. Stop the acceptance server and remove `DEMO_DATA_DIR` from your shell environment before running the normal demo. Screenshots remain ignored. See the development log for observed results and corrections; these checks are not an accessibility certification or real-user comprehension study.

| Milestone | Acceptance gate | Current state |
| --- | --- | --- |
| 1: Foundation/private reporting | Working private journey, disclosure, permissions, validation and storage | Approved by participant |
| 2: Connected journey | Reviewed community text, explained links, simulated inbox/response, follow-up, correction and isolation | Approved by participant |
| 3: Bounded AI | One evaluated real capability with human confirmation and non-AI fallback | Not started |
| 4: Final verification | Complete demo, failure recovery, security/accessibility checks and honest limits | Later; milestone checks apply now |

Daily/weekly digests, SASL media, external AI and real institutional integration remain deferred. A reviewed local baseline checkpoint is authorised. Deployment, public reporting, external account access and pushing are not authorised.
