/**
 * NDS dual-mode chrome bootstrap (suite Control vs standalone NarratorToolShell).
 * Attach as window.NDSDualMode — copyable; safe if loaded twice.
 */
(function () {
    'use strict';
    if (window.NDSDualMode?.__ready) return;

    function waitForSuite(ms = 4000) {
        return new Promise((resolve) => {
            if (window.STUnifiedToolbar) {
                resolve(window.STUnifiedToolbar);
                return;
            }
            let done = false;
            const finish = (tb) => {
                if (done) return;
                done = true;
                document.removeEventListener('st-unified-toolbar-ready', onReady);
                resolve(tb || null);
            };
            const onReady = (e) => finish(e.detail || window.STUnifiedToolbar);
            document.addEventListener('st-unified-toolbar-ready', onReady);
            setTimeout(() => finish(window.STUnifiedToolbar || null), ms);
        });
    }

    function loadScript(url) {
        return new Promise((resolve, reject) => {
            if (!url) {
                reject(new Error('No script URL'));
                return;
            }
            const existing = Array.from(document.scripts).find((s) => s.src && s.src.includes('nds_tool_shell.js'));
            if (existing && window.NarratorToolShell?.__ndsShellReady) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${url}`));
            document.head.appendChild(script);
        });
    }

    function resolveShellUrl(explicitUrl) {
        if (explicitUrl) return explicitUrl;
        // Prefer same-folder lib next to the calling extension's index if discoverable
        const scripts = Array.from(document.scripts).reverse();
        const hit = scripts.find((s) => s.src && /\/nds-[^/]+\/(index\.js|src\/|lib\/|modules\/)/.test(s.src));
        if (hit?.src) {
            try {
                const u = new URL(hit.src);
                // Walk up to extension root (folder that contains index.js)
                const parts = u.pathname.split('/');
                const extIdx = parts.findIndex((p, i) => p.startsWith('nds-') && parts[i + 1]);
                if (extIdx >= 0) {
                    const rootParts = parts.slice(0, extIdx + 1);
                    return `${u.origin}${rootParts.join('/')}/lib/nds_tool_shell.js`;
                }
            } catch (_) { /* ignore */ }
        }
        return null;
    }

    /**
     * @param {{
     *   id: string,
     *   title: string,
     *   icon?: string,
     *   storageKey?: string,
     *   isEnabled: () => boolean,
     *   setEnabled: (on: boolean) => void,
     *   getActions: () => Array<object>,
     *   onSuite?: () => void,
     *   onStandalone?: () => void,
     *   shellScriptUrl?: string,
     *   waitMs?: number,
     *   defaultRight?: number,
     *   defaultBottom?: number,
     * }} opts
     */
    async function boot(opts) {
        if (!opts?.id || typeof opts.getActions !== 'function') return 'invalid';

        const suite = await waitForSuite(opts.waitMs ?? 4000);
        const actions = opts.getActions() || [];

        if (suite) {
            window.NarratorToolShell?.unmount?.(opts.id);
            for (const action of actions) suite.register(action);
            suite.update?.();
            opts.onSuite?.();
            return 'suite';
        }

        try {
            if (!window.NarratorToolShell?.__ndsShellReady) {
                const url = resolveShellUrl(opts.shellScriptUrl);
                if (url) await loadScript(url);
            }
        } catch (err) {
            console.warn(`[NDSDualMode] shell load failed for ${opts.id}:`, err);
        }

        const shell = window.NarratorToolShell;
        if (!shell?.mount) {
            console.warn(`[NDSDualMode] ${opts.id}: no suite and no NarratorToolShell — chrome unavailable`);
            opts.onStandalone?.(null);
            return 'none';
        }

        const strip = (a) => {
            const { group, groupLabel, groupIcon, ...rest } = a;
            return rest;
        };

        shell.mount({
            id: opts.id,
            title: opts.title,
            icon: opts.icon || 'fa-sliders',
            storageKey: opts.storageKey || `nds-tool-shell-${opts.id}`,
            isEnabled: opts.isEnabled,
            setEnabled: opts.setEnabled,
            actions: actions.map(strip),
            defaultRight: opts.defaultRight,
            defaultBottom: opts.defaultBottom,
        });
        opts.onStandalone?.(shell);
        return 'standalone';
    }

    window.NDSDualMode = {
        __ready: true,
        waitForSuite,
        loadScript,
        boot,
    };
})();
