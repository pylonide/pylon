#!/usr/bin/env node

const PATH = require("path");
const ARCHITECT = require("architect");
const SPAWN = require("child_process").spawn;
const ERROR = require("sourcemint-platform-nodejs/node_modules/sourcemint-util-js/lib/error");
const TERM = require("sourcemint-platform-nodejs/node_modules/sourcemint-util-js/lib/term");


exports.main = function(options, callback) {

    var debug = false;
    var packed = false;
    var packedName = "";

    // TODO: Need better args parser.
    // when command line arguments are passed into this, we ignore them
    // when loading the config file.
    if (options.configName.indexOf("-") === 0) {
        options.configName = "default";
    }
    for (var p = 2; p < options.args.length; p++) {
        if (options.args[p] === "-d") {
            debug = true;
           
            if(!PATH.existsSync("plugins-client/lib.apf/www/apf-packaged/apf_debug.js")) {
            		console.log("Building apfdebug for first run...");
           		
                var buildDebug = SPAWN("npm", ["run-script", "build-debug"]);

                buildDebug.stderr.setEncoding("utf8");
                buildDebug.stderr.on("data", function (data) {
                    process.stderr.write(data);
                });
                buildDebug.on("exit", function (code) {
                    if (code !== 0) {
                        callback(new Error("build-debug process exited with code: " + code));
                        return;
                    }
                    boot();
                });
            }
            else {
                boot();
            }
        }
        else if (options.args[p] === "-P") {
            packed = true;
            if (options.args[p + 1] && options.args[p + 1].indexOf("-") < 0) // use this specific packed file
                packedName = options.args[++p];
            else
                packedName = "packed.js";

            options.configName = "packed";

            if(!PATH.existsSync("plugins-client/lib.packed/www/" + packedName) && !PATH.existsSync("plugins-client/lib.packed/www/" + packedName + ".gz")) {
            		console.log("Building packed file for first run...Please wait...");
      		   	  console.log("   |\\      _,,,---,,_\n"+
              		   				"   /,`.-'`'    -.  ;-;;,_\n" +
              		  				"   |,4-  ) )-,_..;\\ (  `'-'\n" +
        		        				"   '---''(_/--'  `-'\\_)  Felix Lee");

                var buildPackage = SPAWN("npm", ["run-script", "build-packed"]);
                
                buildPackage.stderr.setEncoding("utf8");
                buildPackage.stderr.on("data", function (data) {
                    process.stderr.write(data);
                });
                buildPackage.on("exit", function (code) {
                    if (code !== 0) {
                        callback(new Error("build-package process exited with code: " + code));
                        return;
                    }
                    boot();
                });
            }
            else {
               boot();
            }
        }
    }
    if (debug == false && packed == false) {
        boot();
    }

    function boot() {
        try {
          	var configPath = PATH.resolve(__dirname, "./configs/", options.configName);
           	var plugins = require(configPath);

          	// server plugins
          	plugins.forEach(function(plugin) {
          	    if (plugin.packagePath && /\.\/cloud9.core$/.test(plugin.packagePath)) {
                    plugin.debug = debug;
                    plugin.packed = packed;
                    plugin.packedName = packedName;
                }
          	});

            var config = ARCHITECT.resolveConfig(plugins, __dirname + "/plugins-server");

            ARCHITECT.createApp(config, function (err, app) {
          	    if (err) {
                    console.error("While starting the '%s':", configPath);
                    return callback(err);
          	    }
                console.log("Started '%s'!", configPath);
                callback(null, app.getService("http").getServer(), config);
          	});
        } catch(err) {
            callback(err);
        }
    }
}


if (require.main === module) {

    var options = {
        configName: process.argv[2] || "default",
        args: process.argv
    };

    exports.main(options, function(err) {
        if (err) {
            ERROR.exitProcessWithError(err);
        }
    });
}
