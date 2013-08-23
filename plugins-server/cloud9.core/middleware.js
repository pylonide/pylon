var error = require("http-error");
var fs = require("fs");

var ERROR_TMPL = fs.readFileSync(__dirname + "/view/error.tmpl.html", "utf8");

exports.errorHandler = function() {
    
    return function(err, req, res, next) {
        // unable to respond
        if (res.headerSent)
            return req.socket.destroy();

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
            var html = ERROR_TMPL.replace(/\<%errormsg%\>/g, err.toString().replace(/\n/g, "\n<br/>"));
            res.writeHead(err.code || 500, {"Content-Type": "text/html"});
            return res.end(html);
        }
        else {
            res.writeHead(err.code || 500, {"Content-Type": "text/plain"});
            res.end(err.message ? err.message.toString() : "");
        }
        if (err.stack)
            console.log("Exception found:\n" + err.message + "\n" + err.stack);
    };
};
