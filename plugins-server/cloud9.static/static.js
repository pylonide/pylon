var connect = require("connect");
//var connect_static = require("connect-architect/connect/middleware/static");

module.exports = function startup(options, imports, register) {

    var rjs = {};
    var prefix = options.bindPrefix || options.prefix || "/static";
    var workerPrefix = options.workerPrefix || "/static";
    
    var staticServer = connect.createServer();
    imports.connect.useMain(prefix, staticServer);

    register(null, {
        "static": {
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

                        staticServer.use(s.mount, connect.static(s.path));

                    }

                    var libs = s.rjs || {};
                    for (var name in libs) {
                        rjs[name] = join(prefix, libs[name]);
                    }
                });
            },

            getRequireJsPaths: function() {
                return rjs;
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
