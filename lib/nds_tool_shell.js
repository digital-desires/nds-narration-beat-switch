/**
 * NDS: NarratorToolShell — mini Control for standalone tool mode.
 * Copyable into sibling extensions. When Control is loaded, tools should
 * register into STUnifiedToolbar instead of mounting this shell.
 *
 * Public API (window.NarratorToolShell):
 *   .mount({ id, title, icon, storageKey, isEnabled, setEnabled, actions })
 *   .unmount(id)
 *   .ensureChromeStyles()
 *   .makeDraggableFab(el, options)
 *   .clampToViewport(el)
 */
(function () {
    'use strict';

    if (window.NarratorToolShell?.__ndsShellReady) return;

    const STYLE_ID = 'nds-chrome-style';
    const mounted = new Map();

    /** Fallback styles if theme.css was not loaded (vendored shell without Control). */
    const FALLBACK_CSS = `
:root {
    --nds-surface: var(--SmartThemeBlurTintColor, #171b21);
    --nds-surface-raised: var(--black30a, rgba(0, 0, 0, 0.3));
    --nds-border: var(--SmartThemeBorderColor, #3a4654);
    --nds-text: var(--SmartThemeBodyColor, #d8dee7);
    --nds-text-muted: color-mix(in srgb, var(--nds-text) 55%, transparent);
    --nds-accent: var(--SmartThemeQuoteColor, #8cc8ff);
    --nds-on: #54e08f;
    --nds-off: #ff6b6b;
    --nds-warn: #ffd86e;
    --nds-radius: 7px;
    --nds-radius-sm: 5px;
    --nds-fab-size: 44px;
}
.nds-fab { position:fixed;z-index:12000;width:var(--nds-fab-size);height:var(--nds-fab-size);border-radius:50%;border:1.5px solid color-mix(in srgb,var(--nds-accent) 40%,transparent);background:var(--nds-surface);color:var(--nds-accent);cursor:grab;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 8px 24px rgba(0,0,0,.55);touch-action:none;user-select:none; }
.nds-fab.nds-fab-open { color:var(--nds-on);border-color:color-mix(in srgb,var(--nds-on) 65%,transparent); }
.nds-fab.nds-fab-off { color:var(--nds-off);border-color:color-mix(in srgb,var(--nds-off) 55%,transparent); }
.nds-fab.nds-fab-warning { animation:nds-fab-pulse 2s ease-in-out infinite; }
@keyframes nds-fab-pulse { 0%,100%{box-shadow:0 8px 24px rgba(0,0,0,.55),0 0 0 0 color-mix(in srgb,var(--nds-off) 45%,transparent)} 50%{box-shadow:0 8px 24px rgba(0,0,0,.55),0 0 0 9px transparent} }
.nds-chrome-win { position:fixed;z-index:12001;width:320px;height:220px;min-width:220px;min-height:140px;color:var(--nds-text);font-family:system-ui,sans-serif;background:var(--nds-surface);border:1px solid var(--nds-border);border-radius:var(--nds-radius);box-shadow:0 12px 36px rgba(0,0,0,.48);display:flex;flex-direction:column;overflow:hidden;resize:both; }
.nds-chrome-win.nds-win-hidden { opacity:0;transform:scale(.94) translateY(8px);pointer-events:none; }
.nds-chrome-titlebar { display:flex;align-items:center;justify-content:space-between;padding:6px 10px;cursor:grab;user-select:none;flex-shrink:0;background:var(--nds-surface-raised);border-bottom:1px solid var(--nds-border); }
.nds-chrome-title { font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--nds-accent);display:flex;align-items:center;gap:7px; }
.nds-chrome-close { width:22px;height:22px;border-radius:var(--nds-radius-sm);border:1px solid transparent;background:transparent;color:var(--nds-text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px; }
.nds-chrome-master-row { display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid var(--nds-border); }
.nds-chrome-master-label { font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--nds-text-muted);flex:1; }
.nds-chrome-status { font-size:9px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:2px 7px;border-radius:4px; }
.nds-chrome-status.nds-status-on { color:var(--nds-on);background:color-mix(in srgb,var(--nds-on) 12%,transparent); }
.nds-chrome-status.nds-status-off { color:#ff9b9b;background:color-mix(in srgb,var(--nds-off) 12%,transparent); }
.nds-master-switch { position:relative;width:38px;height:20px;flex-shrink:0; }
.nds-master-switch input { opacity:0;width:0;height:0; }
.nds-master-slider { position:absolute;inset:0;border-radius:10px;background:color-mix(in srgb,var(--nds-off) 40%,transparent);cursor:pointer; }
.nds-master-slider::before { content:'';position:absolute;left:2px;top:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .2s; }
.nds-master-switch input:checked + .nds-master-slider { background:color-mix(in srgb,var(--nds-on) 55%,transparent); }
.nds-master-switch input:checked + .nds-master-slider::before { transform:translateX(18px); }
.nds-chrome-body { display:flex;flex:1;overflow:hidden;min-height:0; }
.nds-chrome-content { flex:1;padding:9px;display:flex;flex-wrap:wrap;gap:6px;align-content:flex-start;overflow-y:auto; }
.nds-chrome-btn { display:inline-flex;align-items:center;gap:7px;padding:6px 11px;border-radius:var(--nds-radius-sm);border:1px solid var(--nds-border);background:var(--nds-surface-raised);color:var(--nds-text);font-size:11.5px;font-weight:500;cursor:pointer;white-space:nowrap; }
.nds-chrome-btn.nds-btn-active { border-color:color-mix(in srgb,var(--nds-on) 55%,transparent);color:var(--nds-on); }
.nds-chrome-btn.nds-btn-warning { border-color:color-mix(in srgb,var(--nds-off) 50%,transparent);color:#ff9b9b; }
.nds-chrome-btn.nds-btn-secondary { border-color:color-mix(in srgb,var(--nds-accent) 28%,var(--nds-border));color:color-mix(in srgb,var(--nds-accent) 85%,var(--nds-text)); }
.nds-chrome-btn.nds-btn-master { border-color:color-mix(in srgb,var(--nds-accent) 50%,transparent);color:var(--nds-accent);font-weight:600; }
.nds-chrome-empty { color:var(--nds-text-muted);font-size:11px;font-style:italic;padding:4px;width:100%; }
.nds-chrome-win.nds-suite-off .nds-chrome-content { opacity:.35;pointer-events:none; }
.st-unified-hidden-control { display:none !important; }
`;

    function ensureChromeStyles() {
        if (document.getElementById(STYLE_ID)) return;
        if (document.querySelector('link[href*="nds-control"][href*="theme.css"]')) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = FALLBACK_CSS;
        document.head.appendChild(style);
    }

    function loadJson(key, fallback) {
        try {
            const v = JSON.parse(localStorage.getItem(key) || 'null');
            return v ?? fallback;
        } catch (_) {
            return fallback;
        }
    }

    function saveJson(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* ignore */ }
    }

    function clampToViewport(el, pad = 8) {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const w = rect.width || el.offsetWidth || 44;
        const h = rect.height || el.offsetHeight || 44;
        let left = rect.left;
        let top = rect.top;
        left = Math.max(pad, Math.min(window.innerWidth - w - pad, left));
        top = Math.max(pad, Math.min(window.innerHeight - h - pad, top));
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        el.style.right = 'auto';
        el.style.bottom = 'auto';
    }

    /**
     * Make a FAB draggable with position memory. Click (no drag) calls onToggle.
     * @param {HTMLElement} el
     * @param {{ storageKey: string, onToggle?: () => void, defaultRight?: number, defaultBottom?: number }} options
     */
    function makeDraggableFab(el, options = {}) {
        const {
            storageKey,
            onToggle,
            defaultRight = 20,
            defaultBottom = 20,
        } = options;

        const saved = loadJson(storageKey, null);
        if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
            el.style.left = `${saved.left}px`;
            el.style.top = `${saved.top}px`;
            el.style.right = 'auto';
            el.style.bottom = 'auto';
            requestAnimationFrame(() => clampToViewport(el));
        } else {
            el.style.right = `${defaultRight}px`;
            el.style.bottom = `${defaultBottom}px`;
            el.style.left = 'auto';
            el.style.top = 'auto';
        }

        let dragging = false;
        let moved = false;
        let startX = 0;
        let startY = 0;
        let origLeft = 0;
        let origTop = 0;
        const THRESHOLD = 5;

        function persist() {
            const rect = el.getBoundingClientRect();
            saveJson(storageKey, { left: Math.round(rect.left), top: Math.round(rect.top) });
        }

        function onPointerDown(e) {
            if (e.button != null && e.button !== 0) return;
            dragging = true;
            moved = false;
            const rect = el.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            origLeft = rect.left;
            origTop = rect.top;
            el.style.left = `${origLeft}px`;
            el.style.top = `${origTop}px`;
            el.style.right = 'auto';
            el.style.bottom = 'auto';
            el.classList.add('nds-fab-dragging');
            el.setPointerCapture?.(e.pointerId);
            e.preventDefault();
        }

        function onPointerMove(e) {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (!moved && (Math.abs(dx) > THRESHOLD || Math.abs(dy) > THRESHOLD)) {
                moved = true;
            }
            if (!moved) return;
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            const left = Math.max(0, Math.min(window.innerWidth - w, origLeft + dx));
            const top = Math.max(0, Math.min(window.innerHeight - h, origTop + dy));
            el.style.left = `${left}px`;
            el.style.top = `${top}px`;
        }

        function onPointerUp(e) {
            if (!dragging) return;
            dragging = false;
            el.classList.remove('nds-fab-dragging');
            try { el.releasePointerCapture?.(e.pointerId); } catch (_) { /* ignore */ }
            if (moved) {
                clampToViewport(el);
                persist();
            } else {
                onToggle?.();
            }
        }

        el.addEventListener('pointerdown', onPointerDown);
        el.addEventListener('pointermove', onPointerMove);
        el.addEventListener('pointerup', onPointerUp);
        el.addEventListener('pointercancel', onPointerUp);

        const onResize = () => clampToViewport(el);
        window.addEventListener('resize', onResize);

        return () => {
            el.removeEventListener('pointerdown', onPointerDown);
            el.removeEventListener('pointermove', onPointerMove);
            el.removeEventListener('pointerup', onPointerUp);
            el.removeEventListener('pointercancel', onPointerUp);
            window.removeEventListener('resize', onResize);
        };
    }

    function makeDraggableWindow(win, titlebar, storageKey, closeSelector) {
        const saved = loadJson(storageKey, null);
        if (saved?.left != null && saved?.top != null) {
            win.style.left = typeof saved.left === 'number' ? `${saved.left}px` : saved.left;
            win.style.top = typeof saved.top === 'number' ? `${saved.top}px` : saved.top;
            win.style.right = 'auto';
            win.style.bottom = 'auto';
        }
        if (saved?.width) win.style.width = typeof saved.width === 'number' ? `${saved.width}px` : saved.width;
        if (saved?.height) win.style.height = typeof saved.height === 'number' ? `${saved.height}px` : saved.height;

        let dragX, dragY, dragLeft, dragTop;

        titlebar.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            if (closeSelector && e.target.closest(closeSelector)) return;
            e.preventDefault();
            const rect = win.getBoundingClientRect();
            dragX = e.clientX;
            dragY = e.clientY;
            dragLeft = rect.left;
            dragTop = rect.top;

            function onMove(ev) {
                const newLeft = Math.max(0, Math.min(window.innerWidth - win.offsetWidth, dragLeft + (ev.clientX - dragX)));
                const newTop = Math.max(0, Math.min(window.innerHeight - win.offsetHeight, dragTop + (ev.clientY - dragY)));
                win.style.left = `${newLeft}px`;
                win.style.top = `${newTop}px`;
                win.style.right = 'auto';
                win.style.bottom = 'auto';
            }
            function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                const s = loadJson(storageKey, {});
                s.left = win.style.left;
                s.top = win.style.top;
                saveJson(storageKey, s);
            }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });

        if (typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(() => {
                const s = loadJson(storageKey, {});
                if (win.style.width) s.width = win.style.width;
                if (win.style.height) s.height = win.style.height;
                saveJson(storageKey, s);
            }).observe(win);
        }

        win.addEventListener('mousedown', () => {
            window.NarratorZIndexManager?.focus?.(win);
        });
    }

    function renderActions(contentEl, actions, onAfterClick) {
        contentEl.replaceChildren();
        const list = (actions || [])
            .filter((a) => !a.visible || a.visible())
            .sort((a, b) => (b.master ? 1 : 0) - (a.master ? 1 : 0));

        if (!list.length) {
            contentEl.innerHTML = '<div class="nds-chrome-empty">No controls available.</div>';
            return;
        }

        for (const action of list) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'nds-chrome-btn';
            btn.title = action.title || action.id;
            if (action.active?.()) btn.classList.add('nds-btn-active');
            else if (action.warning?.()) btn.classList.add('nds-btn-warning');
            else if (action.master) btn.classList.add('nds-btn-master');
            else if (action.secondary) btn.classList.add('nds-btn-secondary');
            btn.innerHTML = `<i class="fa-solid ${action.icon || 'fa-circle'}"></i><span>${action.title || action.id}</span>`;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                action.onClick?.();
                setTimeout(() => onAfterClick?.(), 0);
            });
            contentEl.appendChild(btn);
        }
    }

    /**
     * @param {{
     *   id: string,
     *   title?: string,
     *   icon?: string,
     *   storageKey?: string,
     *   isEnabled?: () => boolean,
     *   setEnabled?: (on: boolean) => void,
     *   actions?: Array<object>,
     *   defaultRight?: number,
     *   defaultBottom?: number,
     * }} config
     */
    function mount(config) {
        if (!config?.id) return null;
        ensureChromeStyles();
        unmount(config.id);

        const id = config.id;
        const title = config.title || id;
        const icon = config.icon || 'fa-sliders';
        const storageKey = config.storageKey || `nds-tool-shell-${id}`;
        const fabKey = `${storageKey}-fab`;
        const winKey = `${storageKey}-win`;
        const isEnabled = typeof config.isEnabled === 'function' ? config.isEnabled : () => true;
        const setEnabled = typeof config.setEnabled === 'function' ? config.setEnabled : () => {};

        let actions = Array.isArray(config.actions) ? [...config.actions] : [];

        const fab = document.createElement('button');
        fab.type = 'button';
        fab.className = 'nds-fab';
        fab.id = `nds-tool-shell-fab-${id}`;
        fab.title = title;
        fab.setAttribute('aria-label', `Toggle ${title}`);
        fab.setAttribute('aria-expanded', 'false');
        fab.innerHTML = `<i class="fa-solid ${icon}"></i>`;
        document.body.appendChild(fab);

        const win = document.createElement('div');
        win.className = 'nds-chrome-win nds-tool-shell-win nds-win-hidden';
        win.id = `nds-tool-shell-win-${id}`;
        const enabled = isEnabled() !== false;
        win.innerHTML = `
            <div class="nds-chrome-titlebar" data-role="titlebar">
                <div class="nds-chrome-title">
                    <i class="fa-solid ${icon}"></i>
                    ${title}
                </div>
                <button class="nds-chrome-close" type="button" title="Close" data-role="close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="nds-chrome-master-row">
                <span class="nds-chrome-master-label">Enabled</span>
                <span class="nds-chrome-status ${enabled ? 'nds-status-on' : 'nds-status-off'}" data-role="status">${enabled ? 'ON' : 'OFF'}</span>
                <label class="nds-master-switch" title="Enable / disable this tool">
                    <input type="checkbox" data-role="enable" ${enabled ? 'checked' : ''}>
                    <span class="nds-master-slider"></span>
                </label>
            </div>
            <div class="nds-chrome-body">
                <div class="nds-chrome-content" data-role="content"></div>
            </div>
        `;
        if (!enabled) win.classList.add('nds-suite-off');
        document.body.appendChild(win);

        // Place window near default FAB area if no saved pos
        if (!loadJson(winKey, null)) {
            win.style.right = `${(config.defaultRight ?? 20) + 56}px`;
            win.style.bottom = `${config.defaultBottom ?? 20}px`;
        }

        const titlebar = win.querySelector('[data-role="titlebar"]');
        const contentEl = win.querySelector('[data-role="content"]');
        const statusEl = win.querySelector('[data-role="status"]');
        const enableCb = win.querySelector('[data-role="enable"]');

        makeDraggableWindow(win, titlebar, winKey, '[data-role="close"]');

        function syncEnableUI() {
            const on = isEnabled() !== false;
            if (enableCb) enableCb.checked = on;
            if (statusEl) {
                statusEl.textContent = on ? 'ON' : 'OFF';
                statusEl.className = `nds-chrome-status ${on ? 'nds-status-on' : 'nds-status-off'}`;
            }
            win.classList.toggle('nds-suite-off', !on);
            fab.classList.toggle('nds-fab-off', !on);
        }

        function anyWarning() {
            return actions.some((a) => {
                if (a.visible && !a.visible()) return false;
                return Boolean(a.warning?.());
            });
        }

        function render() {
            syncEnableUI();
            renderActions(contentEl, actions, render);
            fab.classList.toggle('nds-fab-warning', anyWarning());
        }

        function openWindow() {
            win.classList.remove('nds-win-hidden');
            fab.classList.add('nds-fab-open');
            fab.setAttribute('aria-expanded', 'true');
            window.NarratorZIndexManager?.focus?.(win);
            render();
        }

        function closeWindow() {
            win.classList.add('nds-win-hidden');
            fab.classList.remove('nds-fab-open');
            fab.setAttribute('aria-expanded', 'false');
        }

        function toggleWindow() {
            win.classList.contains('nds-win-hidden') ? openWindow() : closeWindow();
        }

        const disposeFab = makeDraggableFab(fab, {
            storageKey: fabKey,
            onToggle: toggleWindow,
            defaultRight: config.defaultRight ?? 20,
            defaultBottom: config.defaultBottom ?? 20,
        });

        win.querySelector('[data-role="close"]').addEventListener('click', closeWindow);
        enableCb?.addEventListener('change', (e) => {
            setEnabled(Boolean(e.target.checked));
            render();
        });

        render();

        const api = {
            id,
            update(next) {
                if (next?.actions) actions = [...next.actions];
                if (!win.classList.contains('nds-win-hidden')) render();
                else {
                    syncEnableUI();
                    fab.classList.toggle('nds-fab-warning', anyWarning());
                }
            },
            open: openWindow,
            close: closeWindow,
            destroy() {
                disposeFab?.();
                fab.remove();
                win.remove();
                mounted.delete(id);
            },
        };

        mounted.set(id, api);
        return api;
    }

    function unmount(id) {
        const existing = mounted.get(id);
        if (existing) existing.destroy();
    }

    window.NarratorToolShell = {
        __ndsShellReady: true,
        mount,
        unmount,
        ensureChromeStyles,
        makeDraggableFab,
        clampToViewport,
        isMounted(id) { return mounted.has(id); },
    };
})();
