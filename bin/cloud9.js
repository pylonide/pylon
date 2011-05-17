#!/usr/bin/env node
/**
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require ("../support/paths");

var Sys = require("sys"),
    Fs  = require("fs"),
    Parser = require("cloud9/optparse");

if (parseInt(process.version.split(".")[1]) < 2) {
    Sys.puts("ERROR: Cloud9 IDE requires node version 0.2.x or higher, but you are using " + process.version);
    process.exit(1);
}

var options = Parser.parse([
    {short: "w", long: "workspace", description: "Path to the workspace that will be loaded in Cloud9 (may be relative or absolute).", value: true, def: "." },
    {short: "p", long: "port", parser: parseInt, description: "Port number where Cloud9 will serve from.", value: true, def: process.env.C9_PORT || 3000 },
    {short: "l", long: "ip", description: "IP address where Cloud9 will serve from.", value: true, def: process.env.C9_PORT ? "0.0.0.0" : "127.0.0.1" },
    {short: "a", long: "action", description: "Define an action to execute after the Cloud9 server is started.", value: true, def: null, parser: function(value) {
        return value.split(/\s+/g);
    }},
    {short: "d", long: "debug", description: "Activate debug-mode.", def: false},
    {short: "u", long: "user", description: "Run child processes as a specific user.", def: false },
    {short: "g", long: "group", description: "Run child processes with a specific group.", def: false },
    {short: "c", long: "config", description: "Load the configuration from a config file. Overrides command-line options.", value: true, def: null, parser: function(value) {
            var pref = ( value.charAt(0) == "/" ) ? "" :  process.cwd() + "/";
            return require(pref + value.replace(".js", "")).Config;
        }
    }
], true);

// options in a config file override CLI options
if (options.config) {
    for (var key in options.config)
        options[key] = options.config[key];
}

var version = options.version = JSON.parse(Fs.readFileSync(__dirname + "/../package.json")).version;

require("cloud9").main(options);

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

if (options.ip === "all" || options.ip === "0.0.0.0")
    options.ip = "localhost";

var url = "http://" + options.ip + ":" + options.port;
if (options.action) {
    Sys.puts("Trying to start your browser in: " + url);
    options.action.push(url);
    require("child_process").spawn(options.action[0], options.action.slice(1));
}
else {
    Sys.puts("Point your browser to " + url);
}
