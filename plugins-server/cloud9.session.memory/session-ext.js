var assert = require("assert");

module.exports = function startup(options, imports, register) {

    assert(options.key, "option 'key' is required");
    assert(options.secret, "option 'secret' is required");

    var connect = imports.connect;
    var Session = connect.getModule().session;
    var MemoryStore = Session.MemoryStore;

    var sessionStore = new MemoryStore({ reapInterval: -1 });

    register(null, {
        "session-store": {
            get: sessionStore.get.bind(sessionStore),
            set: sessionStore.set.bind(sessionStore),
            destroy: sessionStore.destroy.bind(sessionStore),
            createSession: sessionStore.createSession.bind(sessionStore)
        }
    });
};