# Final verification and submission readiness

This document separates dated historical verification from the final capstone evidence. On **11 November 2026**, the participant excluded the separate banking-staff questionnaire from the current repository after verified archival. Its earlier mocked tests are not validation of ZWAKALA. See [D011](decisions.md#d011-separate-the-banking-survey-from-the-final-capstone).

## Final script refinement and repository cleanup — 11 November 2026

- **Application:** 49 tests passed with zero failures/skips; TypeScript and production build passed. Verification ran in the independent local copy previously cloned from GitHub; every tracked application source/config/test file was compared with the current repository and matched after line-ending normalisation. No source or dependency changes were made. Existing Node experimental SQLite warning remains.
- **Runtime/preservation:** The rebuilt isolated app started on port 3100 and returned HTTP 200 with ZWAKALA branding; it was then stopped. The original port-3000 app remained available. All table-content and key hashes in ten existing repository demo stores matched across the preservation check. No existing accounts were reset or replaced.
- **Survey separation:** Complete external archive verified before removal: 10,231 files, 1,455 directories, 255,785,646 file bytes, including source/documentation and installed dependencies. Every file's size/SHA-256 matched, and a post-removal archive recheck also passed. Ten tracked survey files and the leftover local dependency directory were removed. No private responses or deployed Google Form were accessed or altered. Earlier Git commits retain the survey intentionally.
- **Repository review:** All 40 remaining local Markdown links resolve. The 43-file prospective tree contains no survey/archive/private-data paths; checks against 50 known demo keys and credential patterns found no matches. Ignore-rule and staged-whitespace checks passed. These checks supplement review rather than guarantee detection of every possible secret.
- **Documentation/presentation:** Current survey setup instructions, testing claims and dependency warnings removed; historical records retained with explicit scope. The historical survey-guide link now targets its preserved Git commit. The revised script has 295 spoken words and a 62-word personal introduction, with four minutes planned and up to one minute navigation buffer. The unchanged A/B transitions retain the focused validation recorded under Presenter journey validation; controls were rechecked in source. This is not a timed presenter or recording-performance rehearsal, and the full browser acceptance suite was not rerun for this cleanup.

The latest cleanup and preceding presenter-guide commit await approval to push. No application deployment or history/author rewrite is part of this work.

## Original Milestone 4 application results

Original Milestone 4 verification: **10 November 2026**, Africa/Johannesburg, Default Mode. Approved application baseline: `3feabe7bfa5db0154e571b73963c572a3adc9604`. That phase changed documentation/repository preparation only; application code, dependencies and existing demo data remained unchanged.

| Check | Observed result |
| --- | --- |
| Fresh dependency installation | Passed: 27 packages from the existing npm cache, using the committed lockfile; no new dependency |
| Fresh account/store setup | Passed: five new fictional accounts, generated private keys, empty report store |
| Application automated tests | **49 passed**, zero failures/skips |
| TypeScript | Passed, no errors |
| Production build | Passed |
| Foundation browser acceptance | **21 passed** |
| Connected-journey browser acceptance | **10 passed** |
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

At the original Milestone 4 checkpoint, the demonstration guide was prepared but no timed user rehearsal or video recording was claimed, and repository publication was still pending. Subsequent approved GitHub publication and owner verification are recorded below and in the development log. Application deployment remains outside scope.

## Later branding-specific verification — 10 November 2026

After applying the approved ZWAKALA identity, verification ran in a separate local copy containing the updated application source. This is distinct from the original Milestone 4 verification above.

- **49 application tests passed**; TypeScript check and production build passed.
- Focused browser checks covered desktop/mobile widths (1440/390/320px), 200% text and keyboard navigation, alongside the name, tagline, description and metadata. Desktop and mobile screenshots were visually inspected.
- No browser errors or external requests were observed.
- The complete **31-check browser acceptance suite** and **69 survey tests were not rerun after branding**. Their results above belong to the original Milestone 4 verification.

Later on the same date, following the two README editorial adjustments, the main local application was rebuilt successfully and restarted on `http://127.0.0.1:3000`. A fresh browser smoke check confirmed HTTP 200, the rendered name/tagline/description and browser title, with no browser exceptions. No sign-in, account setup or report mutation was performed by this check; no additional full test-suite run is claimed.

## GitHub Mermaid workflow — owner verification

**PASSED (owner visual inspection)** — recorded 11 November 2026 from the owner's explicit confirmation. The owner personally inspected the Mermaid workflow in the [published ZWAKALA README](https://github.com/TheCyberSensei/zwakala) and confirmed that the diagram renders correctly, including its stages, arrows and branches. This closes the earlier visual-rendering limitation. It is **not automated browser verification** by Codex.

## Presenter journey validation — 11 November 2026

The [revised demonstration guide](demo-walkthrough.md) was checked against implemented controls and exercised with its exact fictional A/B scenario in a separate local rehearsal store. Focused browser validation covered preparation, A's submission/moderation, possible association and qualified notice, exact community stories/link, simulated bank acknowledgement/action, and contributor dispute. One test selector had an extra full stop; it was corrected and validation resumed on the same state. No application change or claim of an uninterrupted timed human rehearsal. Community and contributor-feedback screenshots were visually inspected; narration/recording timing remains estimated. Full automated/browser/survey suites were not rerun for these documentation-only changes.
