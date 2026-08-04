/**
 * NDS: Narration Beat Switch v0.4.0
 * Classify beat → inject scene_directive capsule via {{getvar::nds_beat_style}}
 * Capsules come from the .md files in library/templates/ — read fresh every
 * boot, no cache. Edit them with tools/nbs_template_editor.py.
 */

(function () {
    'use strict';

    const TARGET_VERSION = '0.4.0';
    console.log(`[NBS ${TARGET_VERSION}] Loading…`);

    function getExtensionRoot() {
        const marker = 'nds-narration-beat-switch';
        const currentScriptSrc = document.currentScript?.src;
        if (currentScriptSrc) return new URL('.', currentScriptSrc);

        const scripts = Array.from(document.scripts).reverse();
        const match = scripts.find(s => s.src && s.src.includes('/index.js')
            && s.src.toLowerCase().includes(marker));
        if (match?.src) return new URL('.', match.src);

        return new URL(`/scripts/extensions/third-party/${marker}/`, window.location.origin);
    }

    const extensionRoot = getExtensionRoot();
    window.NBS_EXTENSION_ROOT = extensionRoot;
    window.NBS = window.NBS || {};

    window.NBS.getContext = function getContext() {
        try {
            if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
                return SillyTavern.getContext();
            }
        } catch (_) { /* ignore */ }
        return {
            chat: window.chat,
            chatMetadata: window.chat_metadata,
            chat_metadata: window.chat_metadata,
            extensionSettings: window.extension_settings,
            eventSource: window.eventSource,
            eventTypes: window.event_types,
            event_types: window.event_types,
            saveSettingsDebounced: window.saveSettingsDebounced,
        };
    };

    const modules = [
        'lib/nds_dual_mode.js',
        'library/default_templates.js',
        'src/state.js',
        'src/templates.js',
        'src/api.js',
        'src/sensor.js',
        'src/decide.js',
        'src/inject.js',
        'src/ui.js',
    ];

    function loadModule(path) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = new URL(path, extensionRoot).href;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${path}`));
            document.head.appendChild(script);
        });
    }

    async function boot() {
        for (const path of modules) {
            await loadModule(path);
            console.log(`[NBS] Loaded ${path}`);
        }

        // The .md files in library/templates/ are the only source of truth.
        // Read fresh every boot — no cache, no settings copy, no seeding.
        await window.NBS.Templates.loadFromDisk();
        const ok = await window.NBS.State.loadAll();
        if (!ok) {
            console.warn('[NBS] Not ready — missing soul/skill/format md or empty template');
        }

        window.NBS.UI.ensureSettingsPanel();
        window.NBS.Inject.registerHook();

        // NDS: Control — dual-mode chrome (suite or standalone shell)
        window.NBS.UI.bootChrome();
        document.addEventListener('st-unified-toolbar-ready', () => {
            window.NBS.UI.bootChrome();
        });
        document.addEventListener('narrator-suite-master-changed', () => {
            window.STUnifiedToolbar?.update?.();
        });

        const tpl = window.NBS.Templates.getActiveTemplate();
        console.log(`[NBS ${TARGET_VERSION}] Ready (template="${window.NBS.Templates.getActiveTemplateName()}", capsules=${tpl?.capsules?.length || 0})`);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { boot().catch(err => console.error('[NBS] boot failed', err)); }, { once: true });
    } else {
        boot().catch(err => console.error('[NBS] boot failed', err));
    }
})();
