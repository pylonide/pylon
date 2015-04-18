
module.exports = function setup(options, imports, register) {

    imports.connect.useStart(imports.connect.getRouter()(function(app) {
        app.post(/^\/api\/debug$/, function(req, res) {
            imports.connect.getModule().bodyParser()(req, res, function() {

                imports.log.error("[CLIENT ERROR]", req.body);

                res.writeHead(200, {"Content-Type": "text/plain"});
                res.end("OK");
            });
        });
    }));

    register(null, {});
};
