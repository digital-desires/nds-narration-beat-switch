(function () {
    'use strict';

    window.NBS = window.NBS || {};

    // Factory template registry. Each factory template is a plain-text .md
    // file in library/templates/ using the same format the editor and the
    // import box speak:
    //
    //     # NBS Template: My Template
    //
    //     <capsule label="combat" trigger="a fight is happening">
    //     ...free-text instructions...
    //     </capsule>
    //
    // To add a new factory template: drop the .md file in library/templates/
    // and add its filename to DefaultTemplateFiles below. Files are fetched
    // and parsed at boot by Templates.loadFactoryTemplates().

    window.NBS.DefaultTemplateFiles = [
        'literary_prose.md',
        'dnd_mechanics.md',
        'legacy_v1.md',
        'genre_chameleon.md',
    ];

    window.NBS.DefaultTemplates = {
        version: 1,
        defaultActive: 'Literary Prose',
        templates: {},
        // Retired factory capsule sets, keyed by template name. A saved template
        // byte-identical to an entry here is purged so the new factory version
        // seeds in its place. Empty at v1.
        legacyTemplates: {},
    };

    window.NBS.registerDefaultTemplate = function (name, template) {
        if (!name || !template || !Array.isArray(template.capsules)) {
            console.warn('[NBS] registerDefaultTemplate: invalid template', name);
            return;
        }
        window.NBS.DefaultTemplates.templates[name] = template;
        console.info(`[NBS] Factory template registered: "${name}" (${template.capsules.length} capsules)`);
    };
})();
