var passport = require("passport");
var basicStrategy = require("passport-http").BasicStrategy;
var assert = require("assert");

module.exports = function (options, imports, register) {
    assert(options.username, "Option 'username' is required");
    assert(options.password, "Option 'password' is required");

    passport.use(new basicStrategy({realm: "Are thou friend or foe?"}, function(username, password, done) {
        if(username == options.username && password == options.password)
            return done(null, username);
        return done(null, false);
    }));

    var connect = imports.connect;

    connect.useSetup(passport.initialize());
    connect.useSetup(passport.authenticate('basic', { session: false }), function(req, res) {});

    console.log("Using basic authentication");

    register();
};
