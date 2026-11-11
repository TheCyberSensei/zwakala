# ZWAKALA — GitHub publication guidance

The reviewed source is public at [TheCyberSensei/zwakala](https://github.com/TheCyberSensei/zwakala), owned by the participant's confirmed personal account. Publishing source is separate from deploying the application: the app remains loopback-only and must not be hosted as a real incident-reporting service.

## Current submission contents

Include the working prototype and locked dependencies, tests, README, AGENTS, development evidence/decisions, demonstration and verification guides, and relevant dated public-source research. Historical research proposals are not an implemented feature list.

The earlier banking-staff questionnaire was archived outside this repository and removed from its current tree on 11 November 2026. It did not implement or validate ZWAKALA. Prior published commits retain it historically; no history rewrite is intended. See [D011](decisions.md#d011-separate-the-banking-survey-from-the-final-capstone).

Exclude generated demo keys, SQLite databases/sidecars, sessions, private narratives, response exports/interviews, environment files, OAuth credentials, dependencies/build caches, recordings and local archives. The personal `CODEX_WORKSPACE_HANDOVER.md` stays local-only. Original accelerator PDF/deck files are not redistributed. No runtime AI, model weights or paid-service configuration is included.

## Next update — approval required before pushing

The personal-introduction/script refinement and survey-removal commit is local for participant review. The earlier presenter-guide commit may also be ahead of origin. Review the complete outgoing range, not just the latest commit:

```powershell
git status --short --branch
git remote -v
git log --oneline origin/main..main
git diff --stat origin/main..main
git diff origin/main..main
git diff --check origin/main..main
git ls-files
```

Confirm a clean tree, branch `main`, and the existing origin `https://github.com/TheCyberSensei/zwakala.git`. Verify the survey archive separately and never stage it. Preserve existing author metadata; any future commit-email change requires its own instruction. No licence has been selected; public visibility alone is not an open-source licence.

Only after the participant approves this update:

```powershell
git push origin main
```

Do not create another repository, replace origin, force-push or rewrite history. If Git reports unexpected remote commits or account/ownership errors, inspect and resolve the specific issue rather than overwriting. Authenticate through GitHub/Git Credential Manager; never put tokens in source, URLs, scripts or chat.

After an approved push, verify the remote commit and current file tree, README/diagram and documentation links. Confirm the current tree has no survey folder, archive, databases or keys. Historical commits will still contain the survey. Then submit the repository link with a separately reviewed demonstration recording; neither source publication nor a fictional demo authorises real incident collection.
