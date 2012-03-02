var connect = require("connect");
var error = require("./error");
var fs = require("fs");
var path = require("path");

exports.staticProvider = function (root, mount) {
    var staticProvider = connect.static(path.normalize(root));

    return function (request, response, next) {
        var url      = request.url;
        var pathname = require("url").parse(url).pathname;

        if (pathname.indexOf(mount) === 0) {
            request.url = url.replace(mount, "") || "/";

            staticProvider(request, response, function (err) {
                request.url = url;
                next(err);
            });
        } else
            next();
    };
};

exports.errorHandler = function() {
    return function(err, req, res, next) {
        if (!(err instanceof Error)) {
            err = new error.InternalServerError(err.message || err.toString());
        }
        else if (!(err instanceof error.HttpError)) {
            err.code = 500;
            err.defaultMessage = "Internal Server Error";
        }

        var isXHR = req.headers["x-requested-with"] && req.headers["x-requested-with"].toLowerCase() == "xmlhttprequest";
        if (!isXHR) {
            fs.readFile(__dirname + "/view/error.tmpl.html", "utf8", function(e, html) {
                if (e)
                    return next(e);

                html = html
                    .toString('utf8')
                    .replace(/\<%errormsg%\>/g, err.toString());

                res.writeHead(err.code || 500, {"Content-Type": "text/html"});
                return res.end(html);
            });
        }
        else {
            res.writeHead(err.code || 500, {"Content-Type": "text/plain"});
            res.end(err.message ? err.message.toString() : "");
        }
        if (err.stack)
            console.log("Exception found" + err.message + "\n" + err.stack);
    };
};
