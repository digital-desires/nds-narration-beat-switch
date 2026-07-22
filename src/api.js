(function () {
    'use strict';

    window.NBS = window.NBS || {};

    const API = {
        getOpenRouterConfig() {
            const settings = window.NBS.State.getSettings();
            if (settings.useTrackerOpenRouter && window.SST?.State?.getSettings) {
                try {
                    const tr = window.SST.State.getSettings().openRouter || {};
                    const apiKey = String(tr.apiKey || '').trim();
                    const modelId = String(tr.modelId || '').trim();
                    if (apiKey && modelId) {
                        return {
                            source: 'tracker',
                            apiKey,
                            modelId,
                            temperature: Number.isFinite(tr.temperature) ? tr.temperature : 0.1,
                            maxCompletionTokens: Number.isFinite(tr.maxCompletionTokens) ? tr.maxCompletionTokens : 64,
                        };
                    }
                } catch (_) { /* Tracker not ready */ }
            }
            const local = settings.openRouter || {};
            return {
                source: 'local',
                apiKey: String(local.apiKey || '').trim(),
                modelId: String(local.modelId || '').trim(),
                temperature: Number.isFinite(local.temperature) ? local.temperature : 0.1,
                maxCompletionTokens: Number.isFinite(local.maxCompletionTokens) ? local.maxCompletionTokens : 64,
            };
        },

        async classify(systemContent, userContent) {
            const cfg = API.getOpenRouterConfig();
            if (!cfg.apiKey) throw new Error('OpenRouter API key is missing (Tracker or local).');
            if (!cfg.modelId) throw new Error('OpenRouter model is not selected (Tracker or local).');

            const timeoutMs = Math.max(2000, window.NBS.State.getSettings().timeoutMs || 10000);
            const payload = {
                model: cfg.modelId,
                temperature: cfg.temperature,
                max_completion_tokens: cfg.maxCompletionTokens,
                stream: false,
                response_format: { type: 'json_object' },
                reasoning: { enabled: false, effort: 'none' },
                messages: [
                    { role: 'system', content: systemContent },
                    { role: 'user', content: userContent },
                ],
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            let response;
            try {
                response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${cfg.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': globalThis.location?.origin || 'http://localhost',
                        'X-OpenRouter-Title': 'NDS_Narration_Beat_Switch',
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                });
            } catch (fetchErr) {
                clearTimeout(timeoutId);
                if (fetchErr.name === 'AbortError') {
                    throw new Error(`OpenRouter classify timed out after ${timeoutMs / 1000}s`);
                }
                throw fetchErr;
            }
            clearTimeout(timeoutId);

            if (!response.ok) {
                const text = await response.text().catch(() => '');
                throw new Error(`OpenRouter classify failed ${response.status}${text ? ': ' + text.slice(0, 240) : ''}`);
            }

            const data = await response.json();
            return data?.choices?.[0]?.message?.content || '{}';
        },
    };

    window.NBS.API = API;
})();
