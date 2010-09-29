#!/usr/bin/env node
/**
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

function usage() {
    console.log("USAGE: cloud9 [-w WORKSPACE_DIR ('.')] [-l LISTEN_IP ('127.0.0.1')] [-p PORT (3000)]")
    process.exit(0)
}

function parseArguments(argv) {
    var opts = {
        workspace: ".",
        ip: "127.0.0.1",
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
            case "-l":
                var ip = argv.shift();
                if (!ip)
                    return usage();
                opts.ip = ip;
                break;
            default:
        if (arg.indexOf('-a')==0) {
            var args = arg.slice(2).split(' ');
            opts.start = args.shift();
            opts.startargs = args;
        } else
            return usage();

        }
    }

    return opts;
}



var options = parseArguments(process.argv.slice(2));

require("../server/lib/cloud9").main(options.workspace, options.port, options.ip);
console.log("ajax.org Cloud9 IDE");
console.log("Project root is: " + options.workspace);
var url = "http://" + options.ip + ":" + options.port;

if (options.start) {
    console.log("Trying to start your browser in: "+url);
    options.startargs.push(url);
    require("child_process").spawn(options.start, options.startargs); 
} else
    console.log("Point you browser to "+url);
