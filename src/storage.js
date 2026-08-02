(function () {
    'use strict';

    window.NBS = window.NBS || {};

    const SAFE_FILENAME_RE = /^[a-z0-9][a-z0-9_-]*$/i;

    function safeFilename(filename) {
        const clean = String(filename || '');
        if (!SAFE_FILENAME_RE.test(clean)) {
            throw new Error('Invalid NarratorTools filename');
        }
        return encodeURIComponent(clean);
    }

    const Storage = {

        // ── CSRF headers helper ───────────────────────────────────────────
        // Required for PUT/DELETE requests to ST's backend plugin routes.

        async getCsrfHeaders() {
            if (typeof getRequestHeaders === 'function') {
                return getRequestHeaders();
            }
            try {
                const res = await fetch('/csrf-token');
                const data = await res.json();
                return { 'Content-Type': 'application/json', 'X-CSRF-Token': data.token };
            } catch {
                return { 'Content-Type': 'application/json' };
            }
        },

        // ── Narrator Tools shared storage (narrator-tools-storage plugin) ─
        // Reads/writes JSON files in [ST root]/data/[user]/user/narrator_tools/
        // Requires the narrator-tools-storage backend plugin to be installed and
        // enableServerPlugins: true set in config.yaml.

        NarratorTools: {
            BASE_URL: '/api/plugins/narrator-tools-storage/files',

            async isAvailable() {
                try {
                    const res = await fetch('/api/plugins/narrator-tools-storage/health');
                    return res.ok;
                } catch { return false; }
            },

            async read(filename) {
                const res = await fetch(`${Storage.NarratorTools.BASE_URL}/${safeFilename(filename)}`);
                if (res.status === 404) return null;
                if (!res.ok) throw new Error(`NarratorTools read failed: ${res.status}`);
                return res.json();
            },

            async write(filename, data) {
                const headers = await Storage.getCsrfHeaders();
                const res = await fetch(`${Storage.NarratorTools.BASE_URL}/${safeFilename(filename)}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(data, null, 2),
                });
                if (!res.ok) {
                    const text = await res.text().catch(() => res.status);
                    throw new Error(`NarratorTools write failed (${res.status}): ${text}`);
                }
            },

            async delete(filename) {
                const headers = await Storage.getCsrfHeaders();
                const res = await fetch(`${Storage.NarratorTools.BASE_URL}/${safeFilename(filename)}`, {
                    method: 'DELETE',
                    headers,
                });
                if (!res.ok && res.status !== 404) {
                    throw new Error(`NarratorTools delete failed: ${res.status}`);
                }
            },
        },
    };

    window.NBS.Storage = Storage;
})();
