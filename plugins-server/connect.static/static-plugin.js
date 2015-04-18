var Connect = require("connect");
var serveStatic = require("serve-static");
var serveFavicon = require("serve-favicon");

module.exports = function startup(options, imports, register) {

    var rjs = {
        "paths": {},
        "packages": []
    };
    var prefix = options.prefix || "/static";
    var workerPrefix = options.workerPrefix || "/static";

    var connect = imports.connect.getModule();
    var staticServer = connect();
    imports.connect.useMain(options.bindPrefix || prefix, staticServer);

    register(null, {
        "static": {

            favicon: function (path, options) {
                imports.connect.useMain(serveFavicon(path, options));
            },

            addStatics: function(statics) {

                statics.forEach(function(s) {

//                    console.log("MOUNT", prefix, s.mount, s.path);

                    if (s.router) {
                        var server = connect.static(s.path);
                        staticServer.use(s.mount, function(req, res, next) {
                            s.router(req, res);
                            server(req, res, next);
                        });

                    } else {

                        staticServer.use(s.mount, serveStatic(s.path));

                    }

                    var libs = s.rjs || {};
                    for (var name in libs) {
                        if (typeof libs[name] === "string") {
                            rjs.paths[name] = join(prefix, libs[name]);
                        } else {
                            // TODO: Ensure package is not already registered!
                            rjs.packages.push(libs[name]);
                        }
                    }
                });
            },

            getRequireJsPaths: function() {
                return rjs.paths;
            },

            getRequireJsPackages: function() {
                return rjs.packages;
            },

            getStaticPrefix: function() {
                return prefix;
            },

            getWorkerPrefix: function() {
                return workerPrefix;
            }
        }
    });

    function join(prefix, path) {
        return prefix.replace(/\/*$/, "") + "/" + path.replace(/^\/*/, "");
    }
};
