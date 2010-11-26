var Path = require("path");
var connect = require("connect");
var error = require("./error");

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

exports.errorHandler = function() {
    return function(err, req, res, next) {
        if (!(err instanceof Error)) {
            err = new error.InternalServerError(err + "")
        }
        else if (!(err instanceof error.HttpError)) {
            err.code = 500
            err.defaultMessage = "Internal Server Error"
        }

        res.writeHead(err.code, {
            "Content-Type": "text/plain"
        });
        res.end(err.message + (err.stack ? "\n" + err.stack : ""));
        if (err.stack)
            console.log("Exception found" + err.message + "\n" + err.stack);
    }
};
