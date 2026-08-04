(function () {
    'use strict';

    window.NBS = window.NBS || {};

    // Every template is a plain-text .md file in library/templates/, in the
    // format the desktop editor (tools/nbs_template_editor.py) and the import
    // box both speak:
    //
    //     # NBS Template: My Template
    //
    //     <capsule label="combat" trigger="a fight is happening">
    //     ...free-text instructions...
    //     </capsule>
    //
    // These files are the ONLY source of truth. They are read fresh at every
    // boot — nothing is cached, copied into settings, or protected from edits.
    //
    // The browser cannot list a directory over HTTP, so the filenames live in
    // the array below. The desktop editor rewrites it whenever you add, rename
    // or delete a template, so you should not need to touch it by hand.

    window.NBS.DefaultTemplateFiles = [
        'dnd_mechanics.md',
        'genre_chameleon.md',
        'gm_manual_ext.md',
    ];

    // Which template is selected the first time, before the user picks one.
    // Just a starting point — any template can be made active, and the choice
    // is remembered in settings. Nothing here is special or immutable.
    window.NBS.DefaultActiveTemplate = 'GM Manual Extended';
})();
