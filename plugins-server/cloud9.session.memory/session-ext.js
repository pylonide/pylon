var Session = require("connect").session;
var MemoryStore = Session.MemoryStore;
var assert = require("assert");

module.exports = function startup(options, imports, register) {

    assert(options.key, "option 'key' is required");
    assert(options.secret, "option 'secret' is required");

    var connect = imports.connect;

    var sessionStore = new MemoryStore({ reapInterval: -1 });
    connect.useSession(Session({
        store: sessionStore,
        key: options.key,
        secret: options.secret
    }));

    register(null, {
        session: {
            get: sessionStore.get.bind(sessionStore)
        }
    });
};