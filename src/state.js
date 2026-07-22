(function () {
    'use strict';

    window.NBS = window.NBS || {};

    const SETTINGS_KEY = 'nds_narration_beat_switch';
    const VAR_KEY = 'nds_beat_style';

    const defaultSettings = {
        enabled: true,
        useTrackerOpenRouter: true,
        timeoutMs: 10000,
        debug: false,
        openRouter: {
            apiKey: '',
            modelId: '',
            temperature: 0.1,
            maxCompletionTokens: 64,
        },
    };

    const State = {
        settings: null,
        soul: '',
        skillDecide: '',
        formatRules: '',
        lastLabel: '',
        lastError: '',
        ready: false,

        getSettings() {
            const ctx = window.NBS.getContext?.();
            const store = ctx?.extensionSettings || window.extension_settings || {};
            if (!store[SETTINGS_KEY] || typeof store[SETTINGS_KEY] !== 'object') {
                store[SETTINGS_KEY] = structuredClone
                    ? structuredClone(defaultSettings)
                    : JSON.parse(JSON.stringify(defaultSettings));
            }
            const s = store[SETTINGS_KEY];
            if (typeof s.enabled !== 'boolean') s.enabled = true;
            if (typeof s.useTrackerOpenRouter !== 'boolean') s.useTrackerOpenRouter = true;
            if (!Number.isFinite(s.timeoutMs)) s.timeoutMs = 10000;
            if (typeof s.debug !== 'boolean') s.debug = false;
            if (!s.openRouter || typeof s.openRouter !== 'object') {
                s.openRouter = { ...defaultSettings.openRouter };
            }
            this.settings = s;
            return s;
        },

        saveSettings() {
            const ctx = window.NBS.getContext?.();
            if (ctx?.saveSettingsDebounced) ctx.saveSettingsDebounced();
            else if (typeof window.saveSettingsDebounced === 'function') window.saveSettingsDebounced();
        },

        async loadPromptFile(filename, subdir = 'prompts') {
            const root = window.NBS_EXTENSION_ROOT;
            if (!root) {
                console.warn(`[NBS] Extension root missing; cannot load ${filename}`);
                return '';
            }
            try {
                const url = new URL(`${subdir}/${filename}`, root).href;
                const res = await fetch(url);
                if (!res.ok) {
                    console.warn(`[NBS] ${subdir}/${filename} not found (${res.status})`);
                    return '';
                }
                const text = (await res.text()).trim();
                console.info(`[NBS] Loaded ${subdir}/${filename} (${text.length} chars)`);
                return text;
            } catch (err) {
                console.warn(`[NBS] Failed to load ${filename}: ${err.message}`);
                return '';
            }
        },

        // Legacy <prose_style> block parser — kept as the import path for old
        // capsule libraries (Templates.importTemplateText falls back to it).
        parseCapsules(raw) {
            const map = new Map();
            if (!raw) return map;
            const re = /<prose_style\s+name="([^"]+)">([\s\S]*?)<\/prose_style>/gi;
            let m;
            while ((m = re.exec(raw)) !== null) {
                const name = String(m[1] || '').trim().toLowerCase();
                const body = m[0].trim();
                if (name && body) map.set(name, body);
            }
            return map;
        },

        async loadAll() {
            const [soul, skill, format] = await Promise.all([
                this.loadPromptFile('soul.md', 'prompts'),
                this.loadPromptFile('skill_decide.md', 'prompts'),
                this.loadPromptFile('format_rules.md', 'prompts'),
            ]);
            this.soul = soul;
            this.skillDecide = skill;
            this.formatRules = format;
            const tpl = window.NBS.Templates?.getActiveTemplate?.();
            this.ready = Boolean(soul && skill && format && tpl?.capsules?.length);
            console.info(`[NBS] Active template: ${window.NBS.Templates?.getActiveTemplateName?.() || '(none)'} (${tpl?.capsules?.length || 0} capsules); ready=${this.ready}`);
            return this.ready;
        },

        normalizeLabel(label) {
            const T = window.NBS.Templates;
            const key = String(label || '').trim().toLowerCase();
            if (!key || key === 'none' || !T.getLabelSet().has(key)) {
                return T.getFallbackLabel();
            }
            return key;
        },

        resolveCapsule(label) {
            const T = window.NBS.Templates;
            return T.getCapsuleBody(null, this.normalizeLabel(label));
        },

        setBeatVariable(value) {
            try {
                const ctx = window.NBS.getContext?.();
                const meta = ctx?.chatMetadata || ctx?.chat_metadata || window.chat_metadata;
                if (!meta) return;
                if (!meta.variables) meta.variables = {};
                meta.variables[VAR_KEY] = value ?? '';
            } catch (err) {
                console.warn('[NBS] setBeatVariable failed:', err.message);
            }
        },

        log(...args) {
            if (this.getSettings().debug) console.log('[NBS]', ...args);
        },
    };

    window.NBS.State = State;
    window.NBS.VAR_KEY = VAR_KEY;
})();
