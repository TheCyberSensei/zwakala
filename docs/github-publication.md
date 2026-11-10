# ZWAKALA — GitHub publication preparation

**Prepared locally; no remote repository or push authorised or performed.** Publishing source is separate from deploying the application. The app remains loopback-only and must not be hosted as a real incident-reporting service.

## Submission contents

Include the working prototype and locked dependencies, tests, root README, AGENTS, development evidence/decisions, demonstration and verification guides, the dated public-source research reports and the already-committed survey implementation. Research documents describe their historical stage; current behaviour is defined by the root/prototype README.

Exclude generated demo keys, SQLite databases/sidecars, sessions, private narratives, response exports/interviews, environment files, OAuth credentials, dependencies/build caches and recordings. The outdated `CODEX_WORKSPACE_HANDOVER.md` remains a local-only continuity file, with personal workspace details and superseded instructions. It is not needed by judges. Original accelerator PDF/deck files are not redistributed.

No runtime AI, model weights or paid-service configuration is included. The survey's unused clasp dependency has documented historical audit findings; do not install it to run the prototype or offline survey tests.

## Owner decisions before publication

- Approve the GitHub account/organisation, repository name and visibility. Proposed name: `zwakala`. The existing local directory and internal package identifiers remain unchanged.
- Review the exact local commits and Git author metadata; publication exposes commit history as well as current files.
- Choose reuse/licensing terms if an open-source licence is desired. None has been selected or granted by Codex; a public repository alone is not an open-source licence.
- Confirm that the dated research and fictional demonstration material may accompany the submission.

## Exact publication steps — only after approval

1. Review locally from the repository root:

   ```powershell
   git status --short
   git log --oneline --decorate -5
   git diff --check
   git ls-files
   git remote -v
   ```

   Confirm the intended branch is `main`, the intended commits are present, no unexpected changes remain, and no secrets/private data are tracked. Review ignored contents separately; never force-add them.

2. Sign in to the approved GitHub account yourself, or separately authorise Codex account access. Create an **empty** repository with the approved name/visibility. Do not initialise it with a README, licence or .gitignore because local history already exists.

3. Copy its HTTPS URL. From the local repository root, run these commands only after publication approval:

   ```powershell
   $repositoryUrl = Read-Host 'Paste the approved empty GitHub repository HTTPS URL'
   git remote add origin $repositoryUrl
   git remote -v
   git push -u origin main
   ```

   Verify `origin` before pushing. If an origin already exists, inspect it and stop rather than replacing it blindly. Authenticate through GitHub/Git Credential Manager; never place a token in source, a URL, a script or a chat.

4. Inspect the published README, diagram, relative links, research index and file tree. Confirm no databases/keys/data files appear. Clone to a fresh directory and follow the README setup before sharing the repository link with judges.

5. Submit the approved repository URL and separately reviewed demonstration recording. Publishing the repository does not publish the application or authorise real incident collection.

No force push, history rewrite, external account access or automatic deployment is part of this preparation.
