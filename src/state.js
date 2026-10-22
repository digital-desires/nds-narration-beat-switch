// v0.3.0 — 2026-08-30
(function () {
    'use strict';

    window.NBS = window.NBS || {};

    const SETTINGS_KEY = 'nds_narration_beat_switch';
    const VAR_KEY = 'nds_beat_style';
    const VAR_WORLD = 'nds_world_setting';
    const VAR_STYLE = 'nds_narrative_style';
    const CARTRIDGE_KEY = 'nbs_cartridges';

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
            if (!s.userCartridges || typeof s.userCartridges !== 'object') {
                s.userCartridges = { worlds: {}, styles: {}, presets: {}, templates: {} };
            }
            for (const key of ['worlds', 'styles', 'presets', 'templates']) {
                if (!s.userCartridges[key] || typeof s.userCartridges[key] !== 'object') {
                    s.userCartridges[key] = {};
                }
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
            if (!key || !T.getLabelSet().has(key)) {
                return T.getFallbackLabel();
            }
            return key;
        },

        resolveCapsule(label) {
            const T = window.NBS.Templates;
            return T.getCapsuleBody(null, this.normalizeLabel(label));
        },

        _meta() {
            const ctx = window.NBS.getContext?.();
            return ctx?.chatMetadata || ctx?.chat_metadata || window.chat_metadata || null;
        },

        setChatVariable(key, value) {
            try {
                const meta = this._meta();
                if (!meta) return;
                if (!meta.variables) meta.variables = {};
                meta.variables[key] = value ?? '';
            } catch (err) {
                console.warn(`[NBS] setChatVariable(${key}) failed:`, err.message);
            }
        },

        setBeatVariable(value) {
            this.setChatVariable(VAR_KEY, value);
        },

        emptyCartridgeRecord() {
            return { world: '', style: '', template: '', preset: '', asked: false };
        },

        getCartridgeRecord() {
            const meta = this._meta();
            const raw = meta?.[CARTRIDGE_KEY];
            const out = this.emptyCartridgeRecord();
            if (!raw || typeof raw !== 'object') return out;
            if (typeof raw.world === 'string') out.world = raw.world;
            if (typeof raw.style === 'string') out.style = raw.style;
            if (typeof raw.template === 'string') out.template = raw.template;
            if (typeof raw.preset === 'string') out.preset = raw.preset;
            if (typeof raw.asked === 'boolean') out.asked = raw.asked;
            return out;
        },

        saveCartridgeRecord(record) {
            const meta = this._meta();
            if (!meta) return;
            meta[CARTRIDGE_KEY] = {
                world: record.world || '',
                style: record.style || '',
                template: record.template || '',
                preset: record.preset || '',
                asked: !!record.asked,
            };
            this.writeCartridgeVariables(record);
            const ctx = window.NBS.getContext?.();
            if (typeof ctx?.saveMetadata === 'function') ctx.saveMetadata();
        },

        writeCartridgeVariables(record) {
            const rec = record || this.getCartridgeRecord();
            const C = window.NBS.Cartridges;
            this.setChatVariable(VAR_WORLD, C?.worldBody?.(rec.world) || '');
            this.setChatVariable(VAR_STYLE, C?.styleBody?.(rec.style) || '');
        },

        applyCartridgeRecord(record) {
            const rec = { ...this.emptyCartridgeRecord(), ...record };
            const C = window.NBS.Cartridges;
            const T = window.NBS.Templates;
            if (rec.template && T?.setActiveTemplate) T.setActiveTemplate(rec.template);
            else rec.template = T?.getActiveTemplateName?.() || '';
            if (rec.preset && C?.getPreset?.(rec.preset)) {
                rec.preset = rec.preset;
            } else {
                rec.preset = C?.matchPreset?.(rec.world, rec.style, rec.template) || '';
            }
            this.saveCartridgeRecord(rec);
            return rec;
        },

        setCartridgeField(field, value) {
            const rec = this.getCartridgeRecord();
            const C = window.NBS.Cartridges;
            const T = window.NBS.Templates;

            if (field === 'preset') {
                if (!value) {
                    rec.preset = '';
                    rec.asked = true;
                    this.saveCartridgeRecord(rec);
                    return rec;
                }
                const p = C?.getPreset?.(value);
                if (!p) return rec;
                rec.preset = value;
                if (p.world) rec.world = p.world;
                if (p.style) rec.style = p.style;
                if (p.template) rec.template = p.template;
                rec.asked = true;
                return this.applyCartridgeRecord(rec);
            }

            rec[field] = value || '';
            rec.asked = true;
            if (field === 'world') {
                const world = C?.getWorld?.(rec.world);
                if (world?.template) rec.template = world.template;
            }
            rec.preset = C?.matchPreset?.(rec.world, rec.style, rec.template || T?.getActiveTemplateName?.()) || '';
            return this.applyCartridgeRecord(rec);
        },

        persistMetadata() {
            const ctx = window.NBS.getContext?.();
            if (typeof ctx?.saveMetadata === 'function') ctx.saveMetadata();
        },

        log(...args) {
            if (this.getSettings().debug) console.log('[NBS]', ...args);
        },
    };

    window.NBS.State = State;
    window.NBS.VAR_KEY = VAR_KEY;
    window.NBS.VAR_WORLD = VAR_WORLD;
    window.NBS.VAR_STYLE = VAR_STYLE;
})();
