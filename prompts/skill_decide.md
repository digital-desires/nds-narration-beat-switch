# Skill — Decide Beat Style

## Inputs

1. **CURRENT USER ACTION (primary)** — strongest signal. This declares the next beat.
2. **LAST ROUND (context)** — previous user message + previous assistant reply. Use only for continuity and tie-breaks.

## Decision rules

- Weight the current user action first.
- Use the last round when the user is vague ("I wait", "continue", "…") or when the action clearly continues an unfinished beat (still mid-fight, still mid-heist, still mid-intimacy).
- Pick exactly one label from the classifier index.
- Specialty labels require a clear fit. If two specialties compete and neither wins cleanly, choose `generic`.
- Sexual intent → `heat`. Non-sexual care/aftermath → `ember`.
- Violence already landing → `clash`. Violence pending / held breath → `wire`.
- Do not narrate. Do not explain your reasoning in the output.
