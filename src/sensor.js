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
         * Current user action (primary) + one full prior round (previous user + assistant).
         */
        gather() {
            const ctx = window.NBS.getContext?.();
            const chat = Array.isArray(ctx?.chat) ? ctx.chat : (Array.isArray(window.chat) ? window.chat : []);
            const usable = chat.filter(m => m && typeof m.mes === 'string' && strip(m.mes) && !m.is_system);

            let currentUser = '';
            let lastUser = '';
            let lastAssistant = '';

            if (!usable.length) {
                return { currentUser, lastUser, lastAssistant, text: Sensor.format('', '', '') };
            }

            let i = usable.length - 1;

            // Prefer latest user as current action (normal generate path)
            if (usable[i].is_user) {
                currentUser = strip(usable[i].mes);
                i -= 1;
            } else {
                // Regenerate / continue: tip is assistant — use prior user as current
                lastAssistant = strip(usable[i].mes);
                i -= 1;
                while (i >= 0 && !usable[i].is_user) i -= 1;
                if (i >= 0) {
                    currentUser = strip(usable[i].mes);
                    i -= 1;
                }
            }

            // One full prior round: assistant then user walking backward
            while (i >= 0 && usable[i].is_user) i -= 1;
            if (i >= 0 && !usable[i].is_user) {
                lastAssistant = strip(usable[i].mes);
                i -= 1;
            }
            while (i >= 0 && !usable[i].is_user) i -= 1;
            if (i >= 0 && usable[i].is_user) {
                lastUser = strip(usable[i].mes);
            }

            return {
                currentUser,
                lastUser,
                lastAssistant,
                text: Sensor.format(currentUser, lastUser, lastAssistant),
            };
        },

        format(currentUser, lastUser, lastAssistant) {
            return [
                '## CURRENT USER ACTION (primary)',
                currentUser || '(empty)',
                '',
                '## LAST ROUND (context only)',
                '### Previous user',
                lastUser || '(none)',
                '### Previous assistant',
                lastAssistant || '(none)',
            ].join('\n');
        },
    };

    window.NBS.Sensor = Sensor;
})();
