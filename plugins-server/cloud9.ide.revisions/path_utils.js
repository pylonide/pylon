/**
 * Revisions Path Utils for Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi@c9.io>
 * @copyright 2012, Ajax.org B.V.
 */

var Path = require("path");
/**
 * Transforms a relative path to a concorde session-style path.
 *
 * Example input: "ftest/server.js"
 * Example output: "sergi/node_chat/ftest/server.js"
 *
 * @param path <String>
 * @returns <String>
 */
module.exports.getSessionStylePath = function(path) {
    var baseUrl = this.ide.options.baseUrl;
    var baseUrlRegex = new RegExp("^" + baseUrl);
    if (!baseUrlRegex.test(path)) {
        path = Path.join(baseUrl, path);
    }
    return path.replace(/^\/+/, "");
};