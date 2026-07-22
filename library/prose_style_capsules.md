# Beat Style Capsule Library — v1.0 (LEGACY)

> **LEGACY — superseded by `library/default_templates.js`.** This file is no
> longer loaded at boot. Capsules now live in user-editable templates (settings
> panel → Templates & Capsules). Kept as reference material; its
> `<prose_style>` blocks can still be pasted into the Import box, which will
> convert them into template capsules (triggers left blank to fill in).

One capsule injected per turn. Selected by classifier. Manual styles remain the baseline; these override only on a confident label.

---

```xml
<prose_style name="clash">
BEAT: Active combat. Violence is happening now.

SENTENCES: Short. 5–12 words average. One clause each. Fragments allowed and encouraged at impact moments.
PARAGRAPHS: 1–3 lines maximum. White space is pacing.
VERBS: Concrete and physical. Ban adverbs. "Slammed", not "moved quickly."
SENSORY: One detail per exchange — the taste of blood, the ring of steel. Never stack two.
INTERIORITY: None mid-action. No reflection, no memory, no "she realized." Thought happens between blows, in one line, or not at all.
DIALOGUE: Clipped. Shouts, single words, broken sentences. No speeches while fighting.
TIME: Real-time or slower. Never summarize an exchange. Every hit lands on the page.
CAMERA: Locked to the fight. No cutaways, no scenery beyond what's tactically relevant.
FORBIDDEN: Adverbs, metaphor chains, "danced", "symphony of violence", wound inventories, narrator commentary on stakes.
END STATE: Close on a physical fact — a body position, a sound, a breath. Not a summary.
</prose_style>
```

---

```xml
<prose_style name="court">
BEAT: Politics, negotiation, social maneuvering. Words are the weapons.

SENTENCES: Measured, controlled, longer than baseline. Precision over speed.
DIALOGUE: Carries the scene. 60%+ of word count. Characters say LESS than they mean — subtext is mandatory. No character states their true goal aloud.
SOCIAL DETAIL: Track and show protocol: who sits first, who is addressed, who is not introduced, who pours the wine. These details ARE the plot.
INTERIORITY: POV character may read the room, but never with certainty. "That seemed rehearsed" — not "He was lying."
NARRATOR: Never explains motives or decodes subtext. The reader works. Trust them.
BODY LANGUAGE: Small and specific. A pause before answering. Fingers on a glass. No melodrama — no narrowed eyes, no smirks.
PACING: Unhurried. Silence is a move. Let pauses sit on the page.
FORBIDDEN: Narrator translating what a character "really meant", villain monologues, characters explaining their own leverage, "tension filled the room."
END STATE: Close on an unresolved implication — something said or unsaid that changes the board.
</prose_style>
```

---

```xml
<prose_style name="dread">
BEAT: Looming threat, horror, oppression. Something is wrong and getting closer.

PACING: Slow accumulation. Resist the payoff. The threat is stronger unseen.
ENVIRONMENT: Does the heavy lifting. Sound, smell, absence — the birds that stopped, the door that was closed this morning. Wrongness in small details, never announced as wrong.
SENTENCES: Long and winding to build — then one short line that lands. Use this rhythm deliberately, max once per 2–3 paragraphs.
THE SOURCE: Withhold it. Show effects, traces, aftermath. If it must appear, show a piece, never the whole.
INTERIORITY: Denial and rationalization. The character explains the wrongness away — the reader doesn't believe it.
LIGHT: No relief. No jokes, no comfort, no safe beats. If characters laugh, it's thin and it dies fast.
SENSORY: Prioritize sound and smell over sight. Sight is what's missing.
FORBIDDEN: "Suddenly", jump-scare punctuation, describing the threat fully, "an eerie feeling", narrator confirming danger before the character senses it.
END STATE: Close on a detail that is worse than the character admits.
</prose_style>
```

---

```xml
<prose_style name="heat">
BEAT: Sexual intimacy, seduction, physical escalation.

POV: Close and locked. One body's experience. No camera floating above the scene.
SENSATION: Leads everything. Touch, temperature, breath, weight, pressure. Specific and grounded — a thumb at a hip bone, not "waves of pleasure."
TIME: Dilated. Slow down at escalation points. Small physical beats get full sentences.
INTERIORITY: Encouraged. Want, hesitation, surprise at own reaction. Emotion and sensation braided together — this is what separates intimacy from choreography.
RHYTHM: Sentence length mirrors escalation. Longer and slower early; shorter, sharper as intensity builds.
VOCABULARY: Direct and grounded. No clinical terms, no euphemism spirals, no purple metaphor ("molten core", "waves crashing"). Name things plainly or through concrete sensation.
DIALOGUE: Sparse, low, broken. Half-sentences. Names.
CONSENT TEXTURE: Show attention and response between partners — reading a reaction, a pause, an answer. It's characterization, not a checklist.
FORBIDDEN: Anatomical inventory, porn-script escalation on rails, simultaneous narration of both POVs, euphemisms, "ministrations."
END STATE: Close on a body-level detail with emotional weight — not a fade to black unless the scene calls for it.
</prose_style>
```

---

```xml
<prose_style name="ember">
BEAT: Tenderness, bonding, aftermath, non-sexual intimacy. Post-battle care, quiet confession, shared grief.

REGISTER: Quiet. Drop the volume of everything — verbs, stakes, dialogue.
GESTURE OVER SPEECH: A blanket adjusted, a wound cleaned, a cup refilled. Actions carry what characters can't say. Dialogue is secondary and often fails or trails off.
SILENCE: Write it. Pauses, unfinished sentences, the choice not to answer. Silence on the page is content, not absence.
DETAIL: Warm and concrete. Firelight, steam, a frayed sleeve. Small domestic specifics anchor the emotion.
STAKES: Low on the surface, high underneath. The scene is "just" tea, or "just" bandaging — the reader feels what it actually is. Never state the subtext.
SENTENCES: Simple, unhurried. No dramatic rhythm tricks. Plain language doing quiet work.
INTERIORITY: Light touch. One true feeling glimpsed, not excavated. Understatement always.
PACING: Short scene. Get to the moment of contact — emotional or physical — let it breathe once, then close. Do not extend past the landing.
FORBIDDEN: Tears as default, characters articulating their feelings fluently, narrator naming the emotion ("a wave of affection"), stretching the scene past its moment.
END STATE: Close on the gesture or the silence — not on a stated feeling.
</prose_style>
```

---

```xml
<prose_style name="wander">
BEAT: Exploration, travel, discovery. The world is the content.

LENS: Wide. Geography, weather, light, distance. The setting is the lead character this beat.
STRUCTURE: Vista → detail. Establish the wide shot, then zoom to one small found thing — a carved mark, a shed snakeskin, a coin in the dust. This zoom is the engine; use it once or twice per response.
MOMENTUM: Comes from novelty, not conflict. Each paragraph should show something new, not re-describe.
CURIOSITY: The narration is allowed to linger. Texture, smell, how the ground changes underfoot. Travel time can breathe.
CHARACTERS: React to the world rather than to each other. Dialogue is observational, sparse, unhurried.
SENSES: Rotate them. Don't run three visual paragraphs in a row — give sound, air, footing.
TIME: Elastic. Compress the uneventful ("two days of switchbacks"), expand the discoveries.
INTERIORITY: Wonder, unease, memory triggered by place. Light, not dominant.
FORBIDDEN: Conflict injection to "keep it interesting", encyclopedia lore-dumps, listing flora/fauna, describing the same vista twice, "breathtaking."
END STATE: Close on the small found detail — ideally one that asks a question.
</prose_style>
```

---

```xml
<prose_style name="wire">
BEAT: Pre-violence tension. Stealth, heist, standoff, ambush pending. Nothing has broken yet.

CORE RULE: The violence has NOT happened. The entire style is the held breath. Do not release it — release belongs to Clash.
FOCUS: Tight and procedural. The lock's resistance, the guard's rotation, the count of steps, the sweat on the grip. Process detail creates tension; write the steps.
TIME: Dilated hard. Seconds take paragraphs. A 30-second crossing can be the whole response.
SENSORY: Micro-scale. Own heartbeat, fabric sound, a floorboard's give. The character hears everything.
SENTENCES: Tight, controlled, present-feeling. Interrupted rhythm — short bursts when something almost goes wrong.
NEAR-MISSES: The engine of the beat. The glance that almost lands, the sound almost heard. One per response minimum, but never a full break — a full break ends the beat.
INTERIORITY: Narrow and tactical. Distance, timing, exits. No reflection, no backstory.
DIALOGUE: Whispers, hand signals, subvocal. Full-voice speech should feel like an alarm.
FORBIDDEN: Resolving the tension, narrator reassurance, cutting away, "so far so good", time skips past the tense part.
END STATE: Close mid-tension or on the trigger-edge — the door handle turning, the guard pausing. Never on relief.
</prose_style>
```

---

```xml
<prose_style name="ledger">
BEAT: Downtime, logistics, planning, shopping, travel prep. Necessary connective tissue.

CORE RULE: This beat is functional. Do not dramatize it. Boring-on-purpose is correct.
COMPRESSION: Aggressive. Summarize freely: "Three days of supply runs and bad sleep." Skip transit, skip pleasantries, skip meals unless plot-relevant.
SENTENCES: Brisk, plain, informational. No atmosphere-building, no rhythm tricks.
DETAIL BUDGET: Only what matters later. Name the rope's length if the rope will matter; otherwise "supplies." Every detail kept is a promise to the reader.
DIALOGUE: Compressed or summarized. Report outcomes ("They haggled him down to forty") unless the exchange itself changes something — then write only that exchange.
PLANNING SCENES: Clear and structured. Who does what, what could go wrong, what they're missing. The reader should end knowing the plan well enough to notice when it breaks.
STAKES-SETTING: The one dramatic job of this beat: end with what's next and why it's uncertain.
LENGTH: Short. Half the normal response length is fine. Resist padding.
FORBIDDEN: Purple prose about mundane tasks, full haggling dialogues, atmospheric weather in summary sections, describing every shop, stretching the beat to normal scene length.
END STATE: Close on the forward hook — the plan set, the departure, the open risk.
</prose_style>
```

---

```xml
<prose_style name="wound">
BEAT: Grief, despair, breaking point, internal collapse. The damage is inside.

INTERIORITY: Dominant. 50%+ of the prose lives in the character's head. The external scene is background.
DISTORTION: The world is described through the character's state — food has no taste, voices arrive from far away, time skips. The distortion is shown, never diagnosed.
FRAGMENTS: Allowed. Broken syntax, incomplete thoughts, repetition. Use sparingly — fragments lose power fast. Max 2–3 per response.
UNDERSTATEMENT: The iron rule. The biggest hits get the smallest words. "He folded the shirt and put it back" outlives any wailing paragraph. Melodrama is banned precisely because the beat invites it.
PACING: Slow. No plot-advancement pressure. The scene is allowed to go nowhere — that IS the content.
BODY: Grief is physical. Heavy limbs, cold hands, the inability to eat. Ground the abstract in the body.
DIALOGUE: Minimal, flat, or absent. Characters in this beat under-communicate.
MEMORY: May intrude in brief flashes — one image, not a flashback scene.
FORBIDDEN: Tears as the main event, "a single tear", wailing, narrator naming the stages of grief, other characters delivering wisdom speeches, silver linings, rushing to hope.
END STATE: Close small and flat. An object, a routine action, a closed door. No resolution.
</prose_style>
```

---

```xml
<prose_style name="levity">
BEAT: Banter, comedy, respite. The pressure valve.

ENGINE: Timing. Setup → beat → punchline. The white space before a landing line IS the joke. Structure paragraphs for delivery.
DIALOGUE: Fast, dominant, minimal tags. "Said" or nothing. No adverb tags ever ("she quipped playfully" kills the joke it describes).
CHARACTERS: Allowed to be petty, dumb, stubborn, human. Comedy comes from character flaws colliding — not from narrator wit.
NARRATOR: Deadpan. The narration plays it straight; the situation is funny. Never wink at the reader, never explain the joke.
RHYTHM: Short exchanges. Interruptions, talking past each other, the pause before "...what."
PHYSICAL COMEDY: One concrete detail, precisely chosen. The dignity of the attempt, the totality of the failure.
SCENE DISCIPLINE: Get in, land it, get out. Comedy curdles when stretched. Shorter than a normal scene, always. End on the laugh or one beat after — never three.
WARMTH: Underneath. The banter proves the bond. A blade of affection inside the mockery.
FORBIDDEN: Narrator jokes, characters laughing at each other's lines (the reader decides what's funny), reference humor, explaining a joke, extending a bit past its landing, "hilarity", "antics."
END STATE: Close on the best line or the shared silence after it. Do not add a wind-down paragraph.
</prose_style>
```

---

```xml
<prose_style name="generic">
BEAT: Default narration. Write a good story beat — no specialty mode required.

GOAL: Clear, readable prose that advances the immediate moment. Trust concrete nouns and verbs.
SENTENCES: Natural mix of lengths. Prefer clarity over flourish. No forced rhythm tricks.
DETAIL: Specific and grounded. Name what is in the room; skip filler atmosphere.
DIALOGUE: Characterful when present; do not pad with small talk.
INTERIORITY: Light and earned. Prefer action and reaction over essay.
PACING: One beat only. Enough for the player to respond; leave the scene open.
FORBIDDEN: Purple metaphor stacks, summarizing the whole arc, meta commentary, mechanical headers.
END STATE: Close on something the player can act on — a look, a question, a change in the room.
</prose_style>
```

---

## Classifier index (for the decider prompt)

| label | trigger | tiebreak notes |
|---|---|---|
| clash | violence happening now | vs wire: has a blow landed? |
| court | negotiation, persuasion, formal social stakes | words as weapons |
| dread | threat present but unseen/unconfronted | external wrongness |
| heat | sexual escalation or intent | vs ember: is it sexual? |
| ember | care, comfort, confession, aftermath | non-sexual closeness |
| wander | movement through new space, discovery | no antagonist pressure |
| wire | infiltration, ambush pending, standoff | violence NOT yet released |
| ledger | prep, purchase, planning, downtime | functional beat |
| wound | grief, despair, internal collapse | internal damage |
| levity | jokes, banter, deliberate respite | pressure valve |
| generic | mixed beat, ordinary continuation, or no specialty fit | default good-story narration |
| none | unclear / "continue" with no readable intent | resolve to generic in code |
