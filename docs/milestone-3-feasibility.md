# Milestone 3: local AI feasibility

Assessment: 10 November 2026, Default Mode. **Closed by participant decision: retain manual tagging; do not implement local inference or paid APIs.** No AI inference, model installation, dependency change or application modification was performed.

The assessment below is preserved as historical evidence. The participant judged spare resources insufficient for a reliable demonstration and confirmed there is no approved API budget. AI-assisted institution association is a potential future enhancement only. Milestone 4 now covers final verification and submission preparation.

## Protected baseline

The participant approved and personally tested Milestones 1–2. Local checkpoint:
`3feabe7bfa5db0154e571b73963c572a3adc9604` — `feat: checkpoint approved reporting-to-response prototype`.

It contains 33 reviewed prototype/application/documentation files. Existing research changes and `CODEX_WORKSPACE_HANDOVER.md` were deliberately left uncommitted and unchanged. Survey code and local demo stores/keys were preserved. No remote or push.

## Observed environment

| Item | Observation |
| --- | --- |
| Computer/OS | Dell OptiPlex 7050, Windows 10 Pro |
| CPU | Intel Core i5-6500, four cores/four logical processors |
| Memory | Approximately 8 GB installed; 1.28 GiB available at inspection (a changing snapshot) |
| Graphics | Intel HD Graphics 530; no discrete accelerator reported |
| Disk | Approximately 99 GiB free on C: |
| Application | Node 22.23.4, npm 12.2.2, existing Next/React/TypeScript/SQLite stack |
| Local inference | No Ollama, llama-cli or lms command found; no Ollama/llama-server/LM Studio process found; inspected standard Ollama, Hugging Face and LM Studio model-cache locations absent |

The initial sandboxed Windows hardware query was denied. A read-only elevated CIM query succeeded. No system configuration was changed. These scoped checks do not prove that no model exists anywhere on the machine.

## Focused candidate and recommendation

One candidate was examined: **Qwen2.5-0.5B-Instruct Q4_K_M with a portable llama.cpp Windows CPU runtime**. The official model directory lists this quantisation at **491 MB**, under Apache-2.0. llama.cpp documents x86 CPU inference, quantisation and prebuilt binaries. This avoids commercial API keys, subscriptions and external inference, but requires new model/runtime downloads and additional working memory.

Sources inspected: [official model card](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF), [official model files](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/tree/main), [llama.cpp documentation](https://github.com/ggml-org/llama.cpp). No weights or binaries downloaded. The runtime archive version/size/checksum have not been selected or verified; an approved trial must pin and verify artifacts before use.

**Recommendation at assessment time: retain the approved manual application for submission. The participant has now accepted this recommendation and declined the experiment.** CPU inference is technically plausible, not demonstrated here. Available memory is tight alongside the app/browser/Codex, and model memory exceeds the weight-file size. No latency, peak-memory or extraction-quality result is available. A small model's reliable interpretation of indirect references, isiZulu or mixed language cannot be assumed. No claim that this hardware makes all local AI impossible.

The model download is substantial under the participant's explicit approval boundary. There is no already-installed inference resource allowing Stage B to proceed without it. No free-trial service is proposed. “No API fee” does not remove download, storage, electricity or setup costs.

## What actually exists

The application has **manual curated institution/relationship selection** and **rule-based related-report matching**. It does not currently have an alias-based narrative-to-institution tagger. Those are different tasks; the related-report matcher is not a valid extraction benchmark. No deterministic selector has been relabelled as AI.

For a separately authorised future trial (not this submission), first pin a portable runtime/model outside tracked source, then measure actual CPU inference before integrating anything. Keep inference optional and local, with bounded input/output/time, manual fallback and explicit contributor accept/correct/reject. Validate directory IDs, relationship enums, exact supporting passages and unsupported claims; quoted text alone does not prove the relationship is correct. No sharing or permission change may follow automatically.

A small separately held-out fictional evaluation would compare model extraction against a clearly labelled alias/rule extractor and manual tagging. Cover explicit names, impersonation, indirect/multiple/ambiguous/unknown organisations, English, isiZulu and mixed text. Report correct/missed/false associations, abstentions, editing effort, latency and failures. This evaluation was **not run** because no model is installed. Do not invent scores or multilingual claims.

## Validation and remaining work

Checkpoint regression: **49 automated tests passed; TypeScript passed**. Prior Milestone 2 evidence remains 21 foundation + 10 connected-journey browser checks and a passing production build. These were not rerun in this stage because executable code/dependencies did not change. Git staged whitespace checks and credential/generated-file reviews passed.

No new model/runtime dependency exists. The working manual reporting-to-response journey is unchanged. Feasibility documentation remains separate from the baseline checkpoint.

Milestone 4 now authorises review of the excluded research/handover files, repository hygiene/reproducibility checks and a fictional demonstration guide. Repository creation/push still need separate approval. State the AI limitation honestly. Participant-supplied deadline: midnight Wednesday, 11 November 2026, South African time.
