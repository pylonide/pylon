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
var Connect = require("connect");
var error = require("http-error");

var name = "filelist";

var ProcessManager, EventBus, IdeRoutes, Permissions, Filelist;

module.exports = function setup(options, imports, register) {
    Filelist = new FilelistLib();
    Filelist.setEnv({
        findCmd: options.findCmd,
        platform: options.platform
    });

    ProcessManager = imports["process-manager"];
    EventBus = imports.eventbus;
    IdeRoutes = imports["ide-routes"];
    Permissions = imports["workspace-permissions"];
    imports.ide.register(name, FilelistPlugin, register);
};

var FilelistPlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);
    this.name = name;
    this.processCount = 0;
    this.ws = ide.workspaceId;

    Filelist.setEnv({
        workspaceId: this.ws,
        basePath: ide.workspaceDir
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

        // does this user has read-permissions...
        Permissions.getPermissions(uid, this.ws, "fs_filelist", function(err, perms) {
            if (err)
                return next(err);

            if (perms.fs.indexOf("r") === -1)
                return next(new error.Forbidden("You are not allowed to view this resource"));

            // and kick off the download action!
            var headersSent = false;
            var query = Url.parse(req.url, true).query;
            query.showHiddenFiles = !!parseInt(query.showHiddenFiles, 10);

            Filelist.exec(query, ProcessManager, EventBus,
                // start
                function() {
                    // skip it!
                },
                // incoming data
                function(msg) {
                    if (msg.stream != "stderr") {
                        if (!headersSent) {
                            res.writeHead(200, { "content-type": "text/plain" });
                            headersSent = true;
                        }
                        res.write(msg.data);
                    }
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
