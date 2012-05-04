var Session = require("connect").session;
var assert = require("assert");

module.exports = function startup(options, imports, register) {

    assert(options.key, "option 'key' is required");
    assert(options.secret, "option 'secret' is required");

    var connect = imports.connect;
    var sessionStore = imports["session-store"];

    connect.useSession(Session({
        store: sessionStore,
        key: options.key,
        secret: options.secret
    }));

    register(null, {
        session: {
            getKey: function() {
                return options.key;
            },
            get: sessionStore.get
        }
    });
};