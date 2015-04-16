
module.exports = function setup(options, imports, register) {

    var alive = false;

    imports.hub.on("ready", function() {
        alive = true;
    });

    function checkAlive(req, res) {

        // TODO: Perform internal check to verify that process is still operating properly.

        if (alive) {
            res.end("OK");
        }
        else {
            res.writeHead(500);
            res.end("FAIL");
        }
    }

    imports.connect.useStart(imports.connect.getRouter()(function(app) {
        app.get(/^\/alive$/, function(req, res) {
            checkAlive(req, res);
        });
        app.post(/^\/alive$/, function(req, res) {
            checkAlive(req, res);
        });
    }));

    register(null, {});

};
