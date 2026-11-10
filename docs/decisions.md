# Development decisions

Record meaningful decisions with their date, status, rationale and consequences. Do not treat hypotheses as findings or record approvals that have not occurred.

## D010: Close AI feasibility and preserve the verified submission

- **Date:** 10 November 2026 (Africa/Johannesburg).
- **Status:** Explicit participant decision in the Milestone 4 request.
- **Decision:** Do not implement local AI inference or introduce a paid API. Institution associations remain manually selected; incident matching remains explainable and rule-based. AI-assisted institution association is a potential future enhancement, not a delivered capability.
- **Rationale:** The participant judged available spare resources insufficient for a reliable model demonstration and confirmed no API budget. Preserve the functioning approved baseline rather than add an unsustainable dependency. This is a scope/resource decision, not proof that all local AI is impossible.
- **Submission scope:** Preserve application baseline `3feabe7bfa5db0154e571b73963c572a3adc9604`; run final tests, clean setup and browser acceptance; prepare a concise README, fictional demo and local commits. Include reviewed public-source research with historical framing. Keep the outdated personal workspace handover local-only; do not redistribute the original accelerator PDF/deck.
- **Approval boundary:** Local reviewed submission commits are authorised. GitHub account/visibility/licensing choices, repository creation, pushing and any application deployment remain separate decisions. Stop after preparation and verification.

## D009: Version-bound community intelligence and simulated institutional response

- **Date:** 10 November 2026 (Africa/Johannesburg).
- **Status:** Participant approved Milestone 1 and explicitly authorised local Milestone 2, preserving existing data and stopping for review before Milestone 3. Default Mode; no external services or commit.
- **Decision:** Extend the existing SQLite application with explicit submissions, attributable moderation, exact audience versions, explained rule matching, qualified notices, a durable immediate-delivery simulation, institutional updates and contributor feedback. Use an additive schema and private revision snapshots rather than rewriting existing rows or replacing accounts. No dependency changes.
- **Disclosure:** The contributor separately approves community text and organisation text plus recipient relationships. All selected organisations receive the same approved organisation text with only their own authorised relationship context. Bespoke per-recipient prose is deferred; the UI states this boundary. No original/title/private matching metadata automatically enters community or institutional views.
- **Intelligence:** Matching proposes, never declares, a relationship. Duplicate candidates are distinct. Moderator confirmation/rejection and notices bind current versions. Public-facing local notices use fixed qualified text linked to exact approved experiences; private matching reasons are withheld. This limits expressive summaries but prevents accidentally publishing unapproved structured context. Different demo contributors are required for notices, without claiming real identity independence.
- **Delivery and outcomes:** Unique report/version/institution keys deduplicate durable simulated delivery. A transaction failure leaves a retryable pending queue. Each recipient sees only its own snapshot, including impersonation context. Acknowledgement, investigation, action, institutional resolution claims and contributor confirmation/dispute remain distinct attributable events.
- **Correction/withdrawal:** Every edit stops current community display, invalidates linked notices, cancels pending notifications and marks delivered versions historical/read-only. New submission/review is mandatory. Withdrawal is terminal for that saved report, retaining private history; no recall, erasure or tamper-proof audit claim. A fresh report is needed to resume after withdrawal.
- **Visual direction:** Warm cream, plum/berry, teal and restrained ochre geometry respond to the participant's request. No traditional motifs are copied, no cultural-validation claim is made, and no new visual dependencies are introduced.
- **Limits:** Authenticated local community only, simulated institutions, English interface accepting written languages, no AI/SASL/digests/real integrations. Filesystem-level administrators can access unencrypted demo history. Example Payments can receive a simulated queued snapshot but lacks a seeded representative; the demo response journey uses the bank/mobile accounts. These are explicit bounded-demo choices, not production guarantees.

## D008: One original experience with explicit approval of a derived community version

- **Date:** 10 November 2026 (Africa/Johannesburg); refinement begun 9 November.
- **Status:** Participant authorised the Milestone 1 UX/refinement request; no Milestone 2 or external actions approved.
- **Decision:** Keep the current stack, accounts and databases. Use a four-step reporting flow and plain-language audience choices over the existing independent institution/community permissions. For community sharing, copy the original deterministically, let the contributor edit it and require approval bound to SHA-256 digests of both source narrative and community text. Record approval time and report version on the server.
- **Rationale:** Contributors should tell their experience once. Copying is predictable and introduces no AI dependency or false redaction guarantee. Exact-content binding prevents approval for an earlier original or proposed version being silently reused after edits. Native controls and expandable language choices reduce visual density without a new component dependency.
- **Compatibility:** Preserve existing rows and keys; optional approval metadata defaults to unapproved on reading legacy records. Legacy text and sharing preferences remain visible. Original changes or community-text edits require reapproval, or community sharing must be disabled before saving. Existing optimistic version checks remain in force; no reset or bulk rewrite.
- **Boundary:** Approval covers the community text, not public use of report title/metadata or private originals/contact details. Institution-specific preferences remain independently enforced, including distinct roles for one organisation. No publication or delivery is implemented. Moderator review and exact recipient-specific institutional disclosure still belong to later authorised work.
- **Limits:** A digest binds content, not comprehension or anonymity. This is not a complete immutable consent history. The interface remains English, written languages can be mixed, and SASL video/automated interpretation remain unavailable. No additional product decision is needed to complete this refinement; Milestone 2 still requires approval.

## D007: Build the participant's connected reporting journey in gated milestones

- **Date:** 9 November 2026 (Africa/Johannesburg).
- **Status:** Participant approved the refined proof-of-concept plan and authorised Milestone 1 implementation, dependencies and local tests only. The preceding written planning and this implementation use Default Mode, not formal Plan Mode.
- **Decision:** One Next.js/React/TypeScript application under `prototype/`, with a small built-in SQLite module and generated local demo accounts. Milestone 1 provides private reporting; later gates cover the connected reviewed community/institutional-response journey, one bounded AI capability with fallback, and final verification. Stop for review after Milestone 1.
- **Rationale:** A single application avoids a separate API service, ORM or authentication provider while exercising actual server permissions and persistence. Node 22.23.4 is pinned; its SQLite API remains experimental and is not represented as a production guarantee. Prototype dependencies and locks are separate from the survey.
- **Privacy:** Private original, separate community text and institution relationship-specific disclosure permissions. Many institutions and multiple roles per institution are supported. Institution relevance is not responsibility; even consented private reports remain invisible to institution accounts in Milestone 1. Ownership comes from server sessions, never request fields. Fictional accounts and data only; no live institutions, AI service, media intake or publication.
- **Consequences:** The original D001/D002/D005 no-implementation statements describe earlier phases, superseded only within this approved local scope. Public deployment, external services/accounts, commits and Milestone 2 need separate approval. SASL media and notification cadence are phased enhancements; unsupported language/media capabilities must be explicit.

## D001: Research and capstone selection remain separate

- **Date:** 9 November 2026 (Africa/Johannesburg).
- **Status:** Accepted by the participant in the repository setup approval.
- **Decision:** Maintain digital banking confidence and community cybersecurity research as an exploratory body of work. Leave final capstone selection undecided and participant-led.
- **Rationale:** The specific capstone brief concerns African storytelling. The onboarding deck provides broader project examples and development quality criteria; it does not override the specific brief. Research into digital confidence and cybersecurity awareness remains valuable independently, even if it is not selected for the final capstone. Keeping the two decisions separate avoids presenting thematic similarity as proof of capstone eligibility.
- **Consequences:** No automatic claim of capstone fit, no selected storytelling track and no capstone application at this stage. Original capstone ideas must come from the participant. Codex may support subsequently authorised work within the selected scope but must not generate the original idea.
- **Evidence:** `Capstone Brief.pdf`, pages 1–3; `Codex Hackathon Program - Onboarding Deck.pptx`, slides 6 and 8; participant's setup request and explicit approval. See [project context](project-context.md#source-record).
- **Revisit when:** The participant supplies a direction and explicitly decides how, or whether, this research contributes to a capstone that meets the specific brief.

## D002: Start with a minimal local repository

- **Date:** 9 November 2026 (Africa/Johannesburg).
- **Status:** Accepted by the participant in the repository setup approval.
- **Decision:** Create nine documentation and configuration files in a dedicated `sa-digital-confidence-lab` directory and initialise a local Git repository on `main`. Initially leave the changes uncommitted for review. The participant subsequently approved the first commit, subject to final review, on 9 November 2026.
- **Rationale:** The current stage needs a clear scope, safe file handling and an auditable development record. No application framework, package dependency, survey tool or hosting choice is needed yet.
- **Consequences:** Source documents stay in the parent workspace. Private material is excluded by documented storage conventions and ignore rules. No remote, global Git configuration change or application implementation is part of this setup. Future external actions require approval under `AGENTS.md`.
- **Revisit when:** A subsequent authorised task establishes concrete implementation requirements.

## D003: Separate survey content from guarded draft creation

- **Date:** 9 November 2026 (Africa/Johannesburg).
- **Status:** Approved in the survey implementation plan.
- **Decision:** Keep authoritative survey content in a structured Markdown JSON block, generate a separate Apps Script specification, and use standalone FormApp with a lock and persistent creation state. Use local clasp 3.4.1 for eventual approved upload and the editor for execution.
- **Rationale:** Content can be reviewed without changing execution logic. Unpublished creation and conservative recovery prevent normal reruns and ambiguous failures from creating duplicate forms. No web deployment, custom OAuth client, response API or extra runtime dependency is needed.
- **Consequences:** Reruns verify rather than repair. Partial state and content changes require human recovery; copying projects or clearing properties defeats the duplicate guard. Checkbox validation and Workspace access need manual verification because readable API coverage is incomplete. See the [survey guide](../survey/README.md).
- **Open issue:** Installation succeeded, but the dependency audit returned 8 affected-package findings (2 high, 6 moderate). These remain unresolved. The participant subsequently chose editor-only deployment (D006); clasp is not required for offline tests or for the FormApp runtime.

## D004: Clarify Other and Not sure responses

- **Date:** 9 November 2026.
- **Status:** Explicitly approved by the participant during Plan Mode refinements.
- **Decision:** Use native write-in Other for Q1, Q2, Q3 and Q6. Replace Q3's fixed Other / Not sure with a fixed Not sure option and native Other. Keep Q3's maximum of two and all other question wording.
- **Rationale:** The former combined option could not distinguish uncertainty from a different observed difficulty. Write-in Other allows that difficulty to be described.
- **Consequences:** Q3 has eight fixed choices plus native Other. Fixed choices retain their order; Google controls native Other's placement, including its move to the end of Q6. Other is not duplicated as a literal fixed choice. Not sure is not made exclusive because no exclusivity rule was approved.

## D005: Quality and human oversight govern delivery

- **Date:** 9 November 2026.
- **Status:** Explicitly approved participant instruction.
- **Decision:** Prioritise reliable architecture, meaningful testing, rigorous evidence-based research, investigation of competing explanations and contradictory evidence, privacy, security and honest activity reporting. Bring genuine scope-quality-time conflicts to the participant.
- **Rationale:** The 11 November deadline is manageable and does not justify rushing or cutting corners. Simplicity should remove unnecessary complexity without removing safeguards or evidence.
- **Consequences:** Local development approval does not authorise Google authentication, upload, creation, publication, sharing, milestone commits or GitHub operations. Each applicable checkpoint remains explicit; no capstone idea generation or prototype development is included.

## D006: Deploy through the Apps Script editor

- **Date:** 9 November 2026.
- **Status:** Explicit participant decision, followed by participant-confirmed testing, approval and publication/sharing.
- **Decision:** Copy the reviewed Code.gs, generated SurveySpec.gs and appsscript.json into the existing standalone editor project. Use editor execution and targeted recovery of the same saved form. This supersedes D003's planned clasp upload route.
- **Rationale:** Complete the existing survey without further clasp dependency investigation or package changes.
- **Consequences:** Retain the existing dependency files and audit evidence; do not treat editor deployment as resolving those findings. Runtime configuration and debugging remain in source. Publication, access controls and presentation are manual steps, not automated by the generator. Participant-supplied logs and release confirmation are evidence; no independent live-source comparison or respondent-data access by Codex is claimed.
