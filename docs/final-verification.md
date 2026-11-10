# Final verification and submission readiness

Verified **10 November 2026**, Africa/Johannesburg, in Default Mode. Approved application baseline: `3feabe7bfa5db0154e571b73963c572a3adc9604`. Milestone 4 changes documentation and repository preparation only; application code, dependencies, survey source and existing demo data remain unchanged.

## Actual results

| Check | Observed result |
| --- | --- |
| Fresh dependency installation | Passed: 27 packages from the existing npm cache, using the committed lockfile; no new dependency |
| Fresh account/store setup | Passed: five new fictional accounts, generated private keys, empty report store |
| Application automated tests | **49 passed**, zero failures/skips |
| TypeScript | Passed, no errors |
| Production build | Passed |
| Foundation browser acceptance | **21 passed** |
| Connected-journey browser acceptance | **10 passed** |
| Survey generated-spec parity and offline mocks | **69 passed**, zero failures/skips; no Google access or clasp installation |
| Browser errors/external requests | None observed by either browser script |
| Existing-data preservation | All eight pre-existing demo stores, all tables and key-file hashes unchanged |
| Local normal app | HTTP 200 on port 3000 after verification |
| Source/history security review | No generated demo keys, credential/private Google identifier patterns or excluded data files found in reviewed candidates/history |

## Clean setup method

Exported the committed baseline with `git archive`, creating a source-only copy without node_modules, .next or existing demo data. Installed with:

```powershell
npm.cmd ci --ignore-scripts --offline --no-audit --no-fund
npm.cmd run setup
npm.cmd test
npm.cmd run typecheck
$env:NEXT_TELEMETRY_DISABLED = '1'
npm.cmd run build
npm.cmd start -- --port 3100
```

The first copy was nested in the repository's ignored demo directory. It passed tests/build, but Next inferred the parent lockfile as its workspace root. To avoid treating that as independent reproducibility, repeated the full install/setup/test/typecheck/build in a separate workspace directory **outside the repository**, with fresh node_modules and data. That build passed without the parent-lockfile warning. Browser acceptance ran against this independent compiled server.

Environment: Windows 10 Pro, Node 22.23.4, npm 12.2.2. Installation reused the local npm cache rather than proving availability from a new internet connection. No system changes, model downloads, external inference or new packages beyond the existing lockfile. Node's experimental SQLite warning remains expected on this pinned version.

## Journey and security coverage

The tests exercise real SQLite and the actual HTTP handler, with fictional fixtures only:

- Private contributor ownership, other-contributor denial, moderator/institution role boundaries, unauthenticated/forged-role/cross-origin requests and stale-tab conflicts.
- Exact community and institution-text approvals, recipient/relationship binding, invalidation after edits and legacy records without inferred approval.
- Submission separate from saving; moderator approve/withhold/clarification reasons and attributable history.
- Explainable candidate matching, weak-coincidence rejection, duplicate distinction, reviewed links and notices tied to current approved versions.
- Exact community projections excluding original/title/owner/private matching context.
- Recipient-specific routing, impersonation relevance, unique delivery keys, injected failure/persistent retry and rollback.
- Acknowledgement, investigation, action and resolution claims; contributor confirmation/dispute of individual outcomes.
- Correction/review/rerouting and permission withdrawal; pending cancellation and explicit historical retention of delivered copies.
- Persistence after close/reopen, generated-key hashing, session expiry/revocation, input/body bounds and inert markup.

Browser runs used the existing workspace Playwright runtime with installed Microsoft Edge, not a new project dependency. Both scripts ran through Contributor A/B, Moderator, Community and Bank/Mobile views. They exercised keyboard navigation, labels, mobile widths of 390/320px, 200% text reflow, actual HTTP access denial, editing and the complete response/correction/withdrawal journey. Fresh desktop/community and mobile/moderator screenshots were visually inspected. Acceptance screenshots and synthetic stores remain local and excluded from Git.

## Repository review

Reviewed current files and reachable Git-history blobs for credentials and generated demo keys. Checks included 50 existing/generated test keys, excluded filename patterns, private Google editor/project identifiers, ignore rules and whitespace. Scans supplement manual review; they are not a guarantee that every possible secret can be detected.

Public-source research accompanies the submission as historical assessments. Only historical-context notices, index wording and references to non-distributed local brief/deck files were adjusted; the research findings were not rewritten or re-researched. The personal workspace handover remains unchanged and is now explicitly ignored. Original accelerator files, respondent data, interviews, actual incidents, tokens, keys, SQLite/session data, caches and recordings are not submission contents.

## Limits and remaining decisions

No runtime AI or alias-based institution extractor exists. Manual institution tagging and deterministic report matching are intentional. This demonstrates workflow correctness on fictional cases, not fraud prevention, production security, multilingual comprehension or institutional adoption.

English UI; no SASL media, automated translation or full assistive-technology certification. Institutions, identities and deliveries are simulated. Local storage is unencrypted and the developer can access all demo identities. Previously delivered information is retained after withdrawal. Real deployments require separate identity, retention, privacy, moderation and security work.

The unused survey clasp dependency retains its previously documented audit findings; no new audit or remediation was performed. It is not installed or required for the application or offline survey tests.

The demonstration guide is prepared for a 3–5 minute walkthrough; no timed user rehearsal or video recording is claimed. GitHub account, repository visibility, optional reuse licence and publication approval remain owner decisions. No remote, push or deployment was performed.

## Later branding-specific verification — 10 November 2026

After applying the approved ZWAKALA identity, verification ran in a separate local copy containing the updated application source. This is distinct from the original Milestone 4 verification above.

- **49 application tests passed**; TypeScript check and production build passed.
- Focused browser checks covered desktop/mobile widths (1440/390/320px), 200% text and keyboard navigation, alongside the name, tagline, description and metadata. Desktop and mobile screenshots were visually inspected.
- No browser errors or external requests were observed.
- The complete **31-check browser acceptance suite** and **69 survey tests were not rerun after branding**. Their results above belong to the original Milestone 4 verification.

Later on the same date, following the two README editorial adjustments, the main local application was rebuilt successfully and restarted on `http://127.0.0.1:3000`. A fresh browser smoke check confirmed HTTP 200, the rendered name/tagline/description and browser title, with no browser exceptions. No sign-in, account setup or report mutation was performed by this check; no additional full test-suite run is claimed.
