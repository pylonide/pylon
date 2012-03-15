var connect = require("connect");

module.exports = function setup(options, imports, register) {

    imports.connect.useStart(connect.router(function(app) {
        app.get(/^\/alive$/, function(req, res) {

            // TODO: Perform internal check to verify that process is still operating properly.

            res.end("OK");
        });
    }));

    register(null, {});
};
