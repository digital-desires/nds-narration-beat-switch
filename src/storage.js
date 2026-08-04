/**
 * Tombstone — kept for one release cycle, then deletable.
 *
 * v0.4.0 removed the narrator-tools-storage template cache; templates are now
 * read straight from library/templates/*.md and nothing in the extension uses
 * this module any more.
 *
 * It still exists because a browser that cached the v0.3.0 index.js keeps
 * requesting 'src/storage.js' after the update lands. Without this file that
 * request 404s, loadModule() rejects, boot() throws, and the extension dies
 * completely — the update would look like it broke the extension.
 *
 * Safe to delete once v0.4.0+ has been out long enough that no cached v0.3.0
 * bootstrap is still in circulation.
 */
(function () {
    'use strict';

    window.NBS = window.NBS || {};
    console.info('[NBS] src/storage.js is a no-op since v0.4.0 — templates load from library/templates/*.md. Reload with cache bypass (Ctrl+F5) to pick up the current bootstrap.');
})();
