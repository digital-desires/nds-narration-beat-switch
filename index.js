/**
 * NDS: Narration Beat Switch v0.2.0
 * Classify beat → inject prose_style capsule via {{getvar::nds_beat_style}}
 * Capsules come from user-editable templates (see library/default_templates.js)
 */

(function () {
    'use strict';

    const TARGET_VERSION = '0.2.0';
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
        'library/default_templates.js',
        'src/storage.js',
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

        await window.NBS.Templates.loadFactoryTemplates();
        const settings = window.NBS.State.getSettings();
        window.NBS.Templates.normalizeSettings(settings);
        await window.NBS.Templates.loadTemplatesFromDisk();
        const ok = await window.NBS.State.loadAll();
        if (!ok) {
            console.warn('[NBS] Not ready — missing soul/skill/format md or empty template');
        }

        window.NBS.UI.ensureSettingsPanel();
        window.NBS.Inject.registerHook();

        // NDS: Control — power switch tab (retry until toolbar exists)
        window.NBS.UI.registerUnifiedToolbarButtons();
        document.addEventListener('st-unified-toolbar-ready', () => {
            window.NBS.UI.registerUnifiedToolbarButtons();
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
