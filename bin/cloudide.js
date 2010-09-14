#!/usr/bin/env node

function usage() {
    console.log("USAGE: cloudide [-w WORKSPACE_DIR ('.')] [-p PORT (3000)]")
    process.exit(0)
}


function parseArguments(argv) {
    var opts = {
        workspace: ".",
        port: 3000
    };

    var arg;
    while (argv.length && (arg = argv.shift())) {
        switch(arg) {
            case "-w":
                var workspace = argv.shift();
                if (!workspace) return usage();
                opts.workspace = workspace;
                break;

            case "-p":
                var port = argv.shift();
                if (!port || parseInt(port) != port)
                    return usage();
                opts.port = parseInt(port);
                break;

            default:
                return usage();

        }
    }

    return opts;
}



var options = parseArguments(process.argv.slice(2));

require("../lib/cloudide").main(options.workspace, options.port);
console.log("ajax.org Cloud IDE");
console.log("Project root is: " + options.workspace);
console.log("Point you browser to http://localhost:" + options.port);