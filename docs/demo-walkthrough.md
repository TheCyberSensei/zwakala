# ZWAKALA — demonstration strategy and presenter script

**Your story. A signal for change.**

*A community-powered digital safety and reporting platform.*

Prepared 11 November 2026. Target **4½–5 minutes**, with a shorter three-minute recording option below. Timings are estimates, not an observed human rehearsal. All incidents, accounts, organisations and responses are fictional; institutional delivery is simulated locally. Public source: [TheCyberSensei/zwakala](https://github.com/TheCyberSensei/zwakala).

## Recommended story: one experience, a possible connection, a response

Follow Contributor A from a saved private story back to their own progress screen. Contributor B is the prepared comparison, not a second protagonist. This lets a first-time audience understand the stakes before seeing the controls.

Spend most of the demonstration on two moments: **two separate stories become a qualified community signal**, then **the contributor can question an institution's reported action**. Together they show what goes beyond a complaint form: controlled disclosure, reviewable connections, useful audiences and accountable follow-up. Describe collective intelligence as a possibility demonstrated by the workflow, not proven intelligence quality or independent corroboration.

Prefer one continuous local walkthrough, one browser window and three account changes during the visible journey: A → Moderator → Example Bank → A. The moderator can open Community without another sign-in. Avoid multiple browser profiles/windows on this computer. Ordinary tabs share the login cookie and are not separate roles.

The trade-off is less live form entry, more visible outcomes. Prepare typing and exact-text approvals beforehand, disclose that preparation, and show the approved versions before submitting. Reserve withdrawal, mobile layouts, additional institution accounts and the detailed evidence for questions. Do not spend the main recording on setup, test output or a tour of every field.

## Estimated flow

| Target time | Screen/action | What judges should understand |
| --- | --- | --- |
| 0:00–0:35 | A's saved story, ZWAKALA header | A personal experience can help someone else; this is fictional. |
| 0:35–1:10 | Sharing summary; open approved versions; submit A | The person chooses the exact words and audiences. |
| 1:10–2:00 | Moderator approves A; reviews reasons; confirms the possible relationship; displays notice | Similarity is explained, reviewed and qualified. |
| 2:00–2:25 | Community notice and two stories | **Pause here:** useful warning, without pretending two accounts prove a campaign. |
| 2:25–3:20 | Bank inbox: acknowledge A, then record an action | Relevant institutions can respond; impersonation does not imply fault. |
| 3:20–4:10 | Return to A; refresh; dispute that action | Delivery is not resolution. The contributor remains part of the conversation. |
| 4:10–4:40 | Stay on contributor progress; close | What works, what Codex contributed, and what still needs validation. |
| 4:40–5:00 | Buffer | Scrolling, sign-in or slower rendering; do not add features to fill it. |

## Spoken script

The script is approximately **400 words**. Adapt the rhythm to your own voice. Speak while navigating where comfortable; pause for the community notice and final feedback. Do not read all the on-screen text aloud.

**Opening — A's saved story**

> A message arrives, claiming to be from your bank. It asks for a security code. You spot the risk and ignore it. But what if someone in your community receives the same kind of message tomorrow?
>
> My starting point was noticing how some South Africans rely on others for help with digital banking. That raised questions about confidence, trust and safety. ZWAKALA explores what could happen if people's experiences helped others learn, and reached organisations able to respond.
>
> Your story. A signal for change. Everything I’m showing is fictional, including the bank.

**Control — approved versions and submission**

> I’ve prepared two different fictional accounts to save typing time. This one is still private; the other has already been reviewed.
>
> The contributor decides which words the community may see and what selected organisations receive. The original remains accessible only to the contributor and moderator. Here, the bank was impersonated; that does not mean it caused the scam.
>
> I’ll now submit the approved version for review.

**Collective intelligence — moderator to community**

> As moderator, I check the approved versions before sharing. The system suggests a connection: similar channel, request, organisation relationship and nearby dates. These are explainable rules, not AI.
>
> I can reject this suggestion. Here, I’m confirming only a possible relationship and displaying a qualified notice.
>
> Now the community can read both stories in the contributors' approved words. This is the important step: separate experiences become a useful signal. Two reports do not prove a campaign. The uncertainty stays visible, and readers can return to the stories behind the notice.

**Response — simulated bank inbox**

> The relevant bank receives the approved organisation version in this simulated inbox. It can be relevant because it was impersonated, without being at fault.
>
> I’ll acknowledge receipt, then record a fictional action: preparing a customer warning. Receipt, action and resolution are different things. No real institution is involved here.

**Follow-up — back to A**

> Back with the contributor, we can see who responded and what they said. But a reported action is not automatically a satisfactory outcome.
>
> This person still needs clarification. I’ll record that disagreement. Their voice does not disappear once they press Submit.

**Close — hold on the recorded dispute**

> The idea is mine. Codex helped me research, design, build, debug and test this connected journey.
>
> What works today is a local prototype: controlled sharing, reviewed connections and visible follow-up. It does not yet prove fraud reduction or institutional adoption. The next step is testing with people and exploring partnerships, not assuming they exist.
>
> ZWAKALA: your story, a signal for change.

## Preparation before recording — not shown as live work

1. **Keep the ordinary demo untouched.** Use a new, ignored rehearsal store. From the repository root, in a separate PowerShell terminal:

   ```powershell
   cd prototype
   $env:DEMO_DATA_DIR = Join-Path (Get-Location) '.demo/presentation-recording-01'
   $env:NEXT_TELEMETRY_DISABLED = '1'
   npm.cmd run setup
   npm.cmd start -- --port 3200
   ```

   These commands assume the approved production build already exists, as verified for this submission. If it does not, build before starting; never rebuild while another server is using those build files. Setup refuses existing keys: choose a new directory name, not deletion/reset. Open [http://127.0.0.1:3200](http://127.0.0.1:3200). If port 3200 is occupied, inspect the process or use a free port; do not kill unrelated processes.

2. Read `.demo/presentation-recording-01/account-keys.local.txt` privately. Keep only the current role's key ready to paste into the masked field; never show the key file, clipboard history or an unmasked key on camera. Sign in by selecting **Demo account**, entering **Local demo key**, then **Sign in to demo**.
3. Use the exact scenario below. For each contributor, **Try a fictional example** supplies an editable starting point, not the finished scenario. Replace title/original/date; set **What were you asked to do? → Share a security code**. Keep SMS, English and **No, I did not**. For B, remove connection 2 (mobile) on the organisations step. For A, retain bank impersonation and mobile service involvement.
4. Choose **Organisations and community**; explicitly check the intended recipient(s). Replace **Proposed community version** and **Text for selected organisations**. Select **Approve this exact version**, then **Approve organisation text and recipients**. Continue with **Review your report**, confirm fictional data and **Save private report**. Copying text is not automatic redaction; these versions have been deliberately written for their audiences.
5. Prepare **B first**: submit B, sign out, sign in as Moderator and **Approve sharing** with the review reason below. Then sign out, sign in as A, prepare/save A with both versions approved, **but do not submit A**. Leave A selected. Do not pre-confirm the relationship or display its notice.
6. Keep the short review/update sentences below available as non-sensitive cue text. Close unnecessary tabs/apps; use one browser window at a comfortable readable size. Build and warm the app before opening recording software. Use an already available recorder; avoid simultaneous video editing, live streaming, slide software or other heavy apps. Record the application window only; test a short local audio/screen sample first. No recording tool has been installed or configured by Codex.
7. Rehearse the three role switches and the scroll to **Possible connections**. Signing in again requires selecting the saved report; it does not automatically reopen it. Stay below the global ten-sign-in-attempts-per-minute limit. The run below includes six sign-ins across preparation and presentation.

## Live runbook — exact actions and expected results

| Step | Actions | Expected result / cue |
| --- | --- | --- |
| A: control | Show **Your sharing choices**. Expand **View approved community version** and **View organisation version**. Scroll to **What happened next?**, select **Submit approved version for review**. | Before clicking, it says saved privately/not submitted. Afterwards the button reads **Submitted for review**. Only approved audience versions become eligible; saving alone did not share. |
| Switch 1: Moderator | **Sign out** → choose Moderator → sign in. In **Review queue**, find **Fictional code request — Example A**. Read its approved text; expand **Read private original and connections** if needed. Enter the review reason below and click **Approve sharing**. | **Approved for sharing** appears with the reason/account. This triggers eligible community display and immediate simulated delivery, not an institutional acknowledgement. B was already reviewed during preparation. |
| Moderator: possible connection | Scroll to **Possible connections**. Find the A/B pair, read the reasons and caveat. Enter the association reason; click **Confirm possible relationship**, then **Display qualified community notice**. | The pair is **Potentially related experiences**, not a duplicate. A qualified notice appears only because both current community versions are approved. The typed reason explains the moderator decision; the public warning itself uses fixed, qualified wording. |
| Moderator: Community | Select **Community**. Show **Qualified pattern notices** and the two shared stories; use **Read linked experience 1** if useful. | Two exact approved narratives; no private originals. Pause long enough to read the warning's uncertainty. This is an authenticated local community view, not a public reporting site. |
| Switch 2: Example Bank | Sign out → **Example Bank representative** → sign in. Find the inbox entry whose approved text begins **FICTIONAL DEMONSTRATION A**; do not simply choose the first entry, since B also reached the bank. | The entry shows **Someone pretended to represent them**. The institution receives approved text and its own relationship context, not the private original. |
| Bank: acknowledgement/action | In A's entry, fill **Update for the contributor** with the acknowledgement below; click **Acknowledge receipt**. Then choose **Update stage → Action reported**, enter the action below and **Record update**. | Both attributed stages appear. Do not claim an investigation or real warning was sent. Acknowledgement must come before the action. |
| Switch 3: Contributor A | Sign out → Contributor A → sign in. Select **Fictional code request — Example A** in **Your saved reports**; click **Refresh progress**. Under the bank's **Action reported**, expand **Confirm or dispute this outcome**. Enter the follow-up under **Your experience of this outcome**; click **Dispute outcome**. | **Contributor disputes outcome** appears alongside the specific update, with attribution. Close here: the person can see and challenge what happened. |

**Non-sensitive cue text** — prepare before recording; paste only the appropriate sentence:

- Review reason: “Fictional demonstration: checked the exact contributor-approved versions and recipient context.”
- Association or notice reason: “Similar reported channel, request and bank impersonation within two days; connection remains unverified.”
- Acknowledgement: “Fictional receipt acknowledged; no finding established.”
- Action: “Fictional action: a customer warning was prepared. This is not a verified investigation or resolution.”
- Contributor follow-up: “Fictional follow-up: I have not seen the reported warning and still need clarification.”

## Exact fictional scenario

Prepare the following reports using the ordinary UI. No database edits, seed script or hidden AI step is required.

| Field | Contributor A | Contributor B |
| --- | --- | --- |
| Title | Fictional code request — Example A | Fictional code request — Example B |
| Date | 2026-11-01 | 2026-11-02 |
| Channel | SMS | SMS |
| Requested action | Share a security code | Share a security code |
| Outcome | No, I did not | No, I did not |
| Languages | English | English |
| Organisation connections | Example Bank: Someone pretended to represent them. Example Mobile: Their service was used or mentioned. | Example Bank: Someone pretended to represent them. |
| Sharing | Organisations and community; explicitly select both connections | Organisations and community; explicitly select the bank connection |

**A: private original**

> FICTIONAL DEMONSTRATION A. A text message claimed to be from Example Bank and asked me to send a security code. It arrived on a phone using Example Mobile. I did not reply. I do not know who sent it.

**A: approved community text**

> FICTIONAL DEMONSTRATION A. A message pretending to represent a bank asked for a security code. I did not send it. The sender and any connection to other reports are unverified.

**A: approved organisation text**

> FICTIONAL DEMONSTRATION A. A message claimed to represent Example Bank and asked for a security code. It arrived using Example Mobile. I did not reply. This account does not establish fault by either organisation.

**B: private original**

> FICTIONAL DEMONSTRATION B. I received a different SMS claiming to represent Example Bank. It said my access needed checking and asked for a security code. I did not send one. I cannot identify the sender.

**B: approved community text**

> FICTIONAL DEMONSTRATION B. Another message asked for a security code while claiming to represent a bank. I did not send one. Its source and relationship to other experiences remain uncertain.

**B: approved organisation text**

> FICTIONAL DEMONSTRATION B. An SMS claimed to represent Example Bank and requested a security code to check access. I did not send one. The sender is unknown; impersonation does not establish bank responsibility.

## Contingencies and shorter alternatives

- **Navigation takes longer:** keep the private/public distinction, qualified connection and contributor follow-up; shorten narration and omit opening both version panels or following the notice link. Do not skip mandatory review or pretend an uncompleted action succeeded.
- **A strict three-minute recording:** use the same completed journey but trim disclosed sign-in/navigation pauses. Label cuts “Switching demo role”; leave the approvals, uncertainty notice, institutional update and contributor feedback visible. This saves time but provides less continuous evidence than the preferred 4½–5 minute walkthrough. For a strict three-minute *live* slot, prepare the bank update beforehand and clearly say that you are showing an earlier fictional run; do not call the whole journey live.
- **Stale view:** use the relevant **Refresh review queue**, **Refresh community**, **Refresh inbox** or **Refresh progress** once. If the saved report is not selected after sign-in, select it. Do not edit the story just to refresh it: editing invalidates current sharing/review.
- **No candidate or notice:** verify the two dates, SMS, share-code request, matching bank/impersonation relationship, different contributor accounts and both current community approvals. Never change the rules or assert that a suggestion exists when it does not. Both versions must be reviewed before a notice can display.
- **Wrong inbox entry:** match the approved prose beginning **FICTIONAL DEMONSTRATION A**, not list position. If the action stage is unavailable, acknowledge A first. Do not create duplicate accounts/reports as a workaround.
- **Unexpected error or slow computer:** say, “This local demo has stalled. I’ll show a captured fictional run and explain what it demonstrates.” Stop repeated clicks. Use previously captured screenshots only if they show an actually completed run, and label them **recorded demonstration evidence**, not live state. If no evidence exists, describe the intended step as unverified in this attempt. Never conceal a failure as success.
- **Reserve demonstration only:** withdrawal stops further visibility/delivery, but retains delivered history and makes the report read-only. Perform it after the main journey, not before recording or as a reversible reset.

Capture four fallback views during your successful rehearsal: (1) A's sharing summary, (2) the explained A/B connection, (3) community notice and stories, (4) A's attributed bank update and dispute. Keep fictional labels visible and exclude key files, other tabs and real personal information. No video has been recorded or published by Codex.

When finished, stop only the rehearsal server with Ctrl+C and clear its shell override with `Remove-Item Env:DEMO_DATA_DIR`. The original port-3000 app uses its existing data. A completed rehearsal is not a pristine recording starting point: for another continuous run, prepare a new store and repeat preparation; do not delete or reset an old store.

## Validation and evidence boundaries

On **11 November 2026**, source review checked the actual control labels, permission/state transitions, rule-based matching and notification behaviour. Focused Playwright/Edge validation used one browser context and a new isolated fictional store on port 3200, against the already-built application. It exercised this exact A/B scenario: B reviewed and A saved privately; live A submission/review; explained association and qualified notice; exact community text and source link; bank impersonation context, acknowledgement/action; contributor return and dispute. Screenshots were captured locally, outside Git.

The initial run passed through community display, then timed out because the validation selector incorrectly added a full stop to the bank relationship label. The selector was corrected and the remaining transitions passed against the same rehearsal state. No application correction was needed; this was not a single uninterrupted timed rehearsal. The resumed check found no browser exceptions/external requests and confirmed the original store's table-content/key hash unchanged across that check. The ordinary demo was not used for sign-in or report mutation.

No full test-suite rerun, measured narration time, recording performance test, real-user study or successful live human presentation is claimed. Timing remains an estimate until the presenter rehearses with their recorder. No real institution, verified campaign, fraud-reduction outcome or runtime AI is demonstrated. See [verification evidence](final-verification.md) for the separately recorded checks and owner-inspected GitHub diagram.
