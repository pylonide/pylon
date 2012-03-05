var assert = require("assert");
var path = require("path");

var jsDAV = require("jsdav");
var DavPermission = require("./dav/permission");
var gnutools = require("gnu-tools");

var exports = module.exports = function setup(options, imports, register) {

    assert(options.urlPrefix);
    assert(options.mountDir);

    var permissions = imports["workspace-permissions"];
    var mountDir = path.normalize(options.mountDir);

    var davOptions = {
        node: mountDir,
        path: mountDir,
        mount: options.urlPrefix,
        plugins: options.davPlugins || exports.DEFAULT_DAVPLUGINS,
        server: {},
        standalone: false
    };

    var davServer = jsDAV.mount(davOptions);
    var inited = false;

    imports.connect.use(function(req, res, next) {
        if (req.url.indexOf(options.urlPrefix) !== 0)
            return next();

        if (!inited) {
            davServer.plugins["codesearch"].GREP_CMD = gnutools.GREP_CMD;
            davServer.plugins["filesearch"].FIND_CMD = gnutools.FIND_CMD;
            davServer.plugins["filelist"].FIND_CMD = gnutools.FIND_CMD;
            davServer.plugins["permission"] = DavPermission;
            inited = true;
        }

        permissions.getPermissions(req, function(err, permissions) {
            if (err)
                return next(err);

            davServer.permissions = permissions.fs;
            davServer.exec(req, res);
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