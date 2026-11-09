# South African Digital Confidence Research Lab

Exploratory research into digital banking confidence, financial technology accessibility and community cybersecurity awareness in South Africa.

This repository supports the Andela × OpenAI Codex Accelerator, Cape Town Cohort 2026. The final capstone direction has not been selected. Original capstone idea generation belongs to the participant.

## Current stage

Repository setup and documentation only. No survey or application has been implemented here. No research findings are established by this setup.

The research begins with participant-reported observations that some people need assistance using banking applications and ATMs. The extent, causes and consequences remain questions for investigation. See [project context](docs/project-context.md) for the research scope and evidence boundaries.

The specific capstone brief focuses on African storytelling. Digital confidence research does not automatically satisfy that brief. The [initial architectural decision](docs/decisions.md#d001-research-and-capstone-selection-remain-separate) explains this separation.

Submission deadline: **11 November 2026**, as supplied by the participant. The submission time has not been confirmed.

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
│   └── README.md
├── research/
│   └── README.md
└── prototype/
    └── README.md
```

- [AGENTS.md](AGENTS.md) defines instructions for Codex working in this repository.
- [Development log](docs/codex-development-log.md) records work performed, approvals and actual verification results.
- [Survey](survey/README.md), [research](research/README.md) and [prototype](prototype/README.md) contain placeholders for later authorised work.

No application runtime, package installation or external account is required for this stage. Git is the only required tool for version control.

## Privacy and security

Keep respondent identities, raw responses, private interviews, recordings and transcripts outside this repository wherever possible. Do not collect banking credentials, PINs, one-time passwords or account identifiers for this setup.

If local private working material is later authorised, designated ignored locations include `private/`, `survey/responses/`, `survey/exports/` and `research/private/`. These directories are not created by this setup. The ignore rules also cover credentials, environment files, Apps Script authentication files, local configuration, dependency directories and caches.

Ignore rules are filename-based safeguards. They do not encrypt files, identify sensitive content or remove files already tracked by Git. Review every intended commit; never use force-add to bypass privacy exclusions.

Explicit approval is required before publishing surveys, sharing data, deleting resources, accessing external accounts, creating remote repositories or pushing content. The repository remains local; the participant has approved the initial commit subject to final review.

## Review and initial commit

Run these commands from this repository directory:

```powershell
git status --short --branch --untracked-files=all
git ls-files --others --exclude-standard
git remote
Get-Content README.md, AGENTS.md, .gitignore, docs/project-context.md, docs/decisions.md, docs/codex-development-log.md, survey/README.md, research/README.md, prototype/README.md
```

Review the nine files, then stage them explicitly and inspect the staged content:

```powershell
git add -- README.md AGENTS.md .gitignore docs/project-context.md docs/decisions.md docs/codex-development-log.md survey/README.md research/README.md prototype/README.md
git diff --cached --check
git diff --cached
git commit -m "chore: initialise digital confidence research repository"
git status --short --branch
```

Git requires a commit author identity. If none is configured, set `user.name` and `user.email` with `git config --local` using your own chosen values. Do not change global configuration for this project.

## Next milestone

Review the research scope and data-handling requirements before authorising survey design or implementation. Capstone selection remains a separate participant decision governed by the storytelling brief. No implementation milestone or technology stack has been selected.
