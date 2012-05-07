var assert = require("assert");
var path = require("path");
var utils = require("connect").utils;
var error = require("http-error");

var jsDAV = require("jsDAV");
var jsDAV_Tree_Filesystem = require("./fs/tree").jsDAV_Tree_Filesystem;
var DavFilewatch = require("./dav/filewatch");

module.exports = function setup(options, imports, register) {

    assert(options.urlPrefix);

    var permissions = imports["workspace-permissions"];

    imports.sandbox.getProjectDir(function(err, projectDir) {
        if (err) return register(err);

        imports.sandbox.getWorkspaceId(function(err, workspaceId) {
            if (err) return register(err);

            init(projectDir, workspaceId);
        });
    });

    function init(projectDir, workspaceId) {

        var mountDir = path.normalize(projectDir);

        var davOptions = {
            path: mountDir,
            mount: options.urlPrefix,
            plugins: options.davPlugins,
            server: {},
            standalone: false
        };

        davOptions.tree = new jsDAV_Tree_Filesystem(imports.vfs, mountDir);

        var filewatch = new DavFilewatch();

        var davServer = jsDAV.mount(davOptions);
        davServer.plugins["filewatch"] = filewatch.getPlugin();

        imports.connect.useAuth(function(req, res, next) {
            if (req.url.indexOf(options.urlPrefix) !== 0)
                return next();

            if (!req.session || !req.session.uid)
                return next(new error.Unauthorized());

            var pause = utils.pause(req);
            permissions.getPermissions(req.session.uid, workspaceId, function(err, permissions) {
                if (err) {
                    next(err);
                    pause.resume();
                    return;
                }

                davServer.permissions = permissions.fs;
                davServer.exec(req, res);
                pause.resume();
            });
        });

        register(null, {
            "onDestruct": function(callback) {
                davServer.unmount();
                callback();
            },
            "dav": {
                getServer: function() {
                    return davServer;
                }
            },
            "fs": {
                addListener: filewatch.on.bind(filewatch)
            },
            "codesearch": {},
            "filesearch": {}
        });
    }
};