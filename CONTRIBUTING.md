# Contributing to V3

Read [AGENTS.md](AGENTS.md) in full before each task. It is the user-supplied V3 specification. Only one coding agent and one build step per prompt are allowed.

1. Work on the current V3 step, without copying V2 application code.
2. Preserve the buildless root-level structure and dependency-free runtime.
3. Keep the engine pure and every numeric input explicitly validated when forms arrive.
4. Label placeholders, missing data and illustrative rules honestly.
5. Run `node --test tests/` and `npm run check`.
6. Open the app, check relevant routes, console errors and mobile behavior.
7. Commit with `step N: …`, then stop until the next prompt.

The active release is the complete Studio prototype on `codex/terraplan-v3-studio`. The current owner request expands the catalogue to fifteen crops and publishes the interactive guide on Pages. Work in focused `codex/` branches. Crop additions need sources, units, scope and explicit assumptions; do not mark them verified merely because references exist.

Code contributions must not imply NASA affiliation or agricultural validation. Changes to formulas need an explicit source, units, limitations and meaningful tests. Do not commit secrets, private hosting configuration or real user profiles.
