var assert = require("assert");
var path = require("path");
var utils = require("connect").utils;
var error = require("http-error");

var jsDAV = require("jsDAV");
var DavPermission = require("./dav/permission");
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
            node: mountDir,
            path: mountDir,
            mount: options.urlPrefix,
            plugins: options.davPlugins,
            server: {},
            standalone: false
        };

        var filewatch = new DavFilewatch();

        var davServer = jsDAV.mount(davOptions);
        davServer.plugins["permission"] = DavPermission;
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
                on: filewatch.on.bind(filewatch),
                addListener: filewatch.on.bind(filewatch),
                removeListener: filewatch.removeListener.bind(filewatch)
            },
            "codesearch": {},
            "filesearch": {}
        });
    }
};