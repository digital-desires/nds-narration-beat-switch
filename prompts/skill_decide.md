# Skill — Select Narrator Directive

## Inputs

1. **PRIMARY — USER INTENDED ACTION (UNRESOLVED):** the latest user message states what the user intends, attempts, says, or seeks to do. This is the beat the narrator must process next.
2. **SECONDARY — LAST ROUND (CONTEXT):** the immediately preceding user/assistant exchange establishes the scene state in which the primary intention occurs.

The primary intention controls the classification. Use the secondary last round to understand its meaning, situation, tone, stakes, and continuity—never to replace it with the previous beat.

## Decision process

1. Identify exactly what the user is stating an intention to do. Do not treat it as accomplished or resolved.
2. Establish the immediate scene state from the secondary context.
3. Decide what the narrator's next reply principally needs to adjudicate, answer, or render.
4. Choose the label whose directive will best help the narrator process that intention in this scene.
5. If primary and secondary suggest different modes, follow the primary unless its meaning depends on the established context.

## Selection rules

- Match the response need, not isolated keywords or the setting alone.
- Use only evidence present in the supplied primary and secondary inputs.
- Specialty labels require a clear fit.
- Be conservative with sexual and altered-perception labels; require clear evidence in the primary intention and immediate context.
- If signals are mixed or no single specialty clearly dominates, choose `generic`.
