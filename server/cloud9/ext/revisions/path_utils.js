var Path = require("path");
var REV_FOLDER_NAME = ".c9revisions";
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

module.exports.getRealFile = function(path) {
    // Physical location of the workspace
    var root = this.ide.workspaceDir;
    if (!root)
        return null;

    return Path.join(root, path);
};

module.exports.getAbsoluteParent = function(path) {
    // Physical location of the workspace
    var root = this.ide.workspaceDir;
    if (!root)
        return null;

    // Revision backup folder
    var revFolder = Path.join(root, REV_FOLDER_NAME);
    return Path.join(revFolder, Path.dirname(path));
};

module.exports.getAbsolutePath = function(path) {
    return Path.join(module.exports.getAbsoluteParent.call(this, path), Path.basename(path));
};
