var path = require("path"),
    connect = require("connect"),
    bundler = require("sourcemint-platform-nodejs/lib/bundler");

module.exports = function startup(options, imports, register) {

    var packages = options.packages || {};
    var prefix = (options.prefix || "/static/bundles");

    for (var name in packages) {
        var route = new RegExp("^" + prefix.replace(/\//g, "\\/") + "\\/" + name + "(?:\.js)?(\\/.*)?$");
        console.log("MINT", route, packages[name])
        imports.connect.addRoute("get", route, bundler.hoist(packages[name], {
            packageIdHashSeed: "c9os"
        }));
    };

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
        "sourcemint": {}
    });
};