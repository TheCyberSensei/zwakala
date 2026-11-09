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
