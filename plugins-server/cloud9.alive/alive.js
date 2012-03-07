
module.exports = function setup(options, imports, register) {

    var connect = imports.connect;

    connect.addRoute("get", "^/alive$", function(req, res) {

        // TODO: Perform internal check to verify that process is still operating properly.

        res.end("OK");
    });
    
    register(null, {});
};
