var assert = require("assert");
var fs = require("fs");
var exists = fs.existsSync;

module.exports = function startup(options, imports, register) {

    assert(options.sessionsPath, "option 'sessionsPath' is required");

    if (!exists(options.sessionsPath)) {
        fs.mkdirSync(options.sessionsPath, 0755);
    }
 
    var session = require('express-session');
    var FileStore = require('session-file-store')(session);

    var sessionStore = new FileStore({
        path: options.sessionsPath,
        ttl: options.maxAge
    });

    register(null, {
        "session-store": {
            on: sessionStore.on.bind(sessionStore),
            get: sessionStore.get.bind(sessionStore),
            set: sessionStore.set.bind(sessionStore),
            destroy: sessionStore.destroy.bind(sessionStore),
            createSession: sessionStore.createSession.bind(sessionStore)
        }
    });

};
