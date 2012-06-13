var connect = require("connect");

module.exports = function startup(options, imports, register) {

    var rjs = {};
    var prefix = options.prefix || "/static";
    var workerPrefix = options.workerPrefix || "/static";
    
    var staticServer = connect.createServer();
    imports.connect.useMain(options.bindPrefix || prefix, staticServer)

    register(null, {
        "static": {
            addStatics: function(statics) {
                for (var i = 0; i < statics.length; i++) {
                    var s = statics[i];

                    console.log("MOUNT", s.mount, s.path, prefix);
                    staticServer.use(s.mount, connect.static(s.path));

                    var libs = s.rjs || {};
                    for (var name in libs) {
                        rjs[name] = join(prefix, libs[name]);
                    }
                }
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