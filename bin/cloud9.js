#!/usr/bin/env node
/**
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Sys = require("sys"),
    Fs  = require("fs"),
    mapOptions = {
        w: { key: "workspace", hint: "WORKSPACE_DIR ('{def}')", def: "." },
        p: { key: "port", parser: parseInt, hint: "PORT ({def})", def: 3000 },
        l: { key: "ip", hint: "LISTEN_IP ('{def}')", def: "127.0.0.1" },
        a: { key: "action", hint: "ACTION", def:null, parser: function(value) {
            return value.split(/\s+/g);
        }},
        u: { key: "user", hint: "RUN_AS_USER", def: null },
        g: { key: "group", hint: "RUN_AS_GROUP", def: null },
        c: { key: "_config", parser: function(value) {
            var pref = ( value.charAt(0) == "/" ) ? "" :  process.cwd() + "/";
                return require(pref + value.replace(".js", "")).Config;
            },
            hint: "configFile"
        }
    };

function usage() {
    var message = "USAGE: cloud9",
        hint, opt, def,
        mapOption;

    for(opt in mapOptions) {
        mapOption = mapOptions[opt];
        hint = mapOption.hint;
        def = mapOption.def;
        message += " [-" + opt + " " + hint.replace("{def}", def) + "]";
    }
    Sys.puts(message);
    process.exit(0);
}

function getArg(argv, arg) {
    var option = argv.shift(),
        optionMap = mapOptions[arg.replace("-", "")],
        key = optionMap ? optionMap.key : null,
        parser = optionMap ? optionMap.parser : null;

    if(!key || !option){
        usage();
        return null;
    }
    if(parser)
        option = parser(option);
    return { key: key, value: option};
}

function parseArguments(argv) {
    var arg, key, opt, opts = {}, opts_def = {};
    while (argv.length && (arg = argv.shift())) {
        opt = getArg(argv, arg);
        opts[opt.key] = opt.value;
    }
    //set default values
    for(key in mapOptions) {
        opt = mapOptions[key];
        opts_def[opt.key] = opt.def;
    }
    //merge config options
    for(key in opts_def) {
        if(!opts[key])
            opts[key] = (opts._config && opts._config[key])? opts._config[key] : opts_def[key] ;
    }
    delete opts._config;
    return opts;
}


if (parseInt(process.version.split(".")[1]) < 2) {
    Sys.puts("ERROR: Cloud9 IDE requires node version 0.2.x or higher, but you are using " + process.version);
    process.exit(1);
}

var options = parseArguments(process.argv.slice(2)),
    version = JSON.parse(Fs.readFileSync(__dirname + "/../package.json")).version;
require("../server/lib/cloud9").main(options);

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
if (options.action) {
    Sys.puts("Trying to start your browser in: "+url);
    options.action.push(url);
    require("child_process").spawn(options.action[0], options.action.slice(1));
}
else {
    Sys.puts("Point you browser to " + url);
}
