var assert = require("assert");

module.exports = function (options, imports, register) {
    assert(options.username, "Option 'username' is required");
    assert(options.password, "Option 'password' is required");

    var connect = imports.connect;
    connect.useSetup(connect.getModule().basicAuth(options.username, options.password));

    console.log("Using basic authentication");

    register();
};