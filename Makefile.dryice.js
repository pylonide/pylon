#!/usr/bin/env node

var copy = require('dryice').copy;

var ACE_HOME = __dirname + "/node_modules/ace"

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
            "/tmp/c9_worker_build",
            __dirname + "/node_modules/treehugger/lib"
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

    // We don't get a return value from dryice, so we monkey patch error handling
    var yeOldeError = console.error;
    console.error = function() {
        yeOldeError();
        yeOldeError("@@@@ FATAL ERROR: DRYICE FAILED", arguments);
        yeOldeError();
        process.exit(1);
    };
    
    copy({
        source: [
            copy.source.commonjs({
                project: workerProject,
                require: [
                    'ace/lib/fixoldbrowsers',
                    'ace/lib/event_emitter',
                    'ace/lib/oop',
                    'ace/narcissus/parser',
                    'ext/language/worker',
                    'ext/codecomplete/local_completer',
                    'ext/codecomplete/snippet_completer',
                    'ext/codecomplete/open_files_local_completer',
                    'ext/jslanguage/parse',
                    'ext/jslanguage/scope_analyzer',
                    'ext/jslanguage/jshint',
                    'ext/jslanguage/debugger',
                    'ext/jslanguage/outline',
                    'ext/linereport/linereport_base',
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
        dest: __dirname + "/plugins-client/lib.ace/www/worker/worker-language.js"
    });
    
    console.error = yeOldeError;
}

function filterTextPlugin(text) {
    return text.replace(/(['"])ace\/requirejs\/text\!/g, "$1text!");
}

if (!module.parent)
    main(process.argv);
