var Path = require("path");
var connect = require("connect");

exports.staticProvider = function(path, mount) {
    var common = connect.staticProvider(Path.normalize(path));
    return function(req, resp, next) {
        var path = require("url").parse(req.url).pathname;
        if (path.indexOf(mount) === 0) {
            req.url = req.url.replace(mount, "") || "/";
            common(req, resp, next);
        }
        else {
            next();
        }
    };
}