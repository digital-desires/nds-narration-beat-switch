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
                            <div class="nbs-hint">A template is a full set of styles. The classifier only sees the capsules of the active template.</div>
                            <div class="nbs-field"><label>Template</label>
                                <div class="nbs-row-inline">
                                    <select id="nbs-template-select" class="text_pole"></select>
                                    <button id="nbs-template-load" class="menu_button" title="Reload saved template (discard changes)"><i class="fa-solid fa-rotate-left"></i></button>
                                    <button id="nbs-template-new" class="menu_button" title="New template"><i class="fa-solid fa-plus"></i></button>
                                    <button id="nbs-template-delete" class="menu_button" title="Delete template"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </div>
                            <div id="nbs-template-dirty" class="nbs-dirty-banner" hidden>Unsaved changes — press "Save template" to apply.</div>
                            <div id="nbs-template-name-row" class="nbs-field" hidden><label>Template name (typing a new name saves a copy)</label><input id="nbs-template-name" class="text_pole" type="text" placeholder="My template"></div>
                            <div class="nbs-field"><label>Capsule</label>
                                <div class="nbs-row-inline">
                                    <select id="nbs-capsule-select" class="text_pole"></select>
                                    <button id="nbs-capsule-add" class="menu_button" title="Add capsule"><i class="fa-solid fa-plus"></i></button>
                                    <button id="nbs-capsule-delete" class="menu_button" title="Delete capsule"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </div>
                            <div class="nbs-field"><label>Label <span class="nbs-hint-inline">(lowercase: a-z, 0-9, -, _)</span></label><input id="nbs-capsule-label" class="text_pole" type="text"></div>
                            <div class="nbs-field"><label>Trigger <span class="nbs-hint-inline">(one line — tells the classifier when to pick this style)</span> <span id="nbs-trigger-count"></span></label><input id="nbs-capsule-trigger" class="text_pole" type="text"></div>
                            <div class="nbs-field"><label>Body <span class="nbs-hint-inline">(free text — any style or rule instructions; no required format)</span> <span id="nbs-body-count"></span></label><textarea id="nbs-capsule-body" class="text_pole" rows="12"></textarea></div>
                            <div class="nbs-row-inline">
                                <button id="nbs-template-save" class="menu_button">Save template</button>
                                <button id="nbs-export-btn" class="menu_button">Edit as text</button>
                                <button id="nbs-import-btn" class="menu_button">Apply text</button>
                            </div>
                            <div class="nbs-hint">Whole-template text editing: "Edit as text" writes the current template below — edit it (or paste your own / old &lt;prose_style&gt; blocks) and press "Apply text", then Save. Format: <code># NBS Template: Name</code> then one <code>&lt;capsule label="x" trigger="when to pick it"&gt;instructions&lt;/capsule&gt;</code> per style.</div>
                            <textarea id="nbs-io-textarea" class="text_pole" rows="6" placeholder="# NBS Template: My Template&#10;&#10;<capsule label=&quot;combat&quot; trigger=&quot;a fight is happening&quot;>&#10;Any instructions, any format.&#10;</capsule>&#10;&#10;<capsule label=&quot;generic&quot; trigger=&quot;anything else&quot;>&#10;Default narration instructions.&#10;</capsule>"></textarea>
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

        // ── Template editor (draft-based: keystrokes never touch settings) ──

        _draft: null,
        _draftSourceName: null,
        _isCreatingNew: false,
        _dirty: false,
        _capIdx: 0,

        _clone(obj) {
            return typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
        },

        _toast(msg, type = 'info') {
            if (window.toastr?.[type]) window.toastr[type](msg, 'Beat Switch');
            else console.log(`[NBS] ${type}: ${msg}`);
        },

        _confirmDiscard() {
            if (!UI._dirty) return true;
            return window.confirm('Discard unsaved template changes?');
        },

        _setDirty(on) {
            UI._dirty = !!on;
            const banner = document.getElementById('nbs-template-dirty');
            if (banner) banner.hidden = !UI._dirty;
            const nameRow = document.getElementById('nbs-template-name-row');
            if (nameRow) nameRow.hidden = !(UI._dirty || UI._isCreatingNew);
        },

        loadTemplateIntoDraft(name) {
            const s = window.NBS.State.getSettings();
            const tpl = s.templates?.[name];
            if (!tpl) return;
            UI._draft = UI._clone(tpl);
            UI._draftSourceName = name;
            UI._isCreatingNew = false;
            UI._capIdx = 0;
            UI._setDirty(false);
            const nameInput = document.getElementById('nbs-template-name');
            if (nameInput) nameInput.value = name;
            UI.renderTemplateSelect();
            UI.renderCapsuleSelect();
            UI.renderCapsuleFields();
        },

        renderTemplateSelect() {
            const sel = document.getElementById('nbs-template-select');
            if (!sel) return;
            const s = window.NBS.State.getSettings();
            sel.innerHTML = '';
            for (const name of Object.keys(s.templates || {})) {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name === s.activeTemplate ? `${name} (active)` : name;
                sel.appendChild(opt);
            }
            if (UI._draftSourceName && s.templates[UI._draftSourceName]) {
                sel.value = UI._draftSourceName;
            }
        },

        renderCapsuleSelect() {
            const sel = document.getElementById('nbs-capsule-select');
            if (!sel || !UI._draft) return;
            sel.innerHTML = '';
            UI._draft.capsules.forEach((cap, i) => {
                const opt = document.createElement('option');
                opt.value = String(i);
                opt.textContent = cap.label || `(capsule ${i + 1})`;
                sel.appendChild(opt);
            });
            if (UI._capIdx >= UI._draft.capsules.length) UI._capIdx = 0;
            sel.value = String(UI._capIdx);
        },

        renderCapsuleFields() {
            if (!UI._draft) return;
            const cap = UI._draft.capsules[UI._capIdx];
            if (!cap) return;
            const el = (id) => document.getElementById(id);
            if (el('nbs-capsule-label')) el('nbs-capsule-label').value = cap.label || '';
            if (el('nbs-capsule-trigger')) el('nbs-capsule-trigger').value = cap.trigger || '';
            if (el('nbs-capsule-body')) el('nbs-capsule-body').value = cap.body || '';
            UI.updateCounters();
        },

        updateCounters() {
            const cap = UI._draft?.capsules?.[UI._capIdx];
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

        async _persistTemplates() {
            window.NBS.State.saveSettings();
            const ok = await window.NBS.Templates.saveTemplatesToDisk();
            if (!ok) UI._toast('Disk sync unavailable — templates saved in SillyTavern settings only.', 'warning');
        },

        bindTemplateUi() {
            const el = (id) => document.getElementById(id);
            const T = window.NBS.Templates;

            el('nbs-template-select')?.addEventListener('change', async function () {
                if (!UI._confirmDiscard()) {
                    this.value = UI._draftSourceName || window.NBS.State.getSettings().activeTemplate;
                    return;
                }
                const s = window.NBS.State.getSettings();
                if (!s.templates[this.value]) return;
                s.activeTemplate = this.value;
                UI.loadTemplateIntoDraft(this.value);
                await UI._persistTemplates();
                UI.refreshStatus();
            });

            el('nbs-template-load')?.addEventListener('click', () => {
                if (!UI._confirmDiscard()) return;
                const sel = el('nbs-template-select');
                UI.loadTemplateIntoDraft(sel?.value || window.NBS.State.getSettings().activeTemplate);
            });

            el('nbs-template-new')?.addEventListener('click', () => {
                if (!UI._confirmDiscard()) return;
                UI._draft = { capsules: [UI._clone(T._factoryGenericCapsule())] };
                UI._draftSourceName = null;
                UI._isCreatingNew = true;
                UI._capIdx = 0;
                const nameInput = el('nbs-template-name');
                if (nameInput) nameInput.value = '';
                UI._setDirty(true);
                UI.renderCapsuleSelect();
                UI.renderCapsuleFields();
                nameInput?.focus();
            });

            el('nbs-template-delete')?.addEventListener('click', async () => {
                const s = window.NBS.State.getSettings();
                const sel = el('nbs-template-select');
                const name = sel?.value;
                if (!name || !s.templates[name]) return;
                if (Object.keys(s.templates).length <= 1) {
                    UI._toast('Cannot delete the last template.', 'warning');
                    return;
                }
                if (!window.confirm(`Delete template "${name}"? This cannot be undone.`)) return;
                delete s.templates[name];
                if (s.activeTemplate === name) {
                    s.activeTemplate = Object.keys(s.templates)[0];
                }
                UI.loadTemplateIntoDraft(s.activeTemplate);
                await UI._persistTemplates();
                UI.refreshStatus();
                UI._toast(`Deleted "${name}".`);
            });

            el('nbs-template-save')?.addEventListener('click', async () => {
                if (!UI._draft) return;
                const s = window.NBS.State.getSettings();
                const typed = (el('nbs-template-name')?.value || '').trim();
                const name = typed || UI._draftSourceName;
                if (!name) {
                    UI._toast('Give the template a name first.', 'warning');
                    return;
                }
                // Validate capsules before normalization eats bad entries silently.
                const seen = new Set();
                for (const cap of UI._draft.capsules) {
                    const label = String(cap.label || '').trim().toLowerCase();
                    if (label === 'none') {
                        UI._toast('"none" is a reserved label — pick another.', 'error');
                        return;
                    }
                    if (!T.isValidLabel(label)) {
                        UI._toast(`Invalid label "${cap.label}" — use lowercase letters, digits, - and _.`, 'error');
                        return;
                    }
                    if (seen.has(label)) {
                        UI._toast(`Duplicate label "${label}" — labels must be unique.`, 'error');
                        return;
                    }
                    seen.add(label);
                }
                const normalized = T.normalizeTemplate(UI._draft);
                if (!seen.has('generic')) {
                    UI._toast('No "generic" capsule — a fallback one was added automatically.');
                }
                s.templates[name] = normalized;
                s.activeTemplate = name;
                UI._draftSourceName = name;
                UI._isCreatingNew = false;
                UI._draft = UI._clone(normalized);
                UI._setDirty(false);
                UI.renderTemplateSelect();
                UI.renderCapsuleSelect();
                UI.renderCapsuleFields();
                await UI._persistTemplates();
                UI.refreshStatus();
                UI._toast(`Saved "${name}" (${normalized.capsules.length} capsules).`, 'success');
            });

            el('nbs-capsule-select')?.addEventListener('change', function () {
                UI._capIdx = Number(this.value) || 0;
                UI.renderCapsuleFields();
            });

            el('nbs-capsule-add')?.addEventListener('click', () => {
                if (!UI._draft) return;
                let n = UI._draft.capsules.length + 1;
                while (UI._draft.capsules.some(c => c.label === `new-capsule-${n}`)) n += 1;
                UI._draft.capsules.push({ label: `new-capsule-${n}`, trigger: '', body: '' });
                UI._capIdx = UI._draft.capsules.length - 1;
                UI._setDirty(true);
                UI.renderCapsuleSelect();
                UI.renderCapsuleFields();
            });

            el('nbs-capsule-delete')?.addEventListener('click', () => {
                if (!UI._draft) return;
                if (UI._draft.capsules.length <= 1) {
                    UI._toast('A template needs at least one capsule.', 'warning');
                    return;
                }
                const cap = UI._draft.capsules[UI._capIdx];
                if (!window.confirm(`Delete capsule "${cap?.label}"?`)) return;
                UI._draft.capsules.splice(UI._capIdx, 1);
                UI._capIdx = 0;
                UI._setDirty(true);
                UI.renderCapsuleSelect();
                UI.renderCapsuleFields();
            });

            el('nbs-capsule-label')?.addEventListener('input', function () {
                const cap = UI._draft?.capsules?.[UI._capIdx];
                if (!cap) return;
                cap.label = this.value.trim().toLowerCase();
                UI._setDirty(true);
                const opt = el('nbs-capsule-select')?.options?.[UI._capIdx];
                if (opt) opt.textContent = cap.label || `(capsule ${UI._capIdx + 1})`;
            });

            el('nbs-capsule-trigger')?.addEventListener('input', function () {
                const cap = UI._draft?.capsules?.[UI._capIdx];
                if (!cap) return;
                cap.trigger = this.value;
                UI._setDirty(true);
                UI.updateCounters();
            });

            el('nbs-capsule-body')?.addEventListener('input', function () {
                const cap = UI._draft?.capsules?.[UI._capIdx];
                if (!cap) return;
                cap.body = this.value;
                UI._setDirty(true);
                UI.updateCounters();
            });

            el('nbs-export-btn')?.addEventListener('click', () => {
                if (!UI._draft) return;
                const name = (el('nbs-template-name')?.value || '').trim()
                    || UI._draftSourceName || 'Unnamed template';
                const text = T.serializeTemplate(name, UI._draft);
                const io = el('nbs-io-textarea');
                if (io) io.value = text;
                navigator.clipboard?.writeText(text)
                    .then(() => UI._toast('Template copied to clipboard.'))
                    .catch(() => { /* textarea still holds it */ });
            });

            el('nbs-import-btn')?.addEventListener('click', () => {
                const io = el('nbs-io-textarea');
                if (!io) return;
                if (!UI._confirmDiscard()) return;
                try {
                    const { name, template } = T.importTemplateText(io.value);
                    UI._draft = template;
                    UI._draftSourceName = null;
                    UI._isCreatingNew = true;
                    UI._capIdx = 0;
                    const nameInput = el('nbs-template-name');
                    if (nameInput) nameInput.value = name;
                    UI._setDirty(true);
                    UI.renderCapsuleSelect();
                    UI.renderCapsuleFields();
                    UI._toast(`Imported "${name}" (${template.capsules.length} capsules) — review and Save.`, 'success');
                } catch (err) {
                    UI._toast(err.message, 'error');
                }
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

        registerUnifiedToolbarButtons() {
            const toolbar = window.STUnifiedToolbar;
            if (!toolbar?.register) {
                UI.scheduleToolbarRetry();
                return false;
            }

            const label = window.NBS.State.lastLabel;
            const title = label ? `Beat Switch (${label})` : 'Beat Switch';

            toolbar.register({
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
            });

            // Secondary: show last chosen style (informational click refreshes status)
            toolbar.register({
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
                    toolbar.update?.();
                },
            });

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
