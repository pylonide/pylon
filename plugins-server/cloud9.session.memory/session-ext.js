var Connect = require("connect");

module.exports = function startup(options, imports, register) {

    var connect = imports.connect;

    var sessionStore = new Connect.session.MemoryStore({ reapInterval: -1 });
    connect.use(Connect.session({
        store: sessionStore,
        key: "cloud9.sid",
        secret: "1234"
    }));

    register(null, {
        session: {
            get: sessionStore.get.bind(sessionStore)
        }
    });
};