var path = require("path");
var fs = require("fs");
var bundler = require("sourcemint-platform-nodejs/lib/bundler");

module.exports = function startup(options, imports, register) {

    var plugins = options.plugins || {};
    var prefix = (options.prefix || "/static/bundles");

    var loaderStatic = imports.connect.getModule().static(path.dirname(require.resolve("sourcemint-loader-js/package.json")));

    imports.connect.useStart(imports.connect.getModule().router(function(app) {

        // Serve the sourcemint loader file.
        app.get(/^(\/loader\.[^\/]*)/, function(req, res) {
            req.url = req.params[0];
            loaderStatic(req, res, function() {
                res.writeHead(404);
                res.end("Not found!");
            });
        });

        // Serve client plugin bundles if available.
        for (var name in plugins) {
            var route = new RegExp("^" + prefix.replace(/\//g, "\\/") + "\\/" + name + "(?:\.js)?(\\/.*)?$");
            var testRoute = new RegExp("^" + prefix.replace(/\//g, "\\/") + "\\/test\\/" + name + "(?:\.js)?(\\/.*)?$");

            var packagePath = plugins[name] + "/package.json";
            var testPackagePath = plugins[name] + "/test/package.json";
            if (path.existsSync(packagePath)) {
                var descriptor = JSON.parse(fs.readFileSync(packagePath));
                if (descriptor.bundled === true) {
                    imports.log.log("MINT", route, plugins[name]);
                    app.get(route, bundler.hoist(plugins[name], {
                        packageIdHashSeed: "c9os"
                    }));
                    if (path.existsSync(testPackagePath)) {
                        // TODO: Only register testRoute if mode !== production.
                        app.get(testRoute, bundler.hoist(plugins[name] + "/test", {
                            packageIdHashSeed: "c9os-test"
                        }));
                    }
                }
            }
        };
    }));

    register(null, {
        "sourcemint": {}
    });
};