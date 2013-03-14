#!/usr/bin/env node

var path = require('path');
var architect = require("architect");
var spawn = require("child_process").spawn;
var fs = require("fs");

// TODO: Need better args parser.

var configName = process.argv[2] || "default";

// when command line arguments are passed into this, we ignore them
// when loading the config file.
if (configName.indexOf("-") === 0) {
   configName = "default";
}

// If a password is given as a command line parameter, we hide it
// in the title of the process instead of displaying it in plain
// text.
var title_parts = process.argv.slice();
title_parts.forEach(function(element, index, array) {
  if (element === '--password') {
    array[index+1] = 'xxxxxxxx';
  }
});
process.title = title_parts.join(' ');

var debug = false;
var packed = false;
var packedName = "";

for (var p = 2; p < process.argv.length; p++) {
   if (process.argv[p] === "-d") {
       debug = true;

       // apf debug doesn't exist, or it's older than three days--rebuild it
       if(!path.existsSync("plugins-client/lib.apf/www/apf-packaged/apf_debug.js") ||
          (path.existsSync("plugins-client/lib.apf/www/apf-packaged/apf_debug.js")) &&
          ((new Date() - fs.statSync("plugins-client/lib.apf/www/apf-packaged/apf_debug.js").mtime.valueOf()) / 86400000) >= 3) {
           console.log("Building apfdebug for first run...");

           var buildDebug = spawn("npm", ["run-script", "build-debug"]);

           buildDebug.stderr.setEncoding("utf8");
           buildDebug.stderr.on('data', function (data) {
              console.error(data);
           });

           buildDebug.on('exit', function (code) {
              if (code !== 0) {
                console.error('build-debug process exited with code ' + code);
                process.exit(code);
              }
              boot();
           });
       }
       else
           boot();
   }

   else if (process.argv[p] === "-P") {
       packed = true;
       if (process.argv[p + 1] && process.argv[p + 1].indexOf("-") < 0) // use this specific packed file
            packedName = process.argv[++p];
       else
            packedName = "c9os.min.js";

       configName = "packed";

       if(!path.existsSync("plugins-client/lib.packed/www/" + packedName) && !path.existsSync("plugins-client/lib.packed/www/" + packedName + ".gz")) {
           console.log("Building packed file for first run...Please wait...");
           console.log("   |\\      _,,,---,,_\n" +
                       "   /,`.-'`'    -.  ;-;;,_\n" +
                       "   |,4-  ) )-,_..;\\ (  `'-'\n" +
                       "   '---''(_/--'  `-'\\_)  Felix Lee");

            var buildPackage = spawn("npm", ["run-script", "build-packed"]);

            buildPackage.stderr.setEncoding("utf8");
            buildPackage.stderr.on('data', function (data) {
              console.error(data);
            });
            buildPackage.on('exit', function (code) {
              if (code !== 0) {
                console.error('build-package process exited with code ' + code);
                process.exit(code);
              }
              boot();
            });
       }
       else
           boot();
   }
}

if (debug == false && packed == false)
	boot();

function boot() {
	var configPath = path.resolve(__dirname, "./configs/", configName);
	var plugins = require(configPath);

	// server plugins
	plugins.forEach(function(plugin) {
	   if (plugin.packagePath && /\.\/cloud9.core$/.test(plugin.packagePath)) {
	       plugin.debug = debug;
	       plugin.packed = packed;
	       plugin.packedName = packedName;
	   }
	});

  architect.createApp(architect.resolveConfig(plugins, __dirname + "/plugins-server"), function (err, app) {
	   if (err) {
	       console.error("While starting the '%s':", configPath);
	       throw err;
	   }
	   console.log("Started '%s'!", configPath);
	});
}
