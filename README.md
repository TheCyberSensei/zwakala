# South African Digital Confidence Research Lab

Exploratory research into digital banking confidence, financial technology accessibility and community cybersecurity awareness in South Africa.

This repository supports participation in the Andela × OpenAI Codex Accelerator, Cape Town Cohort 2026. The participant has approved a proof of concept based on their original community digital-safety reporting idea. No official endorsement or institutional participation is implied.

## Current stage

The approved survey has an Apps Script generator, offline tests and a participant-confirmed published Google Form. The participant deployed through the Apps Script editor, supplied successful debugging/verification logs, and confirmed testing, approval and sharing. Codex has not independently inspected the published form or accessed responses. The [local prototype](prototype/README.md) now implements Milestones 1–2: private fictional reporting, exact audience approvals, moderator review, explained candidate relationships, qualified community information and simulated institutional notification/response with contributor follow-up. Later milestones require review; this is not a deployed reporting service or evidence of effectiveness.

The research begins with participant-reported observations that some people need assistance using banking applications and ATMs. The extent, causes and consequences remain questions for investigation. See [project context](docs/project-context.md) for the research scope and evidence boundaries.

The specific capstone brief focuses on African storytelling. Digital confidence research does not automatically satisfy that brief. The [initial architectural decision](docs/decisions.md#d001-research-and-capstone-selection-remain-separate) explains this separation.

Submission deadline: **11 November 2026**, as supplied by the participant. The participant specifies midnight on Wednesday, 11 November 2026, South African time.

## Repository layout

```text
sa-digital-confidence-lab/
├── README.md
├── AGENTS.md
├── .gitignore
├── docs/
│   ├── project-context.md
│   ├── decisions.md
│   └── codex-development-log.md
├── survey/
│   ├── README.md
│   ├── form-spec.md
│   ├── Code.gs
│   ├── SurveySpec.gs
│   ├── build-spec.cjs
│   ├── appsscript.json
│   ├── package.json
│   ├── package-lock.json
│   ├── .claspignore
│   └── tests/survey.test.cjs
├── research/
│   └── README.md
└── prototype/
    └── README.md
```

- [AGENTS.md](AGENTS.md) defines instructions for Codex working in this repository.
- [Development log](docs/codex-development-log.md) records work performed, approvals and actual verification results.
- [Survey](survey/README.md) documents local validation, execution approvals and manual checks. [Research](research/README.md) indexes the completed assessments; [prototype](prototype/README.md) documents local setup, implementation and acceptance gates. The layout above is the original foundation; consult those directory guides for current contents.

Use Node.js 22 or later for local survey generation and tests; these require no installed packages. Clasp 3.4.1 remains a pinned development dependency with unresolved audit findings documented in the survey README. The participant chose editor-only deployment, which does not use clasp. The runtime script has no external library dependency.

## Privacy and security

Keep respondent identities, raw responses, private interviews, recordings and transcripts outside this repository wherever possible. Do not collect banking credentials, PINs, one-time passwords or account identifiers for this setup.

If local private working material is later authorised, designated ignored locations include `private/`, `survey/responses/`, `survey/exports/` and `research/private/`. These directories are not created by this setup. The ignore rules also cover credentials, environment files, Apps Script authentication files, local configuration, dependency directories and caches.

Ignore rules are filename-based safeguards. They do not encrypt files, identify sensitive content or remove files already tracked by Git. Review every intended commit; never use force-add to bypass privacy exclusions.

Explicit approval is required before external account access, new uploads or form creation, publication/sharing, deletion, remote repository creation or pushing content. The participant performed and approved this survey's deployment and publication, and authorised the survey milestone commit subject to review. These approvals do not authorise unrelated external actions or future commits.

## Review local survey work

Run these commands from this repository directory:

```powershell
git status --short --branch --untracked-files=all
git diff --check
git diff
git remote
npm --prefix survey test
```

Read new untracked files as well as the diff before approving a commit; Git's normal diff omits untracked files. Stage explicit reviewed paths only after approval. The initial commit is `f457f72999784886be512d9bc133721d81d97fd6`.

Git requires a commit author identity. If none is configured, set `user.name` and `user.email` with `git config --local` using your own chosen values. Do not change global configuration for this project.

## Next milestone

Milestones 1–2 are participant-tested and approved. Milestone 3 begins with a local Git checkpoint and zero-cost local-AI feasibility assessment; substantial downloads or new runtime setup require separate approval. No external AI service or credential has been introduced. The participant has confirmed the survey is tested, approved and shared. Keep responses outside Git; any response access or analysis needs an explicitly agreed scope. Draft verification/recovery functions intentionally reject published forms and should not be rerun against the live survey.
