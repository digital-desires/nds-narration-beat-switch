(function () {
    'use strict';

    window.NBS = window.NBS || {};

    const DISK_FILE = 'nbs_templates';
    const FALLBACK_LABEL = 'generic';
    const LABEL_RE = /^[a-z][a-z0-9_-]*$/;

    function clone(obj) {
        return typeof structuredClone === 'function'
            ? structuredClone(obj)
            : JSON.parse(JSON.stringify(obj));
    }

    function factory() {
        return window.NBS.DefaultTemplates || { version: 1, defaultActive: '', templates: {}, legacyTemplates: {} };
    }

    const Templates = {
        _normalized: false,

        // ── Factory templates (plain-text .md files, fetched at boot) ─────

        async loadFactoryTemplates() {
            const files = window.NBS.DefaultTemplateFiles || [];
            const root = window.NBS_EXTENSION_ROOT;
            if (!root) return;
            for (const filename of files) {
                try {
                    const url = new URL(`library/templates/${filename}`, root).href;
                    const res = await fetch(url);
                    if (!res.ok) {
                        console.warn(`[NBS] Factory template ${filename} not found (${res.status})`);
                        continue;
                    }
                    const { name, template } = this.importTemplateText(await res.text());
                    window.NBS.registerDefaultTemplate(name, template);
                } catch (err) {
                    console.warn(`[NBS] Failed to load factory template ${filename}:`, err.message);
                }
            }
        },

        // ── Normalization / seeding ───────────────────────────────────────

        normalizeSettings(s, force = false) {
            if (!s) return;
            if (this._normalized && !force) return;
            const fac = factory();

            if (!s.templates || typeof s.templates !== 'object' || Array.isArray(s.templates)
                || Object.keys(s.templates).length === 0) {
                s.templates = clone(fac.templates);
            }

            this._purgeLegacyTemplates(s.templates);

            // Non-destructive seed: fill in factory templates that are missing,
            // never overwrite existing (possibly user-edited) names.
            for (const [name, tpl] of Object.entries(fac.templates)) {
                if (!s.templates[name]) s.templates[name] = clone(tpl);
            }

            for (const name of Object.keys(s.templates)) {
                s.templates[name] = this.normalizeTemplate(s.templates[name]);
            }

            if (!s.activeTemplate || !s.templates[s.activeTemplate]) {
                s.activeTemplate = s.templates[fac.defaultActive]
                    ? fac.defaultActive
                    : Object.keys(s.templates)[0];
            }
            if (!Number.isFinite(s.templatesVersion)) s.templatesVersion = fac.version || 1;

            // Only latch once the factory set has actually loaded (async .md
            // fetch) so an early caller doesn't freeze an unseeded state.
            this._normalized = Object.keys(fac.templates).length > 0;
        },

        // Deletes saved templates byte-identical to a retired factory set so the
        // current factory version seeds in their place; user edits survive.
        _purgeLegacyTemplates(templates) {
            const legacy = factory().legacyTemplates || {};
            for (const [name, oldTpl] of Object.entries(legacy)) {
                const saved = templates[name];
                if (!saved) continue;
                if (JSON.stringify(saved.capsules) === JSON.stringify(oldTpl.capsules)) {
                    delete templates[name];
                    console.info(`[NBS] Purged legacy factory template "${name}" (untouched old default)`);
                }
            }
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
            if (!seen.has(FALLBACK_LABEL)) {
                out.capsules.push(this._factoryGenericCapsule());
            }
            return out;
        },

        _factoryGenericCapsule() {
            const fac = factory();
            for (const tpl of Object.values(fac.templates || {})) {
                const cap = (tpl.capsules || []).find(c => c.label === FALLBACK_LABEL);
                if (cap) return clone(cap);
            }
            return { label: FALLBACK_LABEL, trigger: 'anything else', body: 'Write clear, grounded narration that advances the immediate moment and closes on something the player can act on.' };
        },

        // ── Accessors ─────────────────────────────────────────────────────

        _settings() {
            const s = window.NBS.State.getSettings();
            this.normalizeSettings(s);
            return s;
        },

        getActiveTemplateName() {
            return this._settings().activeTemplate;
        },

        getActiveTemplate() {
            const s = this._settings();
            return s.templates[s.activeTemplate];
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

        getCapsuleBody(tpl, label) {
            tpl = tpl || this.getActiveTemplate();
            const caps = tpl?.capsules || [];
            const cap = caps.find(c => c.label === label)
                || caps.find(c => c.label === this.getFallbackLabel(tpl));
            if (!cap) return '';
            const header =
                'This is the active per-beat corrective directive. It supplements the complete '
                + 'narrator prompt; established character definitions, world state, stats, '
                + 'abilities, relationships, and mechanics remain authoritative. The user message '
                + 'states an unresolved intention, not its result. In the Referee pass, use '
                + 'ADJUDICATE and PROCEDURE to evaluate that intention through the full context. '
                + 'Friction means checking relevant constraints and independent agents; it never '
                + 'requires adversity, cost, escalation, failure, or a changed state. GUARDRAILS '
                + 'prevent mode-specific distortions without predetermining the outcome. In the '
                + 'Narrator pass, RENDER only the context-supported result and keep hidden reasoning '
                + 'off-page. The directive is binding as a corrective lens, never as a plot outcome.';
            return `<scene_directive name="${cap.label}">\n${header}\n\n${cap.body.trim()}\n</scene_directive>`;
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
            const rows = caps.map(c => {
                return `${c.label}: ${cleanTrigger(c.trigger) || 'no description provided'}`;
            });

            return [
                '## Labels',
                '',
                ...rows,
                '',
                '## Allowed labels',
                '',
                labels,
            ].join('\n');
        },

        // ── Disk sync (narrator-tools-storage plugin) ─────────────────────

        async loadTemplatesFromDisk() {
            try {
                const data = await window.NBS.Storage.NarratorTools.read(DISK_FILE);
                if (!data || typeof data !== 'object' || !data.templates) return false;
                const s = this._settings();
                Object.assign(s.templates, data.templates);
                this._purgeLegacyTemplates(s.templates);
                for (const name of Object.keys(s.templates)) {
                    s.templates[name] = this.normalizeTemplate(s.templates[name]);
                }
                if (data.activeTemplate && s.templates[data.activeTemplate]) {
                    s.activeTemplate = data.activeTemplate;
                }
                if (!s.templates[s.activeTemplate]) {
                    s.activeTemplate = Object.keys(s.templates)[0];
                }
                window.NBS.State.saveSettings();
                console.info(`[NBS] Loaded templates from disk (${Object.keys(s.templates).length} total)`);
                return true;
            } catch (err) {
                console.warn('[NBS] loadTemplatesFromDisk failed (session-only persistence):', err.message);
                return false;
            }
        },

        async saveTemplatesToDisk() {
            try {
                const s = this._settings();
                await window.NBS.Storage.NarratorTools.write(DISK_FILE, {
                    version: s.templatesVersion || 1,
                    templates: s.templates,
                    activeTemplate: s.activeTemplate,
                });
                return true;
            } catch (err) {
                console.warn('[NBS] saveTemplatesToDisk failed (templates kept in ST settings only):', err.message);
                return false;
            }
        },

        // ── Import / export ───────────────────────────────────────────────

        serializeTemplate(name, tpl) {
            if (!tpl) return '';
            const esc = (v) => String(v || '').replace(/"/g, '&quot;');
            const blocks = (tpl.capsules || []).map(c =>
                `<capsule label="${esc(c.label)}" trigger="${esc(c.trigger)}">\n${String(c.body || '').trim()}\n</capsule>`);
            return `# NBS Template: ${name}\n\n${blocks.join('\n\n')}\n`;
        },

        exportTemplate(name) {
            return this.serializeTemplate(name, this._settings().templates[name]);
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
                // Legacy path: old <prose_style name="x"> blocks (wrapper stripped, triggers empty).
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
