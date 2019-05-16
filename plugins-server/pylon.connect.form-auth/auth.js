var session = require("express-session");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var assert = require("assert");
var fs = require("fs");
var template = require("simple-template");
var bodyParser = require("body-parser");

var LOGIN_TMPL = fs.readFileSync(__dirname + "/login.tmpl.html", "utf8");

module.exports = function (options, imports, register) {
    assert(options.username, "Option 'username' is required");
    assert(options.password, "Option 'password' is required");

    passport.use(new LocalStrategy(function(username, password, done) {
      if(username == options.username && password == options.password)
        return done(null, username);
      return done(null, false);
    }));

    passport.serializeUser(function(user, done) {
      done(null, user);
    });
      
    passport.deserializeUser(function(user, done) {
      done(null, user);
    });

    var connect = imports.connect;

    connect.useSession(passport.initialize());
    connect.useSession(passport.session());
    connect.useSession(bodyParser.urlencoded({ extended: true }));
    connect.useSession(connect.redirect());
    
    connect.useSession(function (req, res, next) {
      if (req.user) {
        next();
      }
      else if (req.originalUrl === '/login') {
        next();
      }
      else { 
        res.redirect('/login');
      }
    });

    connect.useSession(connect.getRouter()(function(app) {
      app.get(/^\/login$/, function(req, res) {

            res.writeHead(200, {
                "cache-control": "no-transform",
                "Content-Type": "text/html"
            });

            var login = template.fill(LOGIN_TMPL, {});
            res.end(login);
        });

        app.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' }), function(req, res) {});
    }));

    console.log("Using Forms Authentication with local strategy");

    register();
};
