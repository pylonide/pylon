var assert = require("assert");

module.exports = function(options, imports, register) {

    assert(options.messageRegex, "option 'messageRegex' is required");

    var connectionHooks = {};
    imports["smith.io"].createServer(options.messageRegex, null, connectionHooks);
    register(null, {
        "smith.io.ide": {
            addConnectionHook: function (path, onConnect) {
                connectionHooks[path] = onConnect;
            }
        }
    });
};
