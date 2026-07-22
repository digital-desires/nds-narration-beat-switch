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
            if (!window.NBS.State.getSettings().enabled) {
                window.NBS.State.setBeatVariable('');
                return;
            }
            if (!Inject.suiteOn()) {
                window.NBS.State.setBeatVariable('');
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
