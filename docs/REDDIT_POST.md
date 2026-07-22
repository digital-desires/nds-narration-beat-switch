<!--
  Ready-to-paste draft for r/SillyTavernAI.
  Not auto-posted anywhere — copy the title + body below into Reddit's post
  composer yourself. Upload docs/banner.png as the post's lead image and
  docs/capsule-comparison.png as a second image in the gallery (Reddit image
  posts support multiple images per post).

  Before posting: replace docs/screenshots/*.png with real captures if you
  want a third "actual UI" image in the gallery — optional, the post works
  without it.
-->

## Suggested flair
Extensions

## Title

I got tired of every preset writing every scene the same way, so I built a beat classifier that swaps the writing instructions on the fly [Extension]

## Body

Every chat-completion preset I tried has the same problem: it's one giant static instruction block, active for every message, whether you're mid-fight, mid-conversation, or just buying rope at a shop. The model can't tell those apart because *you never told it they're different* — it's the same rules stacked on top of each other for the entire session.

So I built **NDS: Narration Beat Switch** — a small SillyTavern extension that reads the current beat every turn (combat, negotiation, dread, aftermath, downtime, whatever) with a cheap classifier call, then hands the model **one small, focused instruction capsule** for that specific beat instead of the whole rulebook at once.

**Same trigger, three completely different results, depending on which template is active:**

[[ INSERT IMAGE HERE: upload docs/capsule-comparison.png via Reddit's image picker — same "violence happening now" trigger; Literary Prose gives war-dispatch prose, Genre Chameleon gives pulp sword-and-sorcery, D&D Mechanics gives actual 5e turn structure with real DCs ]]

### Why this is more than "another style preset"

The classifier layer doesn't know or care what's *in* a capsule. It ships with four templates to prove it:

- **Literary Prose** — restrained, craft-focused registers per beat (war-reporter dispatch for combat, Shirley-Jackson-style dread, Didion-flat grief). This is the daily-driver one.
- **D&D Mechanics** — actual 5e-adjacent rules adapted for narrated play: real DC ladders, action economy, death saving throws, rest mechanics, and a tiered NPC stat lookup so the model can improvise a balanced monster instead of guessing numbers.
- **Genre Chameleon** — identical beats, deliberately mismatched genre lens (noir interrogation instead of diplomacy, cosmic horror instead of generic dread, mock-epic chronicle voice for grocery shopping). Mostly built to prove the point, but it's genuinely fun.
- **Legacy v1** — the original lighter-touch capsule set, kept for anyone who prefers terser instructions.

You can also just write your own template from scratch — there's a standalone desktop editor (Python, no dependencies beyond stdlib) that reads/writes the same template file the extension uses, so you don't have to fight a tiny browser textarea to write a 10-capsule template.

### The honest setup cost

The classifier needs an OpenRouter API key — it's a separate, cheap call (small model, ~64 output tokens) that runs before your real generation, not instead of it. Everything else is free/local. Full details and install steps are in the repo.

Repo (MIT, install steps + template docs): **https://github.com/digital-desires/nds-narration-beat-switch**

Happy to answer questions about how the classifier prompt is built or how the template format works — it's plain text, not JS, so it's editable without touching any code.
