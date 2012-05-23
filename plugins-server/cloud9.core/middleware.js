var error = require("http-error");
var fs = require("fs");

exports.errorHandler = function() {
    
    return function(err, req, res, next) {
        if (err && (typeof err.code !== "undefined" && typeof err.defaultMessage !== "undefined")) {
            // if it walks like a duck, etc.
            // don't do anything
        }
        else if (!(err instanceof Error)) {
            err = new error.InternalServerError(err.message || err.toString());
        }
        else if (!(err instanceof error.HttpError)) {
            err.code = 500;
            err.defaultMessage = "Internal Server Error";
        }

        var isXHR = req.url.indexOf("xhr=1") > -1 ||
            (req.headers["x-requested-with"] && req.headers["x-requested-with"].toLowerCase() == "xmlhttprequest");

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
