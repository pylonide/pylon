var session = require("express-session");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var assert = require("assert");
var fs = require("fs");
var template = require("simple-template");
var bodyParser = require("body-parser");

var LOGIN_TMPL = fs.readFileSync(__dirname + "/login.tmpl.html", "utf8");

var motm = ['Searching for an answer, Trying to find the way',
            'Straining my brain til it hurts, almost every day.',
            'I cannot wait, Til summer’s begun',
            'Trying to think, Is not very fun.',
            'Do you have a kiss or a bar? Even the tiniest piece?',
            'I am craving it so much, It will taste like a feast.',
            'Please tell me you have some, If I need to I\'ll walk it',
            'I will beg, borrow or steal, for a bit of chocolate.',
            'Brown grass crunches beneath the feet, and pavement burns to the touch.',
            'The sun is especially hot today, Take care not to get too much.',
            'The river is so far from here, And there is no good path.',
            'So I guess I’ll go and get cool, in a refreshing bath.',
            'Hunger, temptation longing, laughter, joy and tears.',
            'Anger, loving, curiosity, hopeful, happiness and fears.',
            'All these are inside me, And they all are coming out.',
            'Don’t know if I’m coming or going, Or to scream or shout!',
            'Heart is pounding, pulse is quickening, Two bodies come together.',
            'Both people shaking like a leaf, despite the steamy weather.',
            'This time is absolutely tarrying, Don’t think I am a miss.',
            'Because nothing is more scary, than a very first kiss.'];

module.exports = function (options, imports, register) {
    assert(options.username, "Option 'username' is required");
    assert(options.password, "Option 'password' is required");

    passport.use(new LocalStrategy(function(username, password, done) {
      if(username == options.username && password == options.password)
        return done(null, username);
      return done(null, false, {message: "Unsuccessful login!"});
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
            
            

        var login = template.fill(LOGIN_TMPL, { staticUrl: "/static",
                                                messageState: "off",
                                                motm: motm[Math.floor(Math.random() * Math.floor(motm.length - 1))] });
        res.end(login);
      });

      app.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' }), function(req, res) {});
      
      app.get(/^\/logout$/, function(req, res) {
        req.logout();
        res.redirect('/');
      });
      
    }));

    console.log("Using Forms Authentication with local strategy");

    register();
};
