# Development decisions

Record meaningful decisions with their date, status, rationale and consequences. Do not treat hypotheses as findings or record approvals that have not occurred.

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
