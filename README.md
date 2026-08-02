## Support the project

If Narration Beat Switch improved your roleplay and you want to support its development:

[Support Digital Desires on Ko-fi](https://ko-fi.com/digitaldesires)

# NDS: Narration Beat Switch

**One beat. One capsule.**

NDS is a lightweight SillyTavern extension that selects one narrow instruction for the current roleplay beat instead of sending a massive all-purpose preset on every reply.

The current user message is treated as a stated, unresolved intention. The previous user/assistant round is secondary context. A small classifier selects one label, and only the matching capsule is injected for the main narrator to resolve.

```text
current user intention + previous round
                  |
           classifier label
                  |
        one matching capsule
                  |
      main narrator resolves it
```

A capsule is a corrective lens, not a predetermined outcome. It can tell the narrator what to evaluate without forcing adversity, cost, escalation, failure, or a choice menu.

## Included templates

Only three factory templates ship with the extension:

| Template | Capsules | Purpose |
|---|---:|---|
| **GM Manual Extended** | 21 | Per-beat adjudication and narration corrections without predetermined outcomes. This is the default. |
| **D&D Mechanics** | 9 | 5e-adjacent procedures adapted for narrated chat play. |
| **Genre Chameleon** | 11 | A deliberately varied, semi-random genre showcase for the routing system. |

You can create, edit, import, and export templates from the extension settings.

## Install from SillyTavern

1. Open **Extensions -> Install Extension**.
2. Paste:

   ```text
   https://github.com/digital-desires/nds-narration-beat-switch
   ```

3. Reload SillyTavern and enable **NDS: Narration Beat Switch**.
4. Open the NBS settings, add an OpenRouter API key, choose a small classifier model, and select an active template.

If the sibling NDS: Tracker extension is installed, NBS can reuse its configured OpenRouter key and model.

## Use with any existing preset

> To use Narration Beat Switch with an existing SillyTavern preset, add `{{getvar::nds_beat_style}}` anywhere inside an enabled prompt block. No other NDS channels, wrappers, or preset conversion are required.

The extension must be installed and enabled, and one Beat Switch template must be active. Before the main narrator responds, the variable expands to the capsule selected for the current beat. If Beat Switch is disabled or unavailable, the variable is empty and does not disturb the rest of the preset.

You can keep your preferred completion preset. The bundled GM preset is optional.

## Optional bundled GM preset

The repository includes [`NDS Beat Switch - GM Core V0.3.0.json`](presets/NDS%20Beat%20Switch%20-%20GM%20Core%20V0.3.0.json), a compact GM preset designed around the **GM Manual Extended** Beat Switch template.

1. In SillyTavern, open **AI Response Configuration**.
2. Use the completion-preset menu to import the JSON file.
3. In NBS settings, select **GM Manual Extended** as the active template.

The bundled preset already contains `{{getvar::nds_beat_style}}`; do not add a second copy.

## What is sent

Before each enabled generation, NBS sends one short classifier request through OpenRouter containing:

- the current user message as the primary unresolved intention;
- the immediately preceding user and assistant messages as context;
- the classifier instructions;
- the active template's label and trigger index.

The classifier does not receive every capsule body. The selected capsule enters the normal SillyTavern prompt and is sent to the backend used for the main narration.

NBS includes no telemetry. See [SECURITY.md](SECURITY.md) for details.

## Repository contents

```text
manifest.json               SillyTavern extension manifest
index.js                    extension bootstrap
style.css                   extension interface styles
src/                        classifier, routing, injection, and UI
lib/                        standalone/suite integration
prompts/                    classifier instructions
library/default_templates.js
library/templates/          the three factory templates
presets/                    optional shareable completion preset
```

No build step or server plugin is required for normal use.

## License

MIT - see [LICENSE](LICENSE).
