// v0.3.2 — 2026-09-28
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
                        <div class="nbs-cartridges">
                            <b>Cartridges</b>
                            <div class="nbs-hint">Edit the markdown here. Create, Load, Save, and Delete keep <em>your</em> copies in the extension — the browser cannot write into the extension folder. Shipped files stay on disk unless you Save over them.</div>
                            <div class="nbs-field"><label>Preset</label>
                                <select id="nbs-preset-select" class="text_pole"></select>
                                <textarea id="nbs-preset-md" class="text_pole nbs-md-view" rows="6"></textarea>
                                <div class="nbs-cart-actions">
                                    <button type="button" class="menu_button" data-nbs-cart="create" data-kind="preset">Create</button>
                                    <button type="button" class="menu_button" data-nbs-cart="load" data-kind="preset">Load .md</button>
                                    <button type="button" class="menu_button" data-nbs-cart="save" data-kind="preset">Save</button>
                                    <button type="button" class="menu_button" data-nbs-cart="delete" data-kind="preset">Delete</button>
                                </div>
                            </div>
                            <div class="nbs-field"><label>World Setting</label>
                                <select id="nbs-world-select" class="text_pole"></select>
                                <textarea id="nbs-world-md" class="text_pole nbs-md-view" rows="10"></textarea>
                                <div class="nbs-cart-actions">
                                    <button type="button" class="menu_button" data-nbs-cart="create" data-kind="world">Create</button>
                                    <button type="button" class="menu_button" data-nbs-cart="load" data-kind="world">Load .md</button>
                                    <button type="button" class="menu_button" data-nbs-cart="save" data-kind="world">Save</button>
                                    <button type="button" class="menu_button" data-nbs-cart="delete" data-kind="world">Delete</button>
                                </div>
                            </div>
                            <div class="nbs-field"><label>Narrative Style</label>
                                <select id="nbs-style-select" class="text_pole"></select>
                                <textarea id="nbs-style-md" class="text_pole nbs-md-view" rows="8"></textarea>
                                <div class="nbs-cart-actions">
                                    <button type="button" class="menu_button" data-nbs-cart="create" data-kind="style">Create</button>
                                    <button type="button" class="menu_button" data-nbs-cart="load" data-kind="style">Load .md</button>
                                    <button type="button" class="menu_button" data-nbs-cart="save" data-kind="style">Save</button>
                                    <button type="button" class="menu_button" data-nbs-cart="delete" data-kind="style">Delete</button>
                                </div>
                            </div>
                            <div class="nbs-field"><label>Beat template</label>
                                <select id="nbs-beat-select" class="text_pole"></select>
                                <textarea id="nbs-beat-md" class="text_pole nbs-md-view" rows="10"></textarea>
                                <div class="nbs-cart-actions">
                                    <button type="button" class="menu_button" data-nbs-cart="create" data-kind="template">Create</button>
                                    <button type="button" class="menu_button" data-nbs-cart="load" data-kind="template">Load .md</button>
                                    <button type="button" class="menu_button" data-nbs-cart="save" data-kind="template">Save</button>
                                    <button type="button" class="menu_button" data-nbs-cart="delete" data-kind="template">Delete</button>
                                </div>
                            </div>
                            <input type="file" id="nbs-cart-file" accept=".md,.txt,text/markdown,text/plain" hidden>
                        </div>
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
            UI.bindCartridgeUi();
            UI.loadTemplateIntoDraft(window.NBS.Templates.getActiveTemplateName());
            UI.syncSettingsUi();
            UI.syncCartridgeUi();
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
                window.NBS.State.setCartridgeField('template', this.value);
                UI.refreshStatus();
                UI.syncCartridgeUi();
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
            UI.syncCartridgeUi();
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

            // Control reads action.title as a function, so a re-render is enough to
            // show the new label — no re-registration. The standalone shell picks it
            // up on its next render (opening the panel, or any button click).
            window.STUnifiedToolbar?.update?.();
        },

        setEnabled(on) {
            const s = window.NBS.State.getSettings();
            s.enabled = !!on;
            window.NBS.State.saveSettings();
            const cb = document.getElementById('nbs-enabled');
            if (cb) cb.checked = s.enabled;
            window.STUnifiedToolbar?.update?.();
        },

        fillSelect(sel, options, value) {
            if (!sel) return;
            const current = String(value ?? '');
            sel.innerHTML = '';
            for (const opt of options || []) {
                const o = document.createElement('option');
                o.value = String(opt.value ?? '');
                o.textContent = opt.label ?? o.value;
                sel.appendChild(o);
            }
            if (current && ![...sel.options].some((o) => o.value === current)) {
                const extra = document.createElement('option');
                extra.value = current;
                extra.textContent = current;
                sel.insertBefore(extra, sel.firstChild);
            }
            sel.value = current;
        },

        _cartDirty: { preset: false, world: false, style: false, template: false },
        _cartLoadKind: '',

        cartField(kind) {
            return {
                preset: { select: 'nbs-preset-select', md: 'nbs-preset-md', field: 'preset' },
                world: { select: 'nbs-world-select', md: 'nbs-world-md', field: 'world' },
                style: { select: 'nbs-style-select', md: 'nbs-style-md', field: 'style' },
                template: { select: 'nbs-beat-select', md: 'nbs-beat-md', field: 'template' },
            }[kind];
        },

        currentCartId(kind) {
            const spec = UI.cartField(kind);
            return spec ? (document.getElementById(spec.select)?.value || '') : '';
        },

        applyCart(kind, id) {
            const spec = UI.cartField(kind);
            if (!spec) return;
            window.NBS.State.setCartridgeField(spec.field, id);
            UI._cartDirty[kind] = false;
            UI.loadTemplateIntoDraft(window.NBS.Templates.getActiveTemplateName());
            UI.syncCartridgeUi();
            UI.refreshStatus();
        },

        fillCartText(kind, force) {
            const spec = UI.cartField(kind);
            const box = spec && document.getElementById(spec.md);
            if (!box) return;
            if (UI._cartDirty[kind] && !force) return;
            const C = window.NBS.Cartridges;
            const T = window.NBS.Templates;
            const rec = window.NBS.State.getCartridgeRecord();
            const template = rec.template || T?.getActiveTemplateName?.() || '';
            const raw = {
                preset: rec.preset ? (C?.presetRaw?.(rec.preset) || '') : '',
                world: rec.world ? (C?.worldRaw?.(rec.world) || '') : '',
                style: rec.style ? (C?.styleRaw?.(rec.style) || '') : '',
                template: template ? (T?.exportTemplate?.(template) || '') : '',
            }[kind];
            box.value = raw || '';
        },

        syncCartridgeUi() {
            const C = window.NBS.Cartridges;
            const T = window.NBS.Templates;
            const rec = window.NBS.State.getCartridgeRecord();
            const template = rec.template || T?.getActiveTemplateName?.() || '';
            const el = (id) => document.getElementById(id);
            UI.fillSelect(el('nbs-preset-select'), C?.presetOptions?.(!!(rec.world || rec.style || rec.preset)) || [], rec.preset);
            UI.fillSelect(el('nbs-world-select'), C?.worldOptions?.() || [], rec.world);
            UI.fillSelect(el('nbs-style-select'), C?.styleOptions?.() || [], rec.style);
            UI.fillSelect(el('nbs-beat-select'), C?.templateOptions?.() || [], template);
            UI.fillCartText('preset');
            UI.fillCartText('world');
            UI.fillCartText('style');
            UI.fillCartText('template');
            window.STUnifiedToolbar?.update?.();
        },

        async askCartName(kind) {
            const labels = { world: 'World Setting name', style: 'Narrative Style name', preset: 'Preset name', template: 'Beat template name' };
            const ctx = window.NBS.getContext?.();
            if (ctx?.Popup?.show?.input) {
                const v = await ctx.Popup.show.input(labels[kind] || 'Name', null, '');
                return String(v || '').trim();
            }
            return String(window.prompt(labels[kind] || 'Name', '') || '').trim();
        },

        async createCartridge(kind) {
            const name = await UI.askCartName(kind);
            if (!name) return;
            const C = window.NBS.Cartridges;
            try {
                if (kind === 'template') {
                    const raw = C.blankTemplate(name);
                    const id = C.saveUserTemplate(raw, '');
                    UI.applyCart('template', id);
                } else {
                    const blank = { world: C.blankWorld, style: C.blankStyle, preset: C.blankPreset }[kind];
                    const item = C.saveUserRaw(kind, blank(name), '');
                    UI.applyCart(kind, item.id);
                }
                UI.fillCartText(kind, true);
                UI._toast(`Created ${name}`, 'success');
            } catch (err) {
                UI._toast(err.message, 'error');
            }
        },

        loadCartridgeFile(kind) {
            const input = document.getElementById('nbs-cart-file');
            if (!input) return;
            UI._cartLoadKind = kind;
            input.value = '';
            input.click();
        },

        async onCartridgeFile(ev) {
            const file = ev.target.files?.[0];
            const kind = UI._cartLoadKind;
            UI._cartLoadKind = '';
            if (!file || !kind) return;
            const raw = await file.text();
            const C = window.NBS.Cartridges;
            try {
                if (kind === 'template') {
                    const id = C.saveUserTemplate(raw, UI.currentCartId('template'));
                    UI.applyCart('template', id);
                } else {
                    const item = C.saveUserRaw(kind, raw, UI.currentCartId(kind));
                    UI.applyCart(kind, item.id);
                }
                UI.fillCartText(kind, true);
                UI._toast(`Loaded ${file.name}`, 'success');
            } catch (err) {
                UI._toast(err.message, 'error');
            }
        },

        saveCartridge(kind) {
            const spec = UI.cartField(kind);
            const raw = document.getElementById(spec.md)?.value || '';
            const C = window.NBS.Cartridges;
            try {
                if (kind === 'template') {
                    const id = C.saveUserTemplate(raw, UI.currentCartId('template'));
                    UI.applyCart('template', id);
                } else {
                    const item = C.saveUserRaw(kind, raw, UI.currentCartId(kind));
                    UI.applyCart(kind, item.id);
                }
                UI.fillCartText(kind, true);
                UI._toast('Saved', 'success');
            } catch (err) {
                UI._toast(err.message, 'error');
            }
        },

        deleteCartridge(kind) {
            const id = UI.currentCartId(kind);
            if (!id) {
                UI._toast('Nothing selected.', 'warning');
                return;
            }
            const C = window.NBS.Cartridges;
            const result = kind === 'template' ? C.deleteUserTemplate(id) : C.deleteUser(kind, id);
            if (!result.ok) {
                if (result.reason === 'shipped') UI._toast('Shipped cartridges stay on disk. Save your own copy, then delete that.', 'warning');
                else UI._toast('Could not delete that cartridge.', 'error');
                return;
            }
            UI.applyCart(kind, '');
            UI.fillCartText(kind, true);
            UI._toast(result.restored ? 'Reverted to the shipped file.' : 'Deleted.', 'success');
        },

        bindCartridgeUi() {
            const el = (id) => document.getElementById(id);
            const apply = (field, kind) => function () {
                UI._cartDirty[kind] = false;
                window.NBS.State.setCartridgeField(field, this.value);
                UI.loadTemplateIntoDraft(window.NBS.Templates.getActiveTemplateName());
                UI.syncCartridgeUi();
                UI.refreshStatus();
            };
            el('nbs-preset-select')?.addEventListener('change', apply('preset', 'preset'));
            el('nbs-world-select')?.addEventListener('change', apply('world', 'world'));
            el('nbs-style-select')?.addEventListener('change', apply('style', 'style'));
            el('nbs-beat-select')?.addEventListener('change', apply('template', 'template'));
            for (const kind of ['preset', 'world', 'style', 'template']) {
                const spec = UI.cartField(kind);
                el(spec.md)?.addEventListener('input', () => { UI._cartDirty[kind] = true; });
            }
            document.getElementById('nbs-settings')?.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-nbs-cart]');
                if (!btn) return;
                const kind = btn.dataset.kind;
                const act = btn.dataset.nbsCart;
                if (act === 'create') UI.createCartridge(kind);
                else if (act === 'load') UI.loadCartridgeFile(kind);
                else if (act === 'save') UI.saveCartridge(kind);
                else if (act === 'delete') UI.deleteCartridge(kind);
            });
            el('nbs-cart-file')?.addEventListener('change', (e) => { UI.onCartridgeFile(e); });
        },

        _lastSessionKey: '',
        _askOpen: false,
        _shellId: 'beat-style',

        sessionKey(payloadChatId) {
            const master = window.NarratorSuiteMaster;
            if (master?._resolveSessionKey) return master._resolveSessionKey(payloadChatId);
            const ctx = window.NBS.getContext?.();
            const id = payloadChatId
                || (typeof ctx?.getCurrentChatId === 'function' ? ctx.getCurrentChatId() : '')
                || ctx?.chatId
                || '';
            return String(id || '');
        },

        registerChatStartHook() {
            const ctx = window.NBS.getContext?.();
            const source = ctx?.eventSource;
            const types = ctx?.eventTypes || ctx?.event_types;
            if (!source || !types?.CHAT_CHANGED) {
                console.warn('[NBS] CHAT_CHANGED unavailable — chat-start picker disabled');
                return;
            }
            source.on(types.CHAT_CHANGED, (payload) => UI.onChatChanged(payload));
            setTimeout(() => UI.onChatChanged(), 0);
        },

        onChatChanged(payload) {
            const ctx = window.NBS.getContext?.();
            const isSillyTavernSystem = String(ctx?.name2 || '').trim() === 'SillyTavern System';
            if (isSillyTavernSystem) {
                document.getElementById('nbs-chat-start')?.remove();
                UI._askOpen = false;
                UI._lastSessionKey = '';
                return;
            }
            const key = UI.sessionKey(payload);
            if (!key) return;
            if (key === UI._lastSessionKey) return;
            UI._lastSessionKey = key;
            const rec = window.NBS.State.getCartridgeRecord();
            if (rec.template) window.NBS.Templates.setActiveTemplate(rec.template);
            window.NBS.State.writeCartridgeVariables(rec);
            UI.loadTemplateIntoDraft(window.NBS.Templates.getActiveTemplateName());
            UI.syncCartridgeUi();
            UI.refreshStatus();
            if (!rec.asked) UI.openChatStartPicker();
        },

        openChatStartPicker() {
            if (UI._askOpen) return;
            if (document.getElementById('nbs-chat-start')) return;
            UI._askOpen = true;
            const C = window.NBS.Cartridges;
            const T = window.NBS.Templates;
            const rec = window.NBS.State.getCartridgeRecord();
            const template = rec.template || T?.getActiveTemplateName?.() || '';
            const overlay = document.createElement('div');
            overlay.id = 'nbs-chat-start';
            overlay.className = 'nbs-chat-start';
            overlay.innerHTML = `
                <div class="nbs-chat-start-card" role="dialog" aria-labelledby="nbs-chat-start-title">
                    <h3 id="nbs-chat-start-title">Load cartridges</h3>
                    <p class="nbs-hint">World Setting, Narrative Style, and an optional Preset. Skip leaves all three empty except the current beat template.</p>
                    <label>Preset
                        <select id="nbs-start-preset" class="text_pole"></select>
                    </label>
                    <label>World Setting
                        <select id="nbs-start-world" class="text_pole"></select>
                    </label>
                    <label>Narrative Style
                        <select id="nbs-start-style" class="text_pole"></select>
                    </label>
                    <label>Beat template
                        <select id="nbs-start-beat" class="text_pole"></select>
                    </label>
                    <div class="nbs-chat-start-actions">
                        <button type="button" id="nbs-start-skip" class="menu_button">Skip</button>
                        <button type="button" id="nbs-start-confirm" class="menu_button">Confirm</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            UI.fillSelect(overlay.querySelector('#nbs-start-preset'), C?.presetOptions?.(false) || [], rec.preset);
            UI.fillSelect(overlay.querySelector('#nbs-start-world'), C?.worldOptions?.() || [], rec.world);
            UI.fillSelect(overlay.querySelector('#nbs-start-style'), C?.styleOptions?.() || [], rec.style);
            UI.fillSelect(overlay.querySelector('#nbs-start-beat'), C?.templateOptions?.() || [], template);

            const startPreset = overlay.querySelector('#nbs-start-preset');
            startPreset?.addEventListener('change', function () {
                const p = C?.getPreset?.(this.value);
                if (!p) return;
                if (p.world) overlay.querySelector('#nbs-start-world').value = p.world;
                if (p.style) overlay.querySelector('#nbs-start-style').value = p.style;
                if (p.template) overlay.querySelector('#nbs-start-beat').value = p.template;
            });

            const close = (skip) => {
                const world = overlay.querySelector('#nbs-start-world')?.value || '';
                const style = overlay.querySelector('#nbs-start-style')?.value || '';
                const beat = overlay.querySelector('#nbs-start-beat')?.value || '';
                const picked = overlay.querySelector('#nbs-start-preset')?.value || '';
                overlay.remove();
                UI._askOpen = false;
                if (skip) {
                    window.NBS.State.applyCartridgeRecord({
                        world: '',
                        style: '',
                        template: T?.getActiveTemplateName?.() || '',
                        preset: '',
                        asked: true,
                    });
                } else {
                    const matched = C?.matchPreset?.(world, style, beat) || '';
                    window.NBS.State.applyCartridgeRecord({
                        world,
                        style,
                        template: beat,
                        preset: picked || matched,
                        asked: true,
                    });
                }
                UI.loadTemplateIntoDraft(window.NBS.Templates.getActiveTemplateName());
                UI.syncCartridgeUi();
                UI.refreshStatus();
            };
            overlay.querySelector('#nbs-start-skip')?.addEventListener('click', () => close(true));
            overlay.querySelector('#nbs-start-confirm')?.addEventListener('click', () => close(false));
        },

        getToolbarActions() {
            const label = () => window.NBS.State.lastLabel;
            const C = () => window.NBS.Cartridges;
            const rec = () => window.NBS.State.getCartridgeRecord();
            const apply = (field) => (value) => {
                window.NBS.State.setCartridgeField(field, value);
                UI.loadTemplateIntoDraft(window.NBS.Templates.getActiveTemplateName());
                UI.syncCartridgeUi();
                UI.refreshStatus();
            };
            return [
                {
                    id: 'nbs-power',
                    group: 'nbs',
                    groupLabel: 'Beat Style',
                    groupIcon: 'fa-feather-pointed',
                    title: 'Beat Switch',
                    icon: 'fa-power-off',
                    master: true,
                    active: () => !!window.NBS.State.getSettings().enabled && window.NarratorSuiteMaster?.isEnabled?.() !== false,
                    paused: () => !!window.NBS.State.getSettings().enabled && window.NarratorSuiteMaster?.isEnabled?.() === false,
                    onClick: () => {
                        UI.setEnabled(!window.NBS.State.getSettings().enabled);
                    },
                },
                {
                    id: 'nbs-last-label',
                    group: 'nbs',
                    groupLabel: 'Beat Style',
                    groupIcon: 'fa-feather-pointed',
                    title: () => `Last: ${label() || '—'}`,
                    icon: 'fa-tag',
                    secondary: true,
                    visible: () => !!window.NBS.State.getSettings().enabled,
                    onClick: () => {
                        UI.refreshStatus();
                        window.STUnifiedToolbar?.update?.();
                    },
                },
                {
                    id: 'nbs-preset',
                    group: 'nbs',
                    groupLabel: 'Beat Style',
                    groupIcon: 'fa-feather-pointed',
                    kind: 'select',
                    title: 'Preset',
                    options: () => C()?.presetOptions?.(!!(rec().world || rec().style || rec().preset)) || [{ value: '', label: '—' }],
                    value: () => rec().preset,
                    onChange: apply('preset'),
                },
                {
                    id: 'nbs-world',
                    group: 'nbs',
                    groupLabel: 'Beat Style',
                    groupIcon: 'fa-feather-pointed',
                    kind: 'select',
                    title: 'World Setting',
                    options: () => C()?.worldOptions?.() || [{ value: '', label: 'None' }],
                    value: () => rec().world,
                    onChange: apply('world'),
                },
                {
                    id: 'nbs-style',
                    group: 'nbs',
                    groupLabel: 'Beat Style',
                    groupIcon: 'fa-feather-pointed',
                    title: 'Narrative Style',
                    kind: 'select',
                    options: () => C()?.styleOptions?.() || [{ value: '', label: 'None' }],
                    value: () => rec().style,
                    onChange: apply('style'),
                },
                {
                    id: 'nbs-beat-template',
                    group: 'nbs',
                    groupLabel: 'Beat Style',
                    groupIcon: 'fa-feather-pointed',
                    kind: 'select',
                    title: 'Beat template',
                    options: () => C()?.templateOptions?.() || [],
                    value: () => rec().template || window.NBS.Templates?.getActiveTemplateName?.() || '',
                    onChange: apply('template'),
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
