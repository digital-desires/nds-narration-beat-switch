(function () {
    'use strict';

    window.NBS = window.NBS || {};

    function strip(mes) {
        return String(mes || '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    const Sensor = {
        /**
         * PRIMARY: latest user message as an unresolved intended action.
         * SECONDARY: the immediately preceding user/assistant round as context.
         * A prior generated answer to the primary action is excluded during regenerate.
         */
        gather() {
            const ctx = window.NBS.getContext?.();
            const chat = Array.isArray(ctx?.chat) ? ctx.chat : (Array.isArray(window.chat) ? window.chat : []);
            const usable = chat.filter(m => m && typeof m.mes === 'string' && strip(m.mes) && !m.is_system);

            let currentIndex = -1;
            for (let i = usable.length - 1; i >= 0; i -= 1) {
                if (usable[i].is_user) {
                    currentIndex = i;
                    break;
                }
            }

            if (currentIndex < 0) {
                return {
                    intendedAction: '',
                    lastRound: { user: '', assistant: '' },
                    text: Sensor.format({ user: '', assistant: '' }, ''),
                };
            }

            const intendedAction = strip(usable[currentIndex].mes);
            const completedRounds = [];

            for (let i = 0; i < currentIndex; i += 1) {
                const message = usable[i];
                const text = strip(message.mes);
                if (message.is_user) {
                    completedRounds.push({ user: text, assistant: '' });
                    continue;
                }

                if (!completedRounds.length || completedRounds[completedRounds.length - 1].assistant) {
                    completedRounds.push({ user: '', assistant: text });
                } else {
                    completedRounds[completedRounds.length - 1].assistant = text;
                }
            }

            const lastRound = completedRounds[completedRounds.length - 1]
                || { user: '', assistant: '' };
            return {
                intendedAction,
                lastRound,
                text: Sensor.format(lastRound, intendedAction),
            };
        },

        format(lastRound, intendedAction) {
            return [
                '## SECONDARY — LAST ROUND (CONTEXT)',
                'Use this only to understand the scene surrounding the primary intention.',
                '### Previous user',
                lastRound.user || '(none)',
                '### Previous assistant',
                lastRound.assistant || '(none)',
                '',
                '## PRIMARY — USER INTENDED ACTION (UNRESOLVED)',
                'This is the decision target. It has not succeeded, failed, or been resolved.',
                intendedAction || '(empty)',
            ].join('\n');
        },
    };

    window.NBS.Sensor = Sensor;
})();
