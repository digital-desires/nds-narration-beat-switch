# Format Rules — Classifier Output

Return a single JSON object only. No markdown fences. No commentary.

Schema:

```json
{"style":"<label>"}
```

Allowed `style` values: exactly the labels listed in the Classifier Index
section of this prompt (exact spelling, lowercase), plus `none`.

`none` means: no specialty fits; the runtime will inject the fallback capsule
(the one marked `(fallback)` in the index).

Invalid JSON or unknown labels are treated as the fallback.
