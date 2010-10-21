#!/usr/bin/env node
/**
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Sys = require("sys"),
    Fs  = require("fs");

function usage() {
    Sys.puts("USAGE: cloud9 [-w WORKSPACE_DIR ('.')] [-l LISTEN_IP ('127.0.0.1')] [-p PORT (3000)] [-c configFile]");
    process.exit(0);
}

function parseArguments(argv) {
    var opts_def = {
        workspace: ".",
        ip: "127.0.0.1",
        port: 3000
    };

    var arg, key, config = {}, opts = {};
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

            case "-c":
                //get config file path and add current process path if its relative path, also remove ".js"
                var confFile = argv.shift(),
                    pref = ( confFile.charAt(0) == "/" ) ? "" :  process.cwd() + "/";
                if (!confFile)
                    return usage();
                config = require(pref + confFile.replace(".js", "")).Config;
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

    //merge config options
    for(key in opts_def) {
        if(!opts[key])
            opts[key] = config[key] || opts_def[key] ;
    }

    return opts;
}


if (parseInt(process.version.split(".")[1]) < 2) {
    Sys.puts("ERROR: Cloud9 IDE requires node version 0.2.x but you use " + process.version);
    return;
}

var options = parseArguments(process.argv.slice(2)),
    version = JSON.parse(Fs.readFileSync(__dirname + "/../package.json")).version;
require("../server/lib/cloud9").main(options.workspace, options.port, options.ip);

Sys.puts("\n\n                         .  ..__%|iiiiiii=>,..\n\
                          _<iIIviiiiiiiiiillli<_.\n\
                       .ivIvilli%||+++++|iillllvs;_\n\
                     ..nvlIlv|~`.......... -<*IIIvv=\n\
                    .)nvvvvv-.... .   .. ...  ~nvvvo=.\n\
         .__i<iiiii><vvvvn(= .  . ..i>, .  ... +)nnnv..\n\
      _i%vvvvllIIlIlIvIvvv(   .. . lnnsi  .    :)vnvnsissvisi>__.\n\
   .<vnvvvvvvIvvvvvvvlvvII;. .     |nnvv:  . . -)lvvlIIIIlvvIvnnns=_.\n\
 .:vnvvvvvvvvvvvvvIvIvIIvv>:  . . . |{}l.    . :<lvIvvvvvvvvvvvvvvnov.\n\
 |)nvnvnvnvnvnvvvvvvvvvvvvis .            . .  =ivvvvvvvvvvvnvnvnvnvnn..\n\
.nnnnnnvnnvnvnvnvvvnvvvvvvvnv_   .    .       :vnvvvvvvvnvnnvnnnnnnnnov;\n\
:2oonnnnnnnnnvnvnnvnvvnvvvvvIvvi==_i..    .  .vvvvvvvvnvnnvnnnnnnnnooooc\n\
:nnooonnnnnnnnnnvvnvvvvvvvvIvIlIvvnI-      .=vvvvvvvvnvnvnnnnnnnnnnooo2(\n\
 |{XooooonnnnnvnvnvvvvvvvIIIIIIIIv|-      .<vIlIIvIvvvvvnvvnvnnnnnooo2v(\n\
 .){2ooooonnnnvnvnvvvvvIIIIIIlll+-     . =)lllIIvIvvvvvvvnvnnnvnnooo22-`\n\
   -{2oooonnnnnvvvvvvvlIIlllllil==_   ._iIllillllllIvvvvvvnvnnnnoooo*-\n\
  . -.\"11oonnvvvnvvIIlIlliliiiiillii||iliiiiiiililllIIvvvvvnnnnn2}(~.\n\
      . -+~!lvvnvIvIIllliiiii|i|||i||i|||i||iiiiilillIIvvvvvv}|\"- .\n\
          . ..--~++++++++~+~+~+~+-+-+~+~+-+~+~++~++++++~~~-:.. .\n\
               . .  . . .... . . .... .. ... .. ... . . . .\n\n\
                           Ajax.org Cloud9 IDE\n\
                              version " + version + "\n\
Project root is: " + options.workspace);

var url = "http://" + options.ip + ":" + options.port;
if (options.start) {
    Sys.puts("Trying to start your browser in: "+url);
    options.startargs.push(url);
    require("child_process").spawn(options.start, options.startargs);
}
else {
    Sys.puts("Point you browser to " + url);
}
