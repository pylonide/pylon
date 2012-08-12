#!/usr/bin/env node

var fs = require('path');
var path = require('path');

// forward compatibility with node v0.8, path.exists*() has been deprecated
// and prints a warning message
path.existsSync = fs.existsSync || path.existsSync;
path.exists = fs.exists || path.exists;

var architect = require("architect");
var spawn = require("child_process").spawn;

// TODO: Need better args parser.

var configName = process.argv[2] || "default";

// when command line arguments are passed into this, we ignore them
// when loading the config file.
if (configName.indexOf("-") === 0) {
   configName = "default";
}

var debug = false;
var packed = false;
var packedName = "";

for (var p = 2; p < process.argv.length; p++) {
   if (process.argv[p] === "-d") {
       debug = true;
       
       if(!path.existsSync("plugins-client/lib.apf/www/apf-packaged/apf_debug.js")) {
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
            packedName = "packed.js";

       configName = "packed";

       if(!path.existsSync("plugins-client/lib.packed/www/" + packedName) && !path.existsSync("plugins-client/lib.packed/www/" + packedName + ".gz")) {
       		console.log("Building packed file for first run...Please wait...");
		   	  console.log("   |\\      _,,,---,,_\n"+
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
