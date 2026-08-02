(function () {
    'use strict';

    window.NBS = window.NBS || {};

    const Decide = {
        buildSystemPrompt() {
            const S = window.NBS.State;
            // Index is rebuilt every call so template edits apply immediately.
            const index = window.NBS.Templates.buildClassifierIndex();
            return [S.soul, S.skillDecide, S.formatRules, index]
                .filter(Boolean)
                .join('\n\n---\n\n');
        },

        parseLabel(raw) {
            try {
                let text = String(raw || '').trim();
                const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
                if (fence) text = fence[1].trim();
                const obj = JSON.parse(text);
                return window.NBS.State.normalizeLabel(obj?.style);
            } catch (_) {
                const m = String(raw || '').match(/"style"\s*:\s*"([a-z0-9_-]+)"/i);
                if (m) return window.NBS.State.normalizeLabel(m[1]);
                return window.NBS.Templates.getFallbackLabel();
            }
        },

        async run() {
            const S = window.NBS.State;
            const fallback = () => window.NBS.Templates.getFallbackLabel();
            if (!S.ready) {
                S.lastError = 'Prompt md / template not loaded';
                return fallback();
            }
            const system = Decide.buildSystemPrompt();
            if (!system.trim()) {
                S.lastError = 'Empty classifier system prompt';
                return fallback();
            }
            const sensor = window.NBS.Sensor.gather();
            S.log('sensor', sensor);
            try {
                const raw = await window.NBS.API.classify(system, sensor.text);
                const label = Decide.parseLabel(raw);
                S.lastLabel = label;
                S.lastError = '';
                S.log('label', label, raw);
                return label;
            } catch (err) {
                S.lastError = err.message || String(err);
                S.lastLabel = fallback();
                console.warn('[NBS] classify failed → fallback:', S.lastError);
                return S.lastLabel;
            }
        },
    };

    window.NBS.Decide = Decide;
})();
