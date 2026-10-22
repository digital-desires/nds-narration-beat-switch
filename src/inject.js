// v0.2.1 — 2026-09-28
(function () {
    'use strict';

    window.NBS = window.NBS || {};

    let inFlight = null;

    const Inject = {
        suiteOn() {
            return window.NarratorSuiteMaster?.isEnabled?.() !== false;
        },

        async prepareForGeneration(dryRun) {
            if (dryRun) return;
            const context = window.NBS.getContext?.();
            if (String(context?.name2 || '').trim() === 'SillyTavern System') {
                window.NBS.State.setBeatVariable('');
                window.NBS.State.setChatVariable(window.NBS.VAR_WORLD, '');
                window.NBS.State.setChatVariable(window.NBS.VAR_STYLE, '');
                return;
            }
            if (!window.NBS.State.getSettings().enabled) {
                window.NBS.State.setBeatVariable('');
                window.NBS.State.setChatVariable(window.NBS.VAR_WORLD, '');
                window.NBS.State.setChatVariable(window.NBS.VAR_STYLE, '');
                return;
            }
            if (!Inject.suiteOn()) {
                window.NBS.State.setBeatVariable('');
                window.NBS.State.setChatVariable(window.NBS.VAR_WORLD, '');
                window.NBS.State.setChatVariable(window.NBS.VAR_STYLE, '');
                return;
            }

            // Coalesce overlapping hooks
            if (inFlight) {
                await inFlight;
                return;
            }

            inFlight = (async () => {
                const label = await window.NBS.Decide.run();
                const capsule = window.NBS.State.resolveCapsule(label);
                window.NBS.State.setBeatVariable(capsule);
                window.NBS.State.writeCartridgeVariables();
                window.NBS.State.log('injected', label, capsule ? capsule.slice(0, 80) : '(empty)');
                window.NBS.UI?.refreshStatus?.();
            })();

            try {
                await inFlight;
            } finally {
                inFlight = null;
            }
        },

        registerHook() {
            const ctx = window.NBS.getContext?.();
            const source = ctx?.eventSource;
            const types = ctx?.eventTypes || ctx?.event_types;
            if (!source || !types?.GENERATION_AFTER_COMMANDS) {
                console.warn('[NBS] GENERATION_AFTER_COMMANDS unavailable');
                return;
            }
            source.on(types.GENERATION_AFTER_COMMANDS, async (_type, _opts, dryRun) => {
                await Inject.prepareForGeneration(dryRun);
            });
            console.info('[NBS] Hooked GENERATION_AFTER_COMMANDS');
        },
    };

    window.NBS.Inject = Inject;
})();
