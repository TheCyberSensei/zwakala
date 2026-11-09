# Digital Banking Confidence survey

Local source and offline tests implement the participant-approved eight-question survey. The participant deployed through the Apps Script editor and confirmed successful testing, approval and publication/sharing. Supplied execution logs show that the destination-exception and empty-title fixes led to successful draft verification. Codex has not independently compared the live editor source or inspected the published form; live URLs/IDs remain outside Git.

The runtime files below include the fixes supplied for the successful execution. Publication and response acceptance are manual release steps, so the specification retains safe draft settings. Do not rerun creation, verification or recovery against the published survey: those functions deliberately reject published forms. The remaining instructions document reproduction and draft troubleshooting, not further actions required on the live form. Formatting such as bold question titles is manual; its completion was not separately confirmed.

The owner is the participant-confirmed Shymoon Google Workspace account; the participant is its administrator. Confirm the selected browser/OAuth account against the approved identity before authorising any external action. Do not infer ownership from a currently signed-in browser or from Git configuration.

## Files and local commands

| File | Purpose |
| --- | --- |
| [form-spec.md](form-spec.md) | Authoritative approved text and settings in one JSON block. |
| [SurveySpec.gs](SurveySpec.gs) | Generated `getSurveySpec()` function; never edit directly. |
| [Code.gs](Code.gs) | Guarded draft creation, verification, diagnostics and explicit empty-title recovery. |
| [build-spec.cjs](build-spec.cjs) | Local generation and stale-output detection. |
| [appsscript.json](appsscript.json) | V8, Africa/Johannesburg and the Forms runtime scope. |
| [package.json](package.json), [package-lock.json](package-lock.json) | Local clasp 3.4.1 pin and reproducible dependency tree. |
| [.claspignore](.claspignore) | Upload allowlist: only the manifest and two `.gs` files. |
| [tests/survey.test.cjs](tests/survey.test.cjs) | Node built-in tests with mocked Google services. |

From this directory, with Node.js 22 or later:

```powershell
node build-spec.cjs --check
node --test tests/survey.test.cjs
# Equivalent combined check:
npm test
```

Tests and generation need no installed npm packages, credentials or network. For an approved wording/settings change, edit the JSON block, run `npm run build`, review the generated diff, and update the independent approved-content hash in the test only after human review. Do not update the hash merely to make a failing content test pass.

The approved local development dependency was installed using:

```powershell
npm install --ignore-scripts --no-audit --no-fund
```

For a future clean checkout, `npm ci --ignore-scripts --no-audit --no-fund` installs the locked tree. Network/sandbox permission may be required. Installation is not Google authentication. No global npm or Git settings are needed.

## Dependency audit: unresolved before clasp authentication

On 9 November 2026, installation added 296 packages. `npm audit --json` returned 8 affected-package findings: 2 high, 6 moderate, no critical. These include inherited findings, not eight independent vulnerabilities. The installed clasp version is 3.4.1. The relevant direct advisory roots are:

| Installed dependency | Advisory | Reported patched version |
| --- | --- | --- |
| zod 3.25.76 | [Oversized constrained collections can exhaust memory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | 4.6.6 |
| glob 10.5.0 | [Cancellation bypass can continue filesystem traversal](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) | 14.0.2 |
| minimatch 9.0.9 | [Pattern amplification denial of service](https://github.com/advisories/GHSA-g3hv-75wg-m249) | 11.0.1 |

Affected ancestors also include clasp, googleapis-common, gaxios, gcp-metadata and rimraf. Installation emitted deprecation notices for glob and node-domexception. The audit suggested a major downgrade to clasp 2.5.0; it was not applied. No dependency overrides or claims of exploitability/non-exploitability have been made. Major transitive replacements require compatibility investigation, not a blind override.

The participant selected editor-only deployment and instructed Codex not to investigate or modify clasp dependencies further. That route runs the reviewed FormApp files without loading clasp dependencies. Findings remain unresolved; using clasp later requires a new decision and review. No package changes or new audit were performed for the milestone commit.

## Approval boundaries

1. Local implementation, the original pinned dependency installation and offline tests were approved.
2. The participant performed editor deployment and supplied successful script-execution logs. Codex did not access the Google account or upload code.
3. The participant confirmed testing, approval and publication/sharing. Further external changes or access require explicit approval; account administration is not blanket permission.
4. The participant authorised this milestone commit subject to review. GitHub operations, remote creation and pushing remain unauthorised.

The following external-action instructions are documentation only. Do not execute them until the corresponding approvals and the dependency decision are recorded.

## Clasp upload and editor execution after approval

1. In the confirmed Workspace account, enable Apps Script API access in [Apps Script settings](https://script.google.com/home/usersettings) if needed. Resolve Workspace restrictions with the administrator; do not bypass them.
2. Review clasp's OAuth request and run `npm run clasp -- login`. Its installed default scopes include Apps Script projects/deployments/web-app deployment, Drive metadata and files, service management, logging, account email/profile and cloud-platform access. They are broader than this upload workflow. Do not silently consent to an unexpected request; the editor fallback avoids clasp OAuth entirely. Default login stores `.clasprc.json` under the user's home directory; never copy credentials into tracked files.
3. In [Apps Script](https://script.google.com/), create one **standalone** project named `Digital Banking Confidence Survey`. This creates a script, not a form. Save its Script ID privately and reuse this same project. Do not create another project on reruns.
4. Bind this folder to that project using a local, Git-ignored `.clasp.json`. From this directory:

```powershell
if (Test-Path -LiteralPath '.clasp.json') { throw 'A binding already exists; inspect it and reuse the approved project.' }
$surveyScriptId = Read-Host 'Paste the approved standalone Script ID'
if ([string]::IsNullOrWhiteSpace($surveyScriptId)) { throw 'Script ID is required' }
@{ scriptId = $surveyScriptId; rootDir = '.'; skipSubdirectories = $true } |
    ConvertTo-Json | Set-Content -LiteralPath '.clasp.json' -Encoding utf8
```

5. Run the following separately, reviewing each result before upload:

```powershell
npm test
npm run clasp -- show-file-status
# Confirm exactly Code.gs, SurveySpec.gs and appsscript.json are listed for upload.
npm run clasp -- push
```

Upload only to the reviewed new standalone project. Clasp push replaces project content; never point it at an unrelated existing script. Do not use `clasp create` inside this populated source directory: inspection of clasp 3.4.1 showed that create also pulls starter files, which could overwrite the reviewed manifest/code. Creating the standalone project in the editor and binding it locally avoids that risk. Do not use `clasp pull` to overwrite local approved source.

6. In the editor, inspect the uploaded code and manifest. Select `createOrOpenDraft`, click Run and review the Google consent screen. The manifest requests only `https://www.googleapis.com/auth/forms`; this grants Forms access beyond a single form. It requests no Gmail, Sheets or Drive scope for runtime execution. If Google/Workspace blocks authorisation, stop and report the restriction.
7. After success, inspect the owner-only execution log. It reports the editing URL and respondent URL labelled **INACTIVE — UNPUBLISHED**, plus outstanding manual checks. Keep live URLs/IDs out of Git and development logs. Share them only with the participant through the authorised handoff.
8. Run `verifyDraft` for configuration checks, then rerun `createOrOpenDraft` once: it should return the same URLs and eight items without changing the form. Inspect the form manually using the checklist below.

No API executable or web deployment, custom OAuth client, `clasp run`, new spreadsheet or trigger is needed.

## Editor-only deployment (selected approach)

This path does not require clasp, npm installation or clasp OAuth.

1. Run the local build/check and tests above. In the confirmed account, create or reuse the one approved standalone Apps Script project.
2. Paste the complete contents of `Code.gs` into the editor's Code file. Add a Script file named `SurveySpec` and paste `SurveySpec.gs` into it.
3. Open Project Settings, enable showing `appsscript.json`, and replace its content with the reviewed local manifest. Save all files.
4. Compare the saved source with the local files. Select `createOrOpenDraft`, review the Forms consent and run only after creation approval.
5. Follow the same verification and recovery rules. Do not create a second project if a CLI attempt already created one; reuse it and its Script Properties.

## State and recovery

If recovery reports a title mismatch despite the visible heading matching, replace `Code.gs`, save, and run `inspectDraftTitle`. Its execution log shows the saved form's editing URL, the expected title from the deployed specification, the actual title returned by Google and the first differing Unicode character. It reads only; it does not change the form or Script Properties. Compare the editing URL with the intended form and retain the diagnostic output for troubleshooting. Do not clear properties or bypass verification.

For the reported no-response-destination error, replace only the editor's `Code.gs` with the updated local file and save. Keep `SurveySpec.gs`, the manifest and Script Properties unchanged. Run **`recoverExistingDraft`**, then **`verifyDraft`**. Recovery opens the saved `DC_FORM_ID`, verifies the unpublished form's content/settings and only then records completion. It does not add questions, create a replacement, link a spreadsheet or publish. The execution log returns `editingUrl` and the inactive `respondentUrl`. If verification fails, preserve the error and stop rather than clearing state.

`DC_PHASE` progresses from absent to `CREATING` to `COMPLETE`. `DC_FORM_ID` is stored immediately after creation; `DC_SPEC_FINGERPRINT` binds completed state to the exact approved specification. The script checks property writes by reading them back, and all public entry points use a script lock.

For the confirmed empty-title result (`actualTitle: ""` on the intended form), replace `Code.gs`, save and run `repairEmptyDraftTitle`, then `verifyDraft`. This explicit repair checks the other readable settings first, sets only the empty title to the approved text, verifies the result and records completion. It refuses published forms, different nonempty titles, other configuration mismatches and invalid stored state. It creates no form and does not publish.

On any other incomplete/ambiguous failure, stop. Preserve Script Properties and owner-only execution details. With explicit recovery approval, inspect the existing form/project to decide a targeted repair. Apart from the explicit empty-title repair above, the supplied code does not repair content, delete, reset properties or create replacements. If creation succeeded but the ID was not saved, a human must reconcile the owner's Drive/project state before any further creation. A timeout before creating can also leave a conservative blocking marker.

The guard applies to one script project. Copying projects or clearing all properties can defeat it. Do not manually mark a partial form COMPLETE. Changed content or a published form causes verification to stop without modification. Explicit recovery only completes stored state after successful verification; it cannot repair incomplete questions. There is no built-in update/migration operation; future changes need a reviewed implementation.

## Verification checklist

Offline tests verify construction intent against mocks, not Google's UI behaviour. A fixed hash guards all approved wording/settings, and generated-content parity is checked. The suite also covers concurrent calls, state failures, repeat execution, unsafe settings and form drift. Native Other boundary scenarios are model-only. FormApp cannot read back checkbox-validation rules; a successful `verifyDraft` therefore reports manual checks still required.

After authorised creation, inspect without submitting responses:

- [ ] Form is **unpublished** and not accepting responses. Both states must hold; response closure alone is insufficient.
- [ ] Exactly eight questions in approved order; all required; Q7/Q8 are paragraphs with complete help text.
- [ ] Titles, fixed choices, descriptions, affiliation and confirmation match the specification exactly.
- [ ] Q1/Q2/Q3/Q6 use native write-in Other without duplicate fixed Other choices. Q3 has fixed Not sure, not Other / Not sure. Native Other follows Google's placement, including at the end of Q6.
- [ ] Editor validation shows Q2 maximum 3 and Q3 maximum 2. Q6 has no maximum. Do not add an unapproved exclusivity rule for Not sure or no clear preference.
- [ ] Email collection, one-response restriction, response summaries, response-edit links and shuffling are off. Inspect per-question option shuffling manually as well.
- [ ] Workspace responder permissions can support external anonymous access. Do not publish/share merely to test this. The deprecated `setRequireLogin` is not used.
- [ ] No linked spreadsheet, quiz, upload question, identifying field, logos or added endorsement wording.
- [ ] Mobile/desktop preview remains readable, particularly Q8. Native Other and paragraph inputs accept mixed-language Unicode text. No Submit clicks or fake responses in the research dataset.
- [ ] Any optional theme changes are manual, approved and documented; no theme API is claimed.
- [ ] `verifyDraft` passes readable settings; a repeated create call returns the same form without adding items.

Publication/distribution are a separate milestone. Only after explicit approval, review the responder audience, publish through the Forms UI and verify signed-out external access without submitting. If submission-based enforcement tests are needed, obtain approval for a separate disposable test form. Do not contaminate the research dataset or silently delete test responses.

No intentional identity collection is not a guarantee of anonymity: free text can identify people. Preserve the approved privacy prompts. Native Other labels and UI localisation are controlled by Google; this implementation does not translate responses or impose language restrictions.

## Evidence and references

Record observed outcomes, failures, approvals and unresolved checks in the [development log](../docs/codex-development-log.md). Keep credentials, response exports, interviews and private material outside Git. The existing `.gitignore` covers these conventions but does not inspect file contents. See [AGENTS.md](../AGENTS.md) for quality and oversight requirements.

- [FormApp creation and scopes](https://developers.google.com/apps-script/reference/forms/form-app)
- [Form settings and publication controls](https://developers.google.com/apps-script/reference/forms/form)
- [Native Other and checkbox methods](https://developers.google.com/apps-script/reference/forms/checkbox-item)
- [Checkbox selection validation](https://developers.google.com/apps-script/reference/forms/checkbox-validation-builder)
- [Publishing and responder access](https://support.google.com/docs/answer/2839588?hl=en)
- [clasp source and OAuth documentation](https://github.com/google/clasp)

Codex's contribution: local specification transcription, approved refinement implementation, generator and recovery guards, mocked tests, dependency inspection and documentation. This work is not research evidence, participant testimony or a capstone idea.
