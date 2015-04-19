var Session = require("express-session");
var assert = require("assert");

module.exports = function startup(options, imports, register) {

    assert(options.name, "option 'name' is required");
    assert(options.secret, "option 'secret' is required");
    assert(options.saveUninitialized, "option 'saveUninitialized' is required");

    var connect = imports.connect;
    var sessionStore = imports["session-store"];

    connect.useSession(Session({
        store: sessionStore,
        name: options.key,
        secret: options.secret,
        saveUninitialized: options.saveUninitialized,
        resave: false
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
