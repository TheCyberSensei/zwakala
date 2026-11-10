# ZWAKALA demonstration: a fictional experience becomes useful information

**Your story. A signal for change.**

A community-powered digital safety and reporting platform.

Target: **3–5 minutes**, using the real local application. All people, organisations, incidents and responses below are fictional. Institutional activity is simulated, not a live notification or investigation. No runtime AI is used.

## Preparation outside the recording

Use the root README setup. Keep the normal store untouched: for a separate rehearsal, set a **new** data directory before setup/build/start:

```powershell
cd prototype
$env:DEMO_DATA_DIR = Join-Path (Get-Location) '.demo/presentation-01'
$env:NEXT_TELEMETRY_DISABLED = '1'
npm.cmd run setup
npm.cmd run build
npm.cmd start -- --port 3200
```

Open http://127.0.0.1:3200. Read keys privately from `.demo/presentation-01/account-keys.local.txt` in another terminal. Never film the file or terminal. Choose a different directory name for a fresh rehearsal rather than deleting/resetting an existing store. When returning to the normal demo in this shell, stop the rehearsal server and run `Remove-Item Env:DEMO_DATA_DIR`.

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

1. As Contributor B, approve both exact audience versions, save, and **Submit approved version for review**.
2. Sign out; sign in as Moderator. Approve B with reason: “Fictional demonstration: checked the exact contributor-approved versions and recipient context.”
3. Sign out; sign in as Contributor A. Prepare and approve both exact versions, then save **without submitting**. Leave the saved report open for the start of the demonstration.

This preparation is disclosed: B is an existing fictional comparison report; A is a saved fictional draft. The timed walkthrough shows actual submission and state changes, not prerecorded inference. Switching accounts in one window is sufficient; each sign-out ends its session. Do not assume different tabs have different identities. The local limit is ten sign-in attempts per minute; rehearse at normal pace.

## Timed walkthrough

| Time | Live action | Explain |
| --- | --- | --- |
| 0:00–0:30 | Show A's private original and approved versions. | “This is ZWAKALA. Your story. A signal for change. It is a community-powered digital safety and reporting platform, connecting people's experiences to community awareness and relevant organisations' responses. The original idea is mine; Codex helped develop and test it. Everything shown is fictional.” |
| 0:30–1:00 | Select **Submit approved version for review**. | “Saving is private. I manually chose the institutions, relationships and exact text for each audience. Mentioning a bank does not make it responsible.” |
| 1:00–2:00 | Sign out, select Moderator and sign in privately. In **Review queue**, approve A with the reason above. Inspect the A/B suggestion, enter “Similar reported channel, request and bank impersonation within two days; connection remains unverified.” Select **Confirm possible relationship**, then **Display qualified community notice**. | “Rules suggest a connection and explain why. A moderator can reject it or mark a duplicate. This is not AI, corroboration or proof of one campaign.” |
| 2:00–2:30 | Open **Community**. Show both exact narratives and the qualified notice. | “Only approved versions appear. Private originals and matching metadata stay out. Readers see uncertainty and links back to the shared accounts.” |
| 2:30–3:30 | Sign out and sign in as Example Bank representative. Find inbox text beginning **FICTIONAL DEMONSTRATION A**. Acknowledge: “Fictional receipt acknowledged; no finding established.” Then select **Action reported** and record: “Fictional action: a customer warning was prepared. This is not a verified investigation or resolution.” | “This is a persistent simulated inbox. Delivery, acknowledgement and a reported action are distinct. The organisation sees its own relationship context.” |
| 3:30–4:15 | Sign out and return to Contributor A. Select report A and **Refresh progress**. Expand **Confirm or dispute this outcome** under Action reported. Dispute with “Fictional follow-up: I have not seen the reported warning and still need clarification.” | “The contributor sees who responded and can dispute an outcome instead of silently accepting closure.” |
| 4:15–4:45 | Optional: expand withdrawal and withdraw A with “Fictional demonstration withdrawal: stop further sharing.” Show Community after refresh, then explain retained delivery history. | “Further visibility stops. Previously delivered information is not magically recalled.” |
| 4:45–5:00 | End with the limitations and README. | “A working, tested local journey—not proven fraud prevention or a real bank partnership. Another month would prioritise user/accessibility testing and agreed institutional processes; AI remains an evaluated future option.” |

For a shorter version, omit the optional withdrawal segment and shorten narration; do not skip audience approval or pretend outcomes are verified. Investigation and reported-resolution stages are available and tested, but the minimal demonstration needs acknowledgement, an action and contributor feedback.

## Minimum supporting material

A single 3–5 minute screen recording is sufficient if it clearly shows the workflow. If screenshots are needed, capture **four** clean views from the fictional rehearsal:

1. Contributor A's original/sharing summary with explicit exact approvals.
2. Moderator suggestion with reasons, decision and qualified notice control.
3. Community narratives and qualified notice (mobile width is useful).
4. Contributor progress showing bank acknowledgement/action and the dispute.

An inbox view can be an optional fifth image. Keep the “fictional/simulated” labels visible. Hide account-key files, browser profiles, other tabs, notifications and any real incident material. No recording or screenshot is evidence of real institutional participation.

Automated browser checks also retain fictional screenshots in their ignored acceptance directory. They are testing evidence, not a substitute for rehearsing this timed narration. No video has been recorded or published by Codex.
