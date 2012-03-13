var assert = require("assert");
var path = require("path");
var utils = require("connect").utils;

var jsDAV = require("jsdav");
var DavPermission = require("./dav/permission");
var gnutools = require("gnu-tools");

module.exports = function setup(options, imports, register) {

    assert(options.urlPrefix);

    var permissions = imports["workspace-permissions"];
    var mountDir = path.normalize(imports.sandbox.getProjectDir());

    var davOptions = {
        node: mountDir,
        path: mountDir,
        mount: options.urlPrefix,
        plugins: options.davPlugins,
        server: {},
        standalone: false
    };

    var davServer = jsDAV.mount(davOptions);
    davServer.plugins["codesearch"].GREP_CMD = gnutools.GREP_CMD;
    davServer.plugins["filesearch"].FIND_CMD = gnutools.FIND_CMD;
    davServer.plugins["filelist"].FIND_CMD = gnutools.FIND_CMD;
    davServer.plugins["permission"] = DavPermission;

    imports.connect.useAuth(function(req, res, next) {
        if (req.url.indexOf(options.urlPrefix) !== 0)
            return next();

        var pause = utils.pause(req);
        permissions.getPermissions(req, function(err, permissions) {
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
        "fs": {},
        "codesearch": {},
        "filesearch": {}
    });
};