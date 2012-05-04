var MemoryStore = require("connect").session.MemoryStore;

module.exports = function startup(options, imports, register) {

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