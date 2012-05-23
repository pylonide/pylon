#!/usr/bin/env node

var path = require('path');
var architect = require("architect");
var EXEC = require("child_process").exec;

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
   if (process.argv[p] == "-d") {
       debug = true;
       
       if(!path.existsSync("plugins-client/lib.apf/www/apf-packaged/apf_debug.js")) {
       		console.log("Building apfdebug for first run...");
       		EXEC("npm run-script build-debug", function (error, stdout, stderr) {
		        if (error || stderr) {
		            console.error(stderr);
		            process.exit(1);
		        }
		        console.log(stdout);
		        boot();
	    	});
       }
       else
       	boot();
   }

   else if (process.argv[p] == "-P") {
       packed = true;
       if (process.argv[p + 1] && process.argv[p + 1].indexOf("-") < 0) // use this specific packed file
       	packedName = process.argv[++p];
       else
       	packedName = "packed.js";
       	
       if(!path.existsSync("plugins-client/lib.packed/www/" + packedName)) {
       		console.log("Building packed file for first run...Please wait...");
		   	console.log("   |\\      _,,,---,,_\n"+
		   				"   /,`.-'`'    -.  ;-;;,_\n" +
		  				"   |,4-  ) )-,_..;\\ (  `'-'\n" +
		 				"   '---''(_/--'  `-'\\_)  Felix Lee");
       		EXEC("npm run-script build-packed", function (error, stdout, stderr) {
		        if (error || stderr) {
		            console.error(stderr);
		            process.exit(1);
		        }
		        console.log(stdout);
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
	var config = require(configPath);

	config.containers.master.plugins = config.containers.master.plugins.filter(function(plugin) {
	   if (packed === true) {
	       if (
	           /\/plugins-client\/cloud9.core$/.test(plugin) ||
	           /\/plugins-client\/lib.ace$/.test(plugin) ||
	           /\/plugins-client\/lib.apf$/.test(plugin) ||
	           /\/plugins-client\/lib.treehugger$/.test(plugin) ||
	           /\/plugins-client\/lib.v8debug$/.test(plugin)
	       ) {
	           return false;
	       }
	   }
	   return true;
	});

	// server plugins
	config.containers.master.plugins.forEach(function(plugin) {
	   if (plugin.packagePath && /\.\/cloud9.core$/.test(plugin.packagePath)) {
	       plugin.debug = debug;
	       plugin.packed = packed;
	       plugin.packedName = packedName;
	   }
	});

	if (packed === true) {
	   config.containers.master.plugins.push("./../plugins-client/lib.packed");
	}

	architect.createApp(config, {
	   console: ((debug)?console:null)
	}, function (err, app) {
	   if (err) {
	       console.error("While starting the '%s':", configPath);
	       throw err;
	   }
	   console.log("Started '%s'!", configPath);
	});
}