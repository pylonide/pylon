var path = require("path"),
    connect = require("connect"),
    bundler = require("sourcemint-platform-nodejs/lib/bundler");

module.exports = function startup(options, imports, register) {

    var prefix = (options.prefix || "/static/bundles");

    // Serve the sourcemint loader file.
    var loaderStatic = connect.static(path.dirname(require.resolve("sourcemint-loader-js/package.json")));
    imports.connect.addRoute("get", /(\/loader\.[^\/]*)/, function(req, res) {
        req.url = req.params[0];
        loaderStatic(req, res, function() {
            res.writeHead(404);
            res.end("Not found!");
        });
    });

    register(null, {
        "sourcemint": {
            addPackage: function(name, path) {
                var route = new RegExp("^" + prefix.replace(/\//g, "\\/") + "\\/" + name + "(?:\.js)?(\/.*)?$");
                imports.connect.addRoute("get", route, bundler.hoist(path, {
                    packageIdHashSeed: "c9os"
                }));
            }
        }
    });
};