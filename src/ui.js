(function () {
    'use strict';

    window.NBS = window.NBS || {};

    const UI = {
        _toolbarRegistered: false,
        _toolbarRetryTimer: null,

        ensureSettingsPanel() {
            if (document.getElementById('nbs-settings')) return;
            const target = document.querySelector('#extensions_settings2')
                || document.querySelector('#extensions_settings');
            if (!target) return;

            const wrap = document.createElement('div');
            wrap.id = 'nbs-settings';
            wrap.innerHTML = `
                <div class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>NDS: Narration Beat Switch</b>
                        <div class="inline-drawer-icon fa-solid fa-chevron-down down"></div>
                    </div>
                    <div class="inline-drawer-content">
                        <div class="nbs-settings-row">
                            <label class="checkbox_label"><input type="checkbox" id="nbs-enabled"> <span>Enable beat style classify + inject</span></label>
                        </div>
                        <div class="nbs-settings-row">
                            <label class="checkbox_label"><input type="checkbox" id="nbs-use-tracker"> <span>Use NDS: Tracker OpenRouter settings</span></label>
                        </div>
                        <div class="nbs-hint">When Tracker key/model are available they are reused. Uncheck to use local fields below.</div>
                        <div id="nbs-local-or" class="nbs-local-or">
                            <div class="nbs-field"><label>API Key</label><input id="nbs-or-key" class="text_pole" type="password"></div>
                            <div class="nbs-field"><label>Model id</label><input id="nbs-or-model" class="text_pole" type="text" placeholder="provider/model"></div>
                            <div class="nbs-field"><label>Temperature</label><input id="nbs-or-temp" class="text_pole" type="number" step="0.1"></div>
                            <div class="nbs-field"><label>Max tokens</label><input id="nbs-or-max" class="text_pole" type="number"></div>
                        </div>
                        <div class="nbs-field"><label>Timeout (ms)</label><input id="nbs-timeout" class="text_pole" type="number"></div>
                        <hr>
                        <div class="nbs-templates">
                            <b>Templates &amp; Capsules</b>
                            <div class="nbs-hint">A template is a full set of styles. The classifier only sees the capsules of the active template. Pick which one is active here; edit them in the desktop editor.</div>
                            <div class="nbs-field"><label>Active template</label>
                                <div class="nbs-row-inline">
                                    <select id="nbs-template-select" class="text_pole"></select>
                                </div>
                            </div>
                            <div class="nbs-field"><label>Capsule</label>
                                <div class="nbs-row-inline">
                                    <select id="nbs-capsule-select" class="text_pole"></select>
                                </div>
                            </div>
                            <div class="nbs-field"><label>Label</label><input id="nbs-capsule-label" class="text_pole" type="text" readonly></div>
                            <div class="nbs-field"><label>Trigger <span class="nbs-hint-inline">(tells the classifier when to pick this style)</span> <span id="nbs-trigger-count"></span></label><input id="nbs-capsule-trigger" class="text_pole" type="text" readonly></div>
                            <div class="nbs-field"><label>Body <span class="nbs-hint-inline">(the instructions injected into the prompt)</span> <span id="nbs-body-count"></span></label><textarea id="nbs-capsule-body" class="text_pole" rows="12" readonly></textarea></div>
                            <div class="nbs-row-inline">
                                <button id="nbs-copy-btn" class="menu_button">Copy as text</button>
                            </div>
                            <div class="nbs-hint">
                                Templates are plain <code>.md</code> files in <code>library/templates/</code> — one file per template, read fresh every time SillyTavern loads. Nothing is cached and nothing is protected: edit any of them, including the default.
                                <br><br>
                                To edit: run <code>tools/NBS Template Editor.bat</code> (or <code>python tools/nbs_template_editor.py</code>), make your changes, then reload this page (F5).
                            </div>
                            <textarea id="nbs-io-textarea" class="text_pole" rows="6" readonly hidden></textarea>
                        </div>
                        <hr>
                        <div class="nbs-settings-row">
                            <label class="checkbox_label"><input type="checkbox" id="nbs-debug"> <span>Debug console logs</span></label>
                        </div>
                        <div id="nbs-status" class="nbs-status">Last label: —</div>
                    </div>
                </div>
            `;
            target.appendChild(wrap);
            UI.bindSettings();
            UI.bindTemplateUi();
            UI.loadTemplateIntoDraft(window.NBS.Templates.getActiveTemplateName());
            UI.syncSettingsUi();
        },

        // ── Template picker + read-only viewer ────────────────────────────
        // Templates are .md files in library/templates/ and the browser cannot
        // write there. Editing lives in the desktop editor (tools/); this panel
        // chooses which template is active and shows what is in it.

        _viewName: null,
        _capIdx: 0,

        _toast(msg, type = 'info') {
            if (window.toastr?.[type]) window.toastr[type](msg, 'Beat Switch');
            else console.log(`[NBS] ${type}: ${msg}`);
        },

        loadTemplateIntoDraft(name) {
            const T = window.NBS.Templates;
            if (!T._templates[name]) name = T.getActiveTemplateName();
            UI._viewName = name;
            UI._capIdx = 0;
            UI.renderTemplateSelect();
            UI.renderCapsuleSelect();
            UI.renderCapsuleFields();
        },

        _viewTemplate() {
            return window.NBS.Templates._templates[UI._viewName] || null;
        },

        renderTemplateSelect() {
            const sel = document.getElementById('nbs-template-select');
            if (!sel) return;
            const T = window.NBS.Templates;
            const active = T.getActiveTemplateName();
            sel.innerHTML = '';
            for (const name of T.getTemplateNames()) {
                const opt = document.createElement('option');
                opt.value = name;
                const file = T._templates[name]?.file;
                opt.textContent = name === active ? `${name} (active)` : name;
                if (file) opt.title = `library/templates/${file}`;
                sel.appendChild(opt);
            }
            if (UI._viewName && T._templates[UI._viewName]) sel.value = UI._viewName;
        },

        renderCapsuleSelect() {
            const sel = document.getElementById('nbs-capsule-select');
            const tpl = UI._viewTemplate();
            if (!sel || !tpl) return;
            sel.innerHTML = '';
            tpl.capsules.forEach((cap, i) => {
                const opt = document.createElement('option');
                opt.value = String(i);
                opt.textContent = cap.label || `(capsule ${i + 1})`;
                sel.appendChild(opt);
            });
            if (UI._capIdx >= tpl.capsules.length) UI._capIdx = 0;
            sel.value = String(UI._capIdx);
        },

        renderCapsuleFields() {
            const tpl = UI._viewTemplate();
            const cap = tpl?.capsules?.[UI._capIdx];
            if (!cap) return;
            const el = (id) => document.getElementById(id);
            if (el('nbs-capsule-label')) el('nbs-capsule-label').value = cap.label || '';
            if (el('nbs-capsule-trigger')) el('nbs-capsule-trigger').value = cap.trigger || '';
            if (el('nbs-capsule-body')) el('nbs-capsule-body').value = cap.body || '';
            UI.updateCounters();
        },

        updateCounters() {
            const cap = UI._viewTemplate()?.capsules?.[UI._capIdx];
            const trig = document.getElementById('nbs-trigger-count');
            const body = document.getElementById('nbs-body-count');
            if (trig) {
                const n = (cap?.trigger || '').length;
                trig.textContent = n > 200 ? `${n} chars — keep triggers short` : '';
                trig.className = n > 200 ? 'nbs-count-warn' : '';
            }
            if (body) {
                const n = (cap?.body || '').length;
                body.textContent = n > 4000 ? `${n} chars — large capsules bloat every chat save` : `${n} chars`;
                body.className = n > 4000 ? 'nbs-count-warn' : 'nbs-hint-inline';
            }
        },

        bindTemplateUi() {
            const el = (id) => document.getElementById(id);
            const T = window.NBS.Templates;

            // Choosing a template only records which one is active. The
            // template files themselves are never written from the browser.
            el('nbs-template-select')?.addEventListener('change', function () {
                if (!T.setActiveTemplate(this.value)) return;
                UI.loadTemplateIntoDraft(this.value);
                UI.refreshStatus();
                UI._toast(`Active template: ${this.value}`, 'success');
            });

            el('nbs-capsule-select')?.addEventListener('change', function () {
                UI._capIdx = Number(this.value) || 0;
                UI.renderCapsuleFields();
            });

            el('nbs-copy-btn')?.addEventListener('click', () => {
                const name = UI._viewName;
                const text = T.exportTemplate(name);
                if (!text) return;
                const io = el('nbs-io-textarea');
                if (io) { io.hidden = false; io.value = text; }
                navigator.clipboard?.writeText(text)
                    .then(() => UI._toast('Template copied to clipboard.'))
                    .catch(() => { /* textarea still holds it */ });
            });
        },

        bindSettings() {
            const S = () => window.NBS.State.getSettings();
            const save = () => window.NBS.State.saveSettings();

            document.getElementById('nbs-enabled')?.addEventListener('change', function () {
                S().enabled = this.checked;
                save();
                window.STUnifiedToolbar?.update?.();
            });
            document.getElementById('nbs-use-tracker')?.addEventListener('change', function () {
                S().useTrackerOpenRouter = this.checked;
                save();
                UI.syncSettingsUi();
            });
            document.getElementById('nbs-or-key')?.addEventListener('input', function () {
                S().openRouter.apiKey = this.value.trim();
                save();
            });
            document.getElementById('nbs-or-model')?.addEventListener('input', function () {
                S().openRouter.modelId = this.value.trim();
                save();
            });
            document.getElementById('nbs-or-temp')?.addEventListener('input', function () {
                S().openRouter.temperature = Number(this.value);
                save();
            });
            document.getElementById('nbs-or-max')?.addEventListener('input', function () {
                S().openRouter.maxCompletionTokens = Number(this.value);
                save();
            });
            document.getElementById('nbs-timeout')?.addEventListener('input', function () {
                S().timeoutMs = Number(this.value);
                save();
            });
            document.getElementById('nbs-debug')?.addEventListener('change', function () {
                S().debug = this.checked;
                save();
            });
        },

        syncSettingsUi() {
            const s = window.NBS.State.getSettings();
            const el = (id) => document.getElementById(id);
            if (!el('nbs-enabled')) return;
            el('nbs-enabled').checked = !!s.enabled;
            el('nbs-use-tracker').checked = !!s.useTrackerOpenRouter;
            el('nbs-or-key').value = s.openRouter.apiKey || '';
            el('nbs-or-model').value = s.openRouter.modelId || '';
            el('nbs-or-temp').value = s.openRouter.temperature ?? 0.1;
            el('nbs-or-max').value = s.openRouter.maxCompletionTokens ?? 64;
            el('nbs-timeout').value = s.timeoutMs ?? 10000;
            el('nbs-debug').checked = !!s.debug;

            const cfg = window.NBS.API?.getOpenRouterConfig?.() || { source: '?' };
            const showLocal = !s.useTrackerOpenRouter || cfg.source === 'local';
            el('nbs-local-or').hidden = !showLocal;
            UI.refreshStatus();
        },

        refreshStatus() {
            const el = document.getElementById('nbs-status');
            if (!el) return;
            const label = window.NBS.State.lastLabel || '—';
            const err = window.NBS.State.lastError;
            const cfg = window.NBS.API?.getOpenRouterConfig?.() || {};
            const T = window.NBS.Templates;
            const tplName = T?.getActiveTemplateName?.() || '?';
            const capCount = T?.getActiveTemplate?.()?.capsules?.length || 0;
            el.textContent = err
                ? `Last label: ${label} · API: ${cfg.source || '?'} · Error: ${err}`
                : `Last label: ${label} · API: ${cfg.source || '?'} · template: ${tplName} (${capCount} capsules)`;

            // Keep Control button title in sync with last label
            if (UI._toolbarRegistered && window.STUnifiedToolbar?.register) {
                UI.registerUnifiedToolbarButtons();
            }
        },

        setEnabled(on) {
            const s = window.NBS.State.getSettings();
            s.enabled = !!on;
            window.NBS.State.saveSettings();
            const cb = document.getElementById('nbs-enabled');
            if (cb) cb.checked = s.enabled;
            window.STUnifiedToolbar?.update?.();
        },

        getToolbarActions() {
            const label = window.NBS.State.lastLabel;
            const title = label ? `Beat Switch (${label})` : 'Beat Switch';
            return [
                {
                    id: 'nbs-power',
                    group: 'nbs',
                    groupLabel: 'Beat Style',
                    groupIcon: 'fa-feather-pointed',
                    title,
                    icon: 'fa-power-off',
                    master: true,
                    active: () => !!window.NBS.State.getSettings().enabled,
                    warning: () => !window.NBS.State.getSettings().enabled,
                    onClick: () => {
                        UI.setEnabled(!window.NBS.State.getSettings().enabled);
                    },
                },
                {
                    id: 'nbs-last-label',
                    group: 'nbs',
                    groupLabel: 'Beat Style',
                    groupIcon: 'fa-feather-pointed',
                    title: label ? `Last: ${label}` : 'Last: —',
                    icon: 'fa-tag',
                    secondary: true,
                    visible: () => !!window.NBS.State.getSettings().enabled,
                    onClick: () => {
                        UI.refreshStatus();
                        window.STUnifiedToolbar?.update?.();
                    },
                },
            ];
        },

        async bootChrome() {
            const dual = window.NDSDualMode;
            if (!dual?.boot) {
                UI.registerUnifiedToolbarButtons();
                return;
            }
            const shellUrl = window.NBS_EXTENSION_ROOT
                ? new URL('lib/nds_tool_shell.js', window.NBS_EXTENSION_ROOT).href
                : null;
            const mode = await dual.boot({
                id: 'beat-style',
                title: 'Beat Style',
                icon: 'fa-feather-pointed',
                storageKey: 'nds-nbs-shell',
                shellScriptUrl: shellUrl,
                isEnabled: () => !!window.NBS.State.getSettings().enabled,
                setEnabled: (on) => UI.setEnabled(!!on),
                getActions: () => UI.getToolbarActions(),
            });
            if (mode === 'none') UI.registerUnifiedToolbarButtons();
            console.log(`[NBS] Chrome mode: ${mode}`);
        },

        registerUnifiedToolbarButtons() {
            const toolbar = window.STUnifiedToolbar;
            if (!toolbar?.register) {
                UI.scheduleToolbarRetry();
                return false;
            }

            UI.getToolbarActions().forEach((a) => toolbar.register(a));
            UI._toolbarRegistered = true;
            UI.stopToolbarRetry();
            toolbar.update?.();
            console.info('[NBS] Registered Beat Style controls on NDS: Control');
            return true;
        },

        scheduleToolbarRetry() {
            if (UI._toolbarRetryTimer) return;
            let attempts = 0;
            UI._toolbarRetryTimer = setInterval(() => {
                attempts += 1;
                if (UI.registerUnifiedToolbarButtons() || attempts >= 40) {
                    UI.stopToolbarRetry();
                }
            }, 250);
        },

        stopToolbarRetry() {
            if (UI._toolbarRetryTimer) {
                clearInterval(UI._toolbarRetryTimer);
                UI._toolbarRetryTimer = null;
            }
        },
    };

    window.NBS.UI = UI;
})();
