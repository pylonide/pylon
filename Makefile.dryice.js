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
        console.log("--- Cloud9 Dryice Build Tool ---");
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
