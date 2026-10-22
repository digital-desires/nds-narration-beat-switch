// v0.2.0 — 2026-08-30
/**
 * Cartridges — World Setting, Narrative Style, and Preset .md files.
 * Same contract as beat templates: listed in default_cartridges.js, read
 * fresh every boot, nothing cached in settings.
 */
(function () {
    'use strict';

    window.NBS = window.NBS || {};

    const ID_RE = /^[a-z][a-z0-9_-]*$/;

    function slug(text) {
        return String(text || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    function extractSkill(raw) {
        const m = String(raw || '').match(/<skill\b[\s\S]*?<\/skill>/i);
        return m ? m[0].trim() : '';
    }

    function extractActive(skill) {
        const m = String(skill || '').match(/\bactive="([^"]+)"/i);
        return slug(m?.[1] || '');
    }

    function headerValue(raw, kind) {
        const re = new RegExp(`^#\\s*NBS ${kind}:\\s*(.+)$`, 'im');
        const m = String(raw || '').match(re);
        return (m?.[1] || '').trim();
    }

    function lineValue(raw, key) {
        const re = new RegExp(`^${key}:\\s*(.+)$`, 'im');
        const m = String(raw || '').match(re);
        return (m?.[1] || '').trim();
    }

    async function fetchMd(subdir, filename) {
        const root = window.NBS_EXTENSION_ROOT;
        if (!root) return '';
        const url = new URL(`library/${subdir}/${filename}`, root).href;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${filename} ${res.status}`);
        return res.text();
    }

    const Cartridges = {
        _worlds: {},
        _styles: {},
        _presets: {},
        _shippedWorlds: {},
        _shippedStyles: {},
        _shippedPresets: {},

        async loadFromDisk() {
            this._worlds = {};
            this._styles = {};
            this._presets = {};
            this._shippedWorlds = {};
            this._shippedStyles = {};
            this._shippedPresets = {};

            await Promise.all([
                this._loadKind('worlds', window.NBS.DefaultWorldFiles || [], this._worlds, 'World', this.parseWorld),
                this._loadKind('styles', window.NBS.DefaultStyleFiles || [], this._styles, 'Style', this.parseStyle),
                this._loadKind('presets', window.NBS.DefaultPresetFiles || [], this._presets, 'Preset', this.parsePreset),
            ]);
            this._shippedWorlds = { ...this._worlds };
            this._shippedStyles = { ...this._styles };
            this._shippedPresets = { ...this._presets };
            this.mergeUserLibrary();

            console.info(`[NBS] Cartridges: ${Object.keys(this._worlds).length} worlds, ${Object.keys(this._styles).length} styles, ${Object.keys(this._presets).length} presets`);
            return {
                worlds: this._worlds,
                styles: this._styles,
                presets: this._presets,
            };
        },

        async _loadKind(subdir, files, store, kind, parser) {
            for (const filename of files) {
                try {
                    const raw = await fetchMd(subdir, filename);
                    const item = parser.call(this, raw, filename);
                    if (!item?.id || store[item.id]) {
                        console.warn(`[NBS] ${kind} ${filename} skipped (bad or duplicate id)`);
                        continue;
                    }
                    item.source = 'disk';
                    store[item.id] = item;
                    console.info(`[NBS] ${kind} loaded: "${item.name}" from ${filename}`);
                } catch (err) {
                    console.warn(`[NBS] Failed to load ${subdir}/${filename}:`, err.message);
                }
            }
        },

        parseWorld(raw, file) {
            const name = headerValue(raw, 'World') || file.replace(/\.md$/i, '');
            const skill = extractSkill(raw);
            const id = extractActive(skill) || slug(name);
            if (!ID_RE.test(id) || !skill) return null;
            return {
                id,
                name,
                file,
                raw: String(raw || '').trim(),
                body: skill,
                template: lineValue(raw, 'template'),
            };
        },

        parseStyle(raw, file) {
            const name = headerValue(raw, 'Style') || file.replace(/\.md$/i, '');
            const skill = extractSkill(raw);
            const id = extractActive(skill) || slug(name);
            if (!ID_RE.test(id) || !skill) return null;
            return {
                id,
                name,
                file,
                raw: String(raw || '').trim(),
                body: skill,
            };
        },

        parsePreset(raw, file) {
            const name = headerValue(raw, 'Preset') || file.replace(/\.md$/i, '');
            const id = slug(name);
            if (!ID_RE.test(id)) return null;
            return {
                id,
                name,
                file,
                raw: String(raw || '').trim(),
                world: slug(lineValue(raw, 'world')),
                style: slug(lineValue(raw, 'style')),
                template: lineValue(raw, 'template'),
            };
        },

        worldIds() { return Object.keys(this._worlds).sort((a, b) => this._worlds[a].name.localeCompare(this._worlds[b].name)); },
        styleIds() { return Object.keys(this._styles).sort((a, b) => this._styles[a].name.localeCompare(this._styles[b].name)); },
        presetIds() { return Object.keys(this._presets).sort((a, b) => this._presets[a].name.localeCompare(this._presets[b].name)); },

        getWorld(id) { return this._worlds[id] || null; },
        getStyle(id) { return this._styles[id] || null; },
        getPreset(id) { return this._presets[id] || null; },

        worldOptions() {
            return [
                { value: '', label: 'None' },
                ...this.worldIds().map((id) => ({ value: id, label: this._worlds[id].name })),
            ];
        },

        styleOptions() {
            return [
                { value: '', label: 'None' },
                ...this.styleIds().map((id) => ({ value: id, label: this._styles[id].name })),
            ];
        },

        presetOptions(includeCustom) {
            const opts = [
                { value: '', label: includeCustom ? 'Custom' : '—' },
                ...this.presetIds().map((id) => ({ value: id, label: this._presets[id].name })),
            ];
            return opts;
        },

        templateOptions() {
            const T = window.NBS.Templates;
            const names = T?.getTemplateNames?.() || [];
            return names.map((name) => ({ value: name, label: name }));
        },

        worldBody(id) {
            const item = this.getWorld(id);
            return item ? this._substitute(item.body) : '';
        },

        styleBody(id) {
            const item = this.getStyle(id);
            return item ? this._substitute(item.body) : '';
        },

        worldRaw(id) { return this.getWorld(id)?.raw || ''; },
        styleRaw(id) { return this.getStyle(id)?.raw || ''; },
        presetRaw(id) { return this.getPreset(id)?.raw || ''; },

        matchPreset(world, style, template) {
            let best = '';
            let bestFill = 0;
            for (const id of this.presetIds()) {
                const p = this._presets[id];
                if (p.world && p.world !== world) continue;
                if (p.style && p.style !== style) continue;
                if (p.template && p.template !== template) continue;
                const filled = [p.world, p.style, p.template].filter(Boolean).length;
                if (filled && filled > bestFill) {
                    best = id;
                    bestFill = filled;
                }
            }
            return best;
        },

        blankWorld(name) {
            const id = slug(name);
            const title = String(name || '').trim() || 'Untitled';
            return `# NBS World: ${title}\n\n<skill name="setting" parent="narration" active="${id}">\nSetting: ${title}.\n\nAttitudes.\n\nHierarchy.\n\nRelationships.\n\nBelief.\n\nCommon life.\n</skill>\n`;
        },

        blankStyle(name) {
            const id = slug(name);
            const title = String(name || '').trim() || 'Untitled';
            return `# NBS Style: ${title}\n\n<skill name="style" parent="narration" active="${id}">\nStyle: ${title}.\n</skill>\n`;
        },

        blankPreset(name) {
            const title = String(name || '').trim() || 'Untitled';
            return `# NBS Preset: ${title}\nworld: \nstyle: \ntemplate: \n`;
        },

        blankTemplate(name) {
            const title = String(name || '').trim() || 'Untitled';
            return `# NBS Template: ${title}\n\n<capsule label="generic" trigger="anything else">\nWrite clear, grounded narration that advances the immediate moment and closes on something the player can act on.\n</capsule>\n`;
        },

        userStore() {
            return window.NBS.State.getSettings().userCartridges;
        },

        mergeUserLibrary() {
            const store = this.userStore();
            for (const [id, raw] of Object.entries(store.worlds || {})) {
                const item = this.parseWorld(raw, `user:${id}.md`);
                if (!item) continue;
                item.source = 'user';
                this._worlds[item.id] = item;
            }
            for (const [id, raw] of Object.entries(store.styles || {})) {
                const item = this.parseStyle(raw, `user:${id}.md`);
                if (!item) continue;
                item.source = 'user';
                this._styles[item.id] = item;
            }
            for (const [id, raw] of Object.entries(store.presets || {})) {
                const item = this.parsePreset(raw, `user:${id}.md`);
                if (!item) continue;
                item.source = 'user';
                this._presets[item.id] = item;
            }
            const T = window.NBS.Templates;
            if (T?.addUserTemplate) {
                for (const raw of Object.values(store.templates || {})) {
                    try { T.addUserTemplate(raw); } catch (err) {
                        console.warn('[NBS] User template skipped:', err.message);
                    }
                }
            }
        },

        saveUserRaw(kind, raw, previousId) {
            const parsers = {
                world: this.parseWorld,
                style: this.parseStyle,
                preset: this.parsePreset,
            };
            const maps = {
                world: this._worlds,
                style: this._styles,
                preset: this._presets,
            };
            const storeKey = { world: 'worlds', style: 'styles', preset: 'presets' }[kind];
            const parse = parsers[kind];
            if (!parse || !storeKey) throw new Error('Unknown cartridge kind');
            const item = parse.call(this, raw, `user:${kind}.md`);
            if (!item) throw new Error('Could not parse that markdown. Check the # NBS header and the skill block.');
            item.source = 'user';
            item.raw = String(raw || '').trim();
            const store = this.userStore();
            if (previousId && previousId !== item.id) delete store[storeKey][previousId];
            store[storeKey][item.id] = item.raw;
            maps[kind][item.id] = item;
            if (previousId && previousId !== item.id) {
                const shipped = this[`_shipped${kind[0].toUpperCase()}${kind.slice(1)}s`];
                if (shipped?.[previousId]) maps[kind][previousId] = { ...shipped[previousId] };
                else delete maps[kind][previousId];
            }
            window.NBS.State.saveSettings();
            return item;
        },

        deleteUser(kind, id) {
            const storeKey = { world: 'worlds', style: 'styles', preset: 'presets' }[kind];
            const maps = { world: this._worlds, style: this._styles, preset: this._presets };
            const shippedMaps = {
                world: this._shippedWorlds,
                style: this._shippedStyles,
                preset: this._shippedPresets,
            };
            if (!storeKey || !id) return { ok: false, reason: 'nothing selected' };
            const store = this.userStore();
            const hadUser = Object.prototype.hasOwnProperty.call(store[storeKey], id);
            const shipped = shippedMaps[kind]?.[id];
            if (!hadUser && shipped) return { ok: false, reason: 'shipped' };
            if (!hadUser && !shipped) return { ok: false, reason: 'missing' };
            delete store[storeKey][id];
            if (shipped) maps[kind][id] = { ...shipped };
            else delete maps[kind][id];
            window.NBS.State.saveSettings();
            return { ok: true, restored: !!shipped };
        },

        saveUserTemplate(raw, previousName) {
            const T = window.NBS.Templates;
            const { name } = T.importTemplateText(raw);
            const store = this.userStore();
            if (previousName && previousName !== name) delete store.templates[previousName];
            store.templates[name] = String(raw || '').trim();
            T.addUserTemplate(raw);
            if (previousName && previousName !== name && !store.templates[previousName]) {
                T.removeUserTemplate?.(previousName);
            }
            window.NBS.State.saveSettings();
            return name;
        },

        deleteUserTemplate(name) {
            const T = window.NBS.Templates;
            const store = this.userStore();
            const hadUser = Object.prototype.hasOwnProperty.call(store.templates || {}, name);
            const tpl = T._templates[name];
            if (!hadUser && tpl?.source !== 'user') return { ok: false, reason: 'shipped' };
            const shipped = !!T._shipped?.[name];
            delete store.templates[name];
            T.removeUserTemplate?.(name);
            window.NBS.State.saveSettings();
            return { ok: true, restored: shipped };
        },

        _substitute(text) {
            try {
                const fn = window.substituteParams
                    || window.NBS.getContext?.()?.substituteParams;
                if (typeof fn === 'function') return fn(text);
            } catch (err) {
                console.warn('[NBS] cartridge substitution failed:', err.message);
            }
            return text;
        },
    };

    window.NBS.Cartridges = Cartridges;
})();
