var sys = require("sys");

exports.HttpError = function(message, code) {
    Error.call(this, message);
    //Error.captureStackTrace(this, arguments.callee);
    this.message = message;
    this.code = code;
};
sys.inherits(exports.HttpError, Error);

(function() {

    this.toString = function() {
        return this.message;
    };

}).call(exports.HttpError.prototype);


var statusCodes = {
    400: "BadRequest",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    411: "Length Required",
    412: "Precondition Failed",
    413: "Request Entity Too Large",
    414: "Request-URI Too Long",
    415: "Unsupported Media Type",
    416: "Requested Range Not Satisfiable",
    417: "Expectation Failed",
    418: "ImATeapot", // (RFC 2324) http://tools.ietf.org/html/rfc2324
    420: "EnhanceYourCalm", // Returned by the Twitter Search and Trends API when the client is being rate limited
    422: "UnprocessableEntity", // (WebDAV) (RFC 4918)
    423: "Locked", // (WebDAV) (RFC 4918)
    424: "FailedDependency", // (WebDAV) (RFC 4918)
    425: "UnorderedCollection", // (RFC 3648)
    426: "UpgradeRequired", // (RFC 2817)
    428: "PreconditionRequired",
    429: "TooManyRequests", // Used for rate limiting
    431: "RequestHeaderFieldsTooLarge",
    444: "NoResponse", // An nginx HTTP server extension. The server returns no information to the client and closes the connection (useful as a deterrent for malware).
    449: "RetryWith", // A Microsoft extension. The request should be retried after performing the appropriate action.
    450: "BlockedByWindowsParentalControls",
    499: "ClientClosedRequest",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
    505: "HTTPVersionNotSupported"
};

for (var status in statusCodes) {
    var defaultMsg = statusCodes[status];

    var error = (function(defaultMsg, status) {
        return function(msg) {
            this.defaultMessage = defaultMsg;
            exports.HttpError.call(this, msg || status + ": " + defaultMsg, status);

            if (status >= 500)
                Error.captureStackTrace(this, arguments.callee);
        };
    })(defaultMsg, status);

    sys.inherits(error, exports.HttpError);

    var className = toCamelCase(defaultMsg);
    exports[className] = error;
    exports[status] = error;
}

function toCamelCase(str) {
    return str.toLowerCase().replace(/(?:(^.)|(\s+.))/g, function(match) {
        return match.charAt(match.length-1).toUpperCase();
    });
}