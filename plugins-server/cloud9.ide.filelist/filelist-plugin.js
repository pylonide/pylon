/**
 * Filelist module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var Url = require("url");
var Plugin = require("../cloud9.core/plugin");
var FilelistLib = require("./filelist");
var util = require("util");
var os = require("os");
var path = require("path");
var Connect = require("connect");
var error = require("http-error");

var name = "filelist";

module.exports = function setup(options, imports, register) {
    var Filelist = new FilelistLib(),
        platform = options.platform || os.platform(),
        arch = options.arch || os.arch();

    Filelist.setEnv({
        platform:  platform,
        arch:  arch,
        agCmd:  options.agCmd || path.join(__dirname, "..", "cloud9.ide.search", [platform, arch].join("_"), "ag"),
        nakCmd: options.nakCmd || "node " + path.join(__dirname, "..", "..", "node_modules/nak/bin/nak")
    });

    var Vfs = imports["vfs"];
    var IdeRoutes = imports["ide-routes"];
    var Permissions = imports["workspace-permissions"];

    var FilelistPlugin = function(ide, workspace) {
        Plugin.call(this, ide, workspace);
        this.name = name;
        this.processCount = 0;
        this.ws = ide.workspace.workspaceId;

        Filelist.setEnv({
            useAg: Filelist.isAgAvailable(),
            workspaceId: this.ws,
            basePath: ide.workspace.workspaceDir
        });

        // set up some routes as well
        var self = this;
        IdeRoutes.use("/fs", Connect.router(function(app) {
            app.get("/list", self.getList.bind(self));
        }));
    };

    util.inherits(FilelistPlugin, Plugin);

    (function() {

        this.getList = function(req, res, next) {
            var uid = req.session.uid || req.session.anonid;
            if (!uid)
                return next(new error.Unauthorized());

            // does this user have read-permissions...
            Permissions.getPermissions(uid, this.ws, "fs_filelist", function(err, perms) {
                if (err)
                    return next(err);

                if (perms.fs.indexOf("r") === -1)
                    return next(new error.Forbidden("You are not allowed to view this resource"));

                // and kick off the download action!
                var headersSent = false;
                var query = Url.parse(req.url, true).query;
                query.showHiddenFiles = !!parseInt(query.showHiddenFiles, 10);

                Filelist.exec(query, Vfs,
                    // incoming data
                    function(msg) {
                        if (!msg)
                            return;

                        if (!headersSent) {
                            res.writeHead(200, { "content-type": "text/plain" });
                            headersSent = true;
                        }
                        res.write(msg);
                    },
                    // process exit
                    function(code, stderr) {
                        if (code === 0)
                            res.end();
                        else
                            next("Process terminated with code " + code + ", " + stderr);
                    }
                );
            });
        };

    }).call(FilelistPlugin.prototype);

    imports.ide.register(name, FilelistPlugin, register);
};
