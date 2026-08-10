/**
 * Templates — the .md files in library/templates/ ARE the templates.
 *
 * Read fresh at every boot. No settings copy, no JSON store, no seeding, no
 * "factory vs user" split, nothing immutable. Edit a file (the desktop editor
 * in tools/ does this), reload SillyTavern, it's live.
 *
 * Settings hold exactly one template-related value: activeTemplate, the name
 * the user picked. Any template can be the active one.
 */
(function () {
    'use strict';

    window.NBS = window.NBS || {};

    const FALLBACK_LABEL = 'generic';
    const LABEL_RE = /^[a-z][a-z0-9_-]*$/;

    function clone(obj) {
        return typeof structuredClone === 'function'
            ? structuredClone(obj)
            : JSON.parse(JSON.stringify(obj));
    }

    const Templates = {
        // name -> { capsules: [{label, trigger, body}], file }
        _templates: {},

        // ── Load from disk ────────────────────────────────────────────────

        async loadFromDisk() {
            const files = window.NBS.DefaultTemplateFiles || [];
            const root = window.NBS_EXTENSION_ROOT;
            const loaded = {};
            if (!root) {
                console.warn('[NBS] Extension root missing; cannot load templates');
                this._templates = loaded;
                return loaded;
            }
            for (const filename of files) {
                try {
                    const url = new URL(`library/templates/${filename}`, root).href;
                    const res = await fetch(url);
                    if (!res.ok) {
                        console.warn(`[NBS] Template ${filename} not found (${res.status})`);
                        continue;
                    }
                    const { name, template } = this.importTemplateText(await res.text());
                    template.file = filename;
                    loaded[name] = template;
                    console.info(`[NBS] Template loaded: "${name}" (${template.capsules.length} capsules) from ${filename}`);
                } catch (err) {
                    console.warn(`[NBS] Failed to load template ${filename}:`, err.message);
                }
            }
            this._templates = loaded;
            return loaded;
        },

        normalizeTemplate(tpl) {
            const out = { capsules: [] };
            const seen = new Set();
            const list = Array.isArray(tpl?.capsules) ? tpl.capsules : [];
            for (const cap of list) {
                const label = String(cap?.label || '').trim().toLowerCase();
                if (!LABEL_RE.test(label) || label === 'none' || seen.has(label)) continue;
                seen.add(label);
                out.capsules.push({
                    label,
                    trigger: String(cap?.trigger || '').trim(),
                    body: String(cap?.body || ''),
                });
            }
            if (!seen.has(FALLBACK_LABEL)) out.capsules.push(this._fallbackCapsule());
            return out;
        },

        _fallbackCapsule() {
            for (const tpl of Object.values(this._templates)) {
                const cap = (tpl.capsules || []).find(c => c.label === FALLBACK_LABEL);
                if (cap) return clone(cap);
            }
            return {
                label: FALLBACK_LABEL,
                trigger: 'anything else',
                body: 'Write clear, grounded narration that advances the immediate moment and closes on something the player can act on.',
            };
        },

        // ── Accessors ─────────────────────────────────────────────────────

        getTemplateNames() {
            return Object.keys(this._templates).sort((a, b) => a.localeCompare(b));
        },

        getActiveTemplateName() {
            const s = window.NBS.State.getSettings();
            if (s.activeTemplate && this._templates[s.activeTemplate]) return s.activeTemplate;
            // Preferred default, else whatever loaded first — never an error.
            const preferred = window.NBS.DefaultActiveTemplate;
            if (preferred && this._templates[preferred]) return preferred;
            return this.getTemplateNames()[0] || '';
        },

        getActiveTemplate() {
            return this._templates[this.getActiveTemplateName()] || null;
        },

        setActiveTemplate(name) {
            if (!this._templates[name]) return false;
            const s = window.NBS.State.getSettings();
            s.activeTemplate = name;
            window.NBS.State.saveSettings();
            return true;
        },

        getLabelSet(tpl) {
            tpl = tpl || this.getActiveTemplate();
            return new Set((tpl?.capsules || []).map(c => c.label));
        },

        getFallbackLabel(tpl) {
            tpl = tpl || this.getActiveTemplate();
            const caps = tpl?.capsules || [];
            if (caps.some(c => c.label === FALLBACK_LABEL)) return FALLBACK_LABEL;
            return caps[0]?.label || FALLBACK_LABEL;
        },

        // Capsule bodies may use {{user}}, {{char}} and friends. They reach the
        // prompt through {{getvar::nds_beat_style}}, and SillyTavern's macro pass
        // does not re-scan a variable's value — so expand them here, or they
        // arrive at the model as a literal {{user}}.
        _substitute(text) {
            try {
                const fn = window.substituteParams
                    || window.NBS.getContext?.()?.substituteParams;
                if (typeof fn === 'function') return fn(text);
            } catch (err) {
                console.warn('[NBS] macro substitution failed:', err.message);
            }
            return text;
        },

        getCapsuleBody(tpl, label) {
            tpl = tpl || this.getActiveTemplate();
            const caps = tpl?.capsules || [];
            const cap = caps.find(c => c.label === label)
                || caps.find(c => c.label === this.getFallbackLabel(tpl));
            if (!cap) return '';
            // The header used to frame this as a two-pass procedure — "In the Referee
            // pass… In the Narrator pass… keep hidden reasoning off-page." That is the
            // same Two Hats fiction that was cut from gm_core: the model cannot run
            // passes, and telling it to hide knowledge from itself makes it hesitant.
            // It survived here because this repo is separate from the preset. The
            // header now says what the four tags are, in one voice, without pretending
            // there are two of them.
            const header =
                'This is the beat sub-skill for the current moment: what kind of moment this is, '
                + 'and how a moment of this kind is narrated. It configures narration only. '
                + 'Established character definitions, world state, stats, abilities, relationships '
                + 'and mechanics stay authoritative, and nothing here overrides them. The player\'s '
                + 'message states an intention, not its result. ADJUDICATE is what to settle before '
                + 'writing. PROCEDURE is how a moment of this kind actually plays out. GUARDRAILS '
                + 'are the distortions this kind of moment invites, and what to do instead. RENDER '
                + 'is how it reads on the page. Friction means checking what genuinely resists; it '
                + 'never requires adversity, cost, escalation, failure, or a changed state. This '
                + 'shapes how the beat is narrated, never what the outcome turns out to be.';
            const body = this._substitute(cap.body.trim());
            return `<skill name="beat" parent="narration" beat="${cap.label}">\n`
                + `${header}\n\n${body}\n</skill>`;
        },

        isValidLabel(label) {
            return LABEL_RE.test(String(label || ''));
        },

        // ── Classifier index (built at runtime from the active template) ──

        buildClassifierIndex(tpl) {
            tpl = tpl || this.getActiveTemplate();
            const caps = tpl?.capsules || [];
            const cleanTrigger = (t) => String(t || '').replace(/[|\r\n]+/g, ' ').trim();

            const labels = caps.map(c => c.label).join(', ');
            const rows = caps.map(c =>
                `${c.label}: ${cleanTrigger(c.trigger) || 'no description provided'}`);

            return ['## Labels', '', ...rows, '', '## Allowed labels', '', labels].join('\n');
        },

        // ── Text form (used by the loader, the viewer and Copy) ───────────

        serializeTemplate(name, tpl) {
            if (!tpl) return '';
            const esc = (v) => String(v || '').replace(/"/g, '&quot;');
            const blocks = (tpl.capsules || []).map(c =>
                `<capsule label="${esc(c.label)}" trigger="${esc(c.trigger)}">\n${String(c.body || '').trim()}\n</capsule>`);
            return `# NBS Template: ${name}\n\n${blocks.join('\n\n')}\n`;
        },

        exportTemplate(name) {
            return this.serializeTemplate(name, this._templates[name]);
        },

        // Returns { name, template } or throws with a readable message.
        importTemplateText(text) {
            const raw = String(text || '').trim();
            if (!raw) throw new Error('Nothing to import — paste a template first.');

            const nameMatch = raw.match(/^#\s*NBS Template:\s*(.+)$/m);
            const name = (nameMatch?.[1] || 'Imported template').trim();
            const unesc = (v) => String(v || '').replace(/&quot;/g, '"');

            const capsules = [];
            const capRe = /<capsule\s+label="([^"]+)"\s+trigger="([^"]*)">([\s\S]*?)<\/capsule>/gi;
            let m;
            while ((m = capRe.exec(raw)) !== null) {
                capsules.push({
                    label: unesc(m[1]).trim().toLowerCase(),
                    trigger: unesc(m[2]).trim(),
                    body: m[3].trim(),
                });
            }

            if (!capsules.length) {
                // Legacy path: old <prose_style name="x"> blocks.
                const legacy = window.NBS.State.parseCapsules(raw);
                for (const [label, block] of legacy) {
                    const body = block
                        .replace(/^<prose_style[^>]*>\s*/i, '')
                        .replace(/\s*<\/prose_style>$/i, '');
                    capsules.push({ label, trigger: '', body });
                }
            }

            if (!capsules.length) {
                throw new Error('No <capsule> or <prose_style> blocks found in the pasted text.');
            }

            return { name, template: this.normalizeTemplate({ capsules }) };
        },
    };

    window.NBS.Templates = Templates;
})();
