<!-- v0.1.2 — 2026-09-28 -->
# Changelog

## 2026-09-28 — Narrow startup exclusion
- Restrict picker suppression to the exact `SillyTavern System` character name.
- Real characters can open the picker even while SillyTavern is still resolving their character/group IDs.
- Files: `src/ui.js`, `index.js`, `manifest.json`.

## 2026-09-28 — Suppress the startup cartridge picker
- Do not open the new-chat cartridge picker while no real character or group is selected.
- Close a picker already on screen if SillyTavern returns to its startup placeholder state.
- Files: `src/ui.js`, `index.js`, `manifest.json`.

## 2026-09-28 — Ignore the startup system character
- Skip Beat Switch classification while SillyTavern's default `SillyTavern System` character is active.
- Clear stale Beat Switch variables during that startup state so no prior character capsule leaks into it.
- Files: `src/inject.js`, `index.js`, `manifest.json`.
