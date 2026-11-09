# Codex development log

Record significant development phases concisely and factually. Dates use Africa/Johannesburg. Include actual commands, verification results and human decisions; never include credentials or private respondent data. Do not invent commits or describe a planned check as passed.

## Activity 001: Initial read-only assessment

- **Date:** 9 November 2026.
- **Task:** Inspect the environment and supplied accelerator documents; propose a minimal, secure repository before requesting permission to create files.
- **Codex features used:** Default-mode conversation, written planning, shell execution through `functions.exec`, parallel independent read-only checks, bundled-runtime discovery, and PDF and Presentations skills for source-text inspection. **Formal Plan Mode was not used.** A written plan was presented, followed by an explicit human approval checkpoint; these must not be described as formal Plan Mode.
- **Files created or modified:** None. The assessment did not create project files, initialise Git, modify the source documents or install dependencies.
- **Commands and tools executed:** `Get-Location`; `Get-ChildItem -Force`; `rg --files -g AGENTS.md` with dependency/build exclusions; `Test-Path` and `Get-Content` checks for applicable ancestor instructions; `git --version`; `git rev-parse --show-toplevel`; `git status --short --branch`; `git rev-parse --is-inside-work-tree`; skill-file reads; `mcp__codex_app__load_workspace_dependencies`; and an inline Python script run with `-B` using `pypdf`, `zipfile` and XML parsing to extract the PDF pages and presentation slide text without writing extraction files.
- **Verification and actual results:** Git reported `2.56.0.windows.4`. The workspace listing showed `Capstone Brief.pdf` and `Codex Hackathon Program - Onboarding Deck.pptx`. No applicable `AGENTS.md` was found. Git inspection reported that the workspace was not a repository. Text from all 3 PDF pages and 12 presentation slides was reviewed. No application tests or ignore-rule checks were run in this phase.
- **Planning outcome:** Proposed a dedicated repository with three root files, three documentation files and placeholder READMEs in `survey/`, `research/` and `prototype/`. Identified exclusion requirements for secrets, authentication files and private research, plus approval boundaries for external and destructive actions. Kept storytelling capstone selection separate from exploratory banking research.
- **Human decisions and approvals:** The participant required a read-only assessment and approval before file creation. Codex presented the structure, Git/security approach, draft agent instructions and next milestone, then stopped for approval. In the subsequent message, the participant approved implementation, accepted the distinction between the brief and onboarding examples, and requested this assessment record plus decision D001.
- **Problems and resolutions:** The first text-extraction attempt failed because the Windows output encoding could not represent a PDF character. The script was rerun with UTF-8 standard output and succeeded. The no-repository Git errors and no-match file search were expected assessment findings.
- **Relevant Git commits:** None; no repository or commit was created during the assessment.

## Activity 002: Approved repository setup

- **Date:** 9 November 2026.
- **Task:** Implement the approved nine-file structure, local Git setup, agent instructions, privacy exclusions and development documentation.
- **Codex features used:** Default-mode execution of the approved plan, read-only preflight checks, patch-based file creation, shell-based Git validation and documentation drafting guided by the participant's writing style. The writing-style skill was read; no external account was accessed for style samples. No subagents or formal Plan Mode were used.
- **Files created:** `README.md`, `AGENTS.md`, `.gitignore`, `docs/project-context.md`, `docs/decisions.md`, `docs/codex-development-log.md`, `survey/README.md`, `research/README.md`, `prototype/README.md`.
- **Commands and tools executed:** `Get-ChildItem`, `Test-Path` and `Get-Content` for preflight, instructions and final content review; `apply_patch` for the nine approved files and log/ignore refinements; `git init --initial-branch=main`; `git check-ignore --no-index --verbose --non-matching -z --stdin` through inline Python; `git status --short --branch --untracked-files=all` and its porcelain equivalent; `git remote`; `git ls-files --others --exclude-standard`; `git ls-files --cached`; `git rev-parse --show-toplevel`; `git symbolic-ref --short HEAD`; and `git rev-parse --verify --quiet HEAD`. Validation used Python's standard library and synthetic filenames through standard input; no sensitive sample files, validation script files or test dependencies were added.
- **Tests and actual results:** Git initialisation succeeded. Ignore checks passed for **106 unique sensitive/generated paths** (96 initially, then 10 additional secret/token filenames). All **13 safe paths** remained trackable after the refinements, including the nine intended files. Directory inspection found exactly nine project files plus Git metadata. UTF-8 decoding, non-empty files, final newlines, whitespace, merge-marker and local Markdown file-target checks passed. Final Git assertions confirmed the expected repository root, branch `main`, no commits, no remotes, an empty index and exactly nine untracked files. All nine files were read back for content review. No application tests apply because no application is implemented.
- **Human decisions and approvals:** The participant explicitly approved creation and Git initialisation, accepted the architecture, requested the assessment record and separation rationale, and required that all changes remain uncommitted. No remote creation, publication, data sharing, external account access or implementation was approved.
- **Problems and resolutions:** The request mentioned use of Plan Mode. The conversation actually remained in Default mode; this log records the written planning and approval checkpoint without inventing formal Plan Mode usage. During final review, ignore rules were extended to cover named secret configuration files and standalone access/refresh token JSON files; the initial checks had passed, but had not included those additional filenames.
- **Relevant Git commits at the end of this phase:** None; the initial changes were left uncommitted for human review. A subsequent activity records approval for the first commit.

## Activity 003: Final review and initial commit approval

- **Date:** 9 November 2026.
- **Task:** Review the nine approved files and prepare the initial commit with subject `chore: initialise digital confidence research repository`.
- **Codex features used:** Default-mode file review, shell commands, inline Python validation and targeted documentation patches. No formal Plan Mode was used.
- **Files modified:** `AGENTS.md`, `README.md`, `docs/decisions.md` and this log. Updated the earlier uncommitted-only instructions to reflect the participant's subsequent approval and aligned the README commit command with the requested subject. All nine approved files were reviewed and explicitly staged.
- **Commands and tools executed:** `Get-Content`; `git status --short --branch --untracked-files=all`; `git remote`; `git ls-files --others --exclude-standard`; `git ls-files --cached`; inline Python checks; `git var GIT_AUTHOR_IDENT`; `apply_patch`; `git add --` with the nine explicit paths; `git diff --cached --check`; `git diff --cached --stat`; and `git diff --cached --no-ext-diff --no-color`.
- **Tests and actual results:** The nine-file inventory, UTF-8 and whitespace checks passed. All 14 internal Markdown links, including heading anchors, resolved. Manual review and a targeted secret-pattern scan found no credentials or private respondent data. The staged whitespace check passed and the complete staged diff was reviewed. The earlier ignore-rule results remain recorded in Activity 002; `.gitignore` was unchanged in this phase. No remote was configured. No application tests apply at this stage.
- **Human decisions and approvals:** The participant explicitly authorised the initial commit subject to final review, specified its message and requested the resulting hash in the final report rather than a post-commit documentation edit. The participant subsequently supplied the commit author identity and explicitly approved repository-local configuration and continuation. Remote creation, pushing and survey implementation remain outside the authorised scope.
- **Problems and resolutions:** Git initially could not resolve an author identity. After the participant supplied it, `git config --local user.name` and `git config --local user.email` were set to the approved values. Local configuration reads and `git var GIT_AUTHOR_IDENT` confirmed the identity. Git also emitted LF-to-CRLF working-copy notices while staging; the staged whitespace check passed and no line-ending configuration was changed. No global Git configuration was modified.
- **Relevant Git commit:** This entry is prepared before committing. The resulting hash and clean-working-tree verification will be reported after a successful commit, without editing this file merely to insert its own commit hash.

## Future activity template

- **Date:**
- **Task:**
- **Codex features used:**
- **Files created or modified:**
- **Commands and tools executed:**
- **Tests performed and actual results:**
- **Human decisions and approvals:**
- **Problems encountered and resolutions:**
- **Relevant Git commits:** Record an existing hash, or state that no commit exists yet. A phase's own commit can be referenced in a subsequent entry; do not guess a hash before committing.
