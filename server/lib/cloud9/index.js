/**
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require("../../../common/paths");

var Connect = require("connect");
var Fs = require("fs");
var Path = require("path");
var IdeServer = require("lib/cloud9/server");

exports.main = function(projectDir, port, ip) {
    if (!Path.existsSync(projectDir)) 
        throw new Error("Workspace directory does not exist: " + projectDir);
        
    var commonProvider = function() {
        var common = Connect.staticProvider(Path.normalize(__dirname + "/../../../common"));
        return function(req, resp, next) {
            var path = require("url").parse(req.url).pathname;
            if (path.indexOf("/common") === 0) {
                req.url = req.url.replace("/common", "");
                common(req, resp, next);
            }
            else {
                next();
            }
        };
    };
    var server = Connect.createServer(
        //Connect.logger(),
        Connect.conditionalGet(),
        //Connect.gzip(),
        commonProvider(),
        Connect.staticProvider(Path.normalize(__dirname + "/../../../client"))
    );

    if (ip === "all" || ip === "0.0.0.0")
        ip = null;

    // load plugins:
    var exts = {};
    Fs.readdirSync(__dirname + "/../../ext").forEach(function(name){
        exts[name] = require("ext/" + name);
    });

    server.listen(port, ip);
    new IdeServer(projectDir, server, exts);
};

if (module === require.main) {
    exports.main(".", 3000, '127.0.0.1')
}