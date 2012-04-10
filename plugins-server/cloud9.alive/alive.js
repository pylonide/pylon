
module.exports = function setup(options, imports, register) {

    imports.connect.useStart(imports.connect.getModule().router(function(app) {
        app.get(/^\/alive$/, function(req, res) {
            checkAlive(req, res);
        });
        app.post(/^\/alive$/, function(req, res) {
            checkAlive(req, res);
        });
    }));

    register(null, {});
};


function checkAlive(req, res) {

    // TODO: Perform internal check to verify that process is still operating properly.

    res.end("OK");
}
