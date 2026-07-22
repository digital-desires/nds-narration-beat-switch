<!--
  Ready-to-paste draft for r/SillyTavernAI.
  Not auto-posted anywhere — copy the title + body below into Reddit's post
  composer yourself. Upload docs/without-with.png as the post's lead image
  and docs/capsule-comparison.png as a second image in the gallery (Reddit
  image posts support multiple images per post).

  Before posting: replace docs/screenshots/*.png with real captures if you
  want a third "actual UI" image in the gallery — optional, the post works
  without it.
-->

## Suggested flair
Extensions

## Title

Every chat model writes every scene in the same voice — so I built an extension that reads the beat and swaps the writer, mid-session [Extension]

## Body

You know the thing where a quiet tavern conversation and a knife fight come out reading almost identical? Same rhythm, same "a surge of adrenaline," same emotional temperature no matter what's actually happening? That's not the model being bad — it's that nothing in your prompt ever told it the scene changed. It's one static instruction block for the entire session, whether you're negotiating or bleeding out.

I built **NDS: Narration Beat Switch** to fix that. It watches every message, decides what kind of beat just happened (combat, negotiation, dread, aftermath, downtime, whatever), and swaps in a small, focused set of writing instructions before the reply generates. You don't type anything different. You just play, and the prose changes underneath you.

[[ INSERT IMAGE HERE: upload docs/without-with.png — same combat moment, generic "surge of adrenaline" prose on the left vs. the actual Literary Prose capsule output on the right: "The axe came down. Kade got the shield up. Wood screamed and split to the boss." ]]

That's the default template (**Literary Prose**) doing its job — eleven different registers, one per kind of scene, picked automatically. It's genuinely the biggest quality jump I've gotten from any single change to my setup, and it costs nothing to use once you've got the extension in — no extra typing, no macros to remember.

### Then I realized the detector didn't care what it was dispatching

Swap the active template to **D&D Mechanics** and the *exact same beat-detector* now runs actual 5e-adjacent rules instead of prose style: real initiative order, stated ACs and DCs, a proper death-saving-throw sequence when someone hits 0 HP instead of the story just deciding they're fine, and a stat-lookup table so the model can improvise a balanced monster instead of guessing numbers. Walk out of combat and it's back to plain narration. It's a rules-literate co-DM that only shows up exactly when you need one.

Once I had two templates working, the actual point of the architecture clicked: it's not two features, it's one dumb, reusable dispatcher that doesn't know or care what's inside a capsule. So I built a third template, **Genre Chameleon**, that reuses the *same eleven beats* as Literary Prose but reskins every single one into a different genre — the same combat beat reads like pulp sword-and-sorcery, the same negotiation beat becomes a hardboiled noir interrogation. Nothing else changes. One dropdown.

[[ INSERT IMAGE HERE: upload docs/capsule-comparison.png — same "violence happening now" trigger, three templates, three completely different outputs (Literary Prose / Genre Chameleon / D&D Mechanics) ]]

### Building your own template

There's a standalone desktop editor for writing your own template from scratch — dark-themed, Python only, no dependencies. Pick a template (or start blank), fill in a label + one-line trigger + body per beat, hit Save, reload SillyTavern. That's the whole workflow — no code, no JSON by hand.

### The honest setup cost

The classifier needs an OpenRouter API key — it's a separate, cheap call (small model, ~64 output tokens) that runs *before* your real generation, not instead of it. We're talking cents, not a subscription. Everything else is free and local.

Repo (MIT, install steps + template docs): **https://github.com/digital-desires/nds-narration-beat-switch**

Happy to answer questions about how the classifier prompt is built or how the template format works — it's plain text, not code, so it's editable without touching a line of JS.
