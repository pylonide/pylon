#!/usr/bin/env node

var fs = require("fs");
var copy = require('dryice').copy;

var ACE_HOME = __dirname + "/support/ace"

function main(args) {
    var target;
    if (args.length == 3) {
        target = args[2];
        // Check if 'target' contains some allowed value.
        if (target != "worker") {
            target = null;
        }
    }

    if (!target) {
        console.log("--- Cloud9 DryIce Build Tool ---");
        console.log("");
        console.log("Options:");
        console.log("  worker    build workers");
        process.exit(0);
    }

    var project = {
        roots: [
            ACE_HOME + "/lib",
            __dirname + "/client",
            __dirname + "/support/treehugger/lib"
        ],
        textPluginPattern: /^ace\/requirejs\/text!/
    };

    if (target == "worker") {
        worker(project);
    }
}

function worker(project) {
    console.log('# cloud9 worker ---------');

    var worker = copy.createDataObject();
    var workerProject = copy.createCommonJsProject(project);
    copy({
        source: [
            copy.source.commonjs({
                project: workerProject,
                require: [
                    'ace/lib/fixoldbrowsers',
                    'ace/lib/event_emitter',
                    'ace/lib/oop',
                    'ext/language/worker',
                    'ext/codecomplete/local_completer',
                    'ext/codecomplete/snippet_completer',
                    'ext/codecomplete/open_files_local_completer',
                    'ext/jslanguage/parse',
                    'ext/jslanguage/scope_analyzer',
                    'ext/jslanguage/narcissus_jshint',
                    'ext/jslanguage/debugger'
                ]
            })
        ],
        filter: [ copy.filter.moduleDefines, filterTextPlugin ],
        dest: worker
    });
    copy({
        source: [
            {root: 'client/ext/autotest', include: /.*\.(js)$/ },
            /*{root: 'client/ext/beautify', include: /.*\.(js)$/ },
            {root: 'client/ext/beautify/res', include: /.*\.(js)$/ },
            {root: 'client/ext/beautify/res/jsbeautify', include: /.*\.(js)$/ },*/
            {root: 'client/ext/clipboard', include: /.*\.(js)$/ },
            {root: 'client/ext/closeconfirmation', include: /.*\.(js)$/ },
            {root: 'client/ext/code', include: /.*\.(js)$/ },
            {root: 'client/ext/codecomplete', include: /.*\.(js)$/ },
            {root: 'client/ext/codecomplete/snippets', include: /.*\.(js)$/ },
            {root: 'client/ext/codetools', include: /.*\.(js)$/ },
            {root: 'client/ext/colorpicker', include: /.*\.(js)$/ },
            {root: 'client/ext/colorpicker/images', include: /.*\.(js)$/ },
            {root: 'client/ext/console', include: /.*\.(js)$/ },
            {root: 'client/ext/console/themes', include: /.*\.(js)$/ },
            {root: 'client/ext/consolehints', include: /.*\.(js)$/ },
            {root: 'client/ext/debugger', include: /.*\.(js)$/ },
            {root: 'client/ext/dockpanel', include: /.*\.(js)$/ },
            {root: 'client/ext/dragdrop', include: /.*\.(js)$/ },
            {root: 'client/ext/editors', include: /.*\.(js)$/ },
            {root: 'client/ext/extmgr', include: /.*\.(js)$/ },
            {root: 'client/ext/filesystem', include: /.*\.(js)$/ },
            {root: 'client/ext/gotofile', include: /.*\.(js)$/ },
            {root: 'client/ext/gotoline', include: /.*\.(js)$/ },
            {root: 'client/ext/gotoline/images', include: /.*\.(js)$/ },
            {root: 'client/ext/guidedtour', include: /.*\.(js)$/ },
            {root: 'client/ext/guidedtour/images', include: /.*\.(js)$/ },
            {root: 'client/ext/help', include: /.*\.(js)$/ },
            {root: 'client/ext/help/images', include: /.*\.(js)$/ },
            {root: 'client/ext/html', include: /.*\.(js)$/ },
            {root: 'client/ext/imgview', include: /.*\.(js)$/ },
            {root: 'client/ext/jslanguage', include: /.*\.(js)$/ },
            {root: 'client/ext/jslanguage/test', include: /.*\.(js)$/ },
            {root: 'client/ext/keybindings', include: /.*\.(js)$/ },
            {root: 'client/ext/keybindings_default', include: /.*\.(js)$/ },
            {root: 'client/ext/keybindings_default/res', include: /.*\.(js)$/ },
            {root: 'client/ext/minimap', include: /.*\.(js)$/ },
            {root: 'client/ext/newresource', include: /.*\.(js)$/ },
            {root: 'client/ext/noderunner', include: /.*\.(js)$/ },
            {root: 'client/ext/nodeunit', include: /.*\.(js)$/ },
            {root: 'client/ext/offline', include: /.*\.(js)$/ },
            {root: 'client/ext/offline/src', include: /.*\.(js)$/ },
            {root: 'client/ext/openfiles', include: /.*\.(js)$/ },
            {root: 'client/ext/panels', include: /.*\.(js)$/ },
            {root: 'client/ext/quicksearch', include: /.*\.(js)$/ },
            {root: 'client/ext/quicksearch/icons', include: /.*\.(js)$/ },
            {root: 'client/ext/quickstart', include: /.*\.(js)$/ },
            {root: 'client/ext/quickstart/images', include: /.*\.(js)$/ },
            {root: 'client/ext/quickwatch', include: /.*\.(js)$/ },
            {root: 'client/ext/recentfiles', include: /.*\.(js)$/ },
            {root: 'client/ext/runpanel', include: /.*\.(js)$/ },
            {root: 'client/ext/save', include: /.*\.(js)$/ },
            {root: 'client/ext/searchinfiles', include: /.*\.(js)$/ },
            {root: 'client/ext/searchinfiles/images', include: /.*\.(js)$/ },
            {root: 'client/ext/searchreplace', include: /.*\.(js)$/ },
            {root: 'client/ext/settings', include: /.*\.(js)$/ },
            {root: 'client/ext/settings/images', include: /.*\.(js)$/ },
            {root: 'client/ext/statusbar', include: /.*\.(js)$/ },
            {root: 'client/ext/stripws', include: /.*\.(js)$/ },
            {root: 'client/ext/tabbehaviors', include: /.*\.(js)$/ },
            {root: 'client/ext/tabsessions', include: /.*\.(js)$/ },
            {root: 'client/ext/testpanel', include: /.*\.(js)$/ },
            {root: 'client/ext/themes', include: /.*\.(js)$/ },
            {root: 'client/ext/themes_default', include: /.*\.(js)$/ },
            {root: 'client/ext/tree', include: /.*\.(js)$/ },
            {root: 'client/ext/undo', include: /.*\.(js)$/ },
            {root: 'client/ext/vim', include: /.*\.(js)$/ },
            {root: 'client/ext/vim/maps', include: /.*\.(js)$/ },
            {root: 'client/ext/watcher', include: /.*\.(js)$/ },
            {root: 'client/ext/zen', include: /.*\.(js)$/ }
        ],
        dest: __dirname + "/client/ext/dryice/ext.js"
    });
    copy({
        source: [
            ACE_HOME + "/lib/ace/worker/worker.js",
            worker
        ],
        filter: [ /* copy.filter.uglifyjs */],
        dest: __dirname + "/client/js/worker/worker.js"
    });
}

function filterTextPlugin(text) {
    return text.replace(/(['"])ace\/requirejs\/text\!/g, "$1text!");
}

if (!module.parent)
    main(process.argv);
