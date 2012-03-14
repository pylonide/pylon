var assert = require("assert");
var path = require("path");
var fs = require("fs");
var Store = require("connect/lib/middleware/session/store");

module.exports = function startup(options, imports, register) {

    assert(options.sessionsPath, "option 'sessionsPath' is required");
    
    if (!path.existsSync(path.dirname(options.sessionsPath))) {
        fs.mkdir(path.dirname(options.sessionsPath), 0755);
    }
    if (!path.existsSync(options.sessionsPath)) {
        fs.mkdir(options.sessionsPath, 0755);
    }

    var connect = imports.connect;
    var Session = connect.getModule().session;


    var sessionStore = new FileStore({
        basePath: options.sessionsPath,
        // TODO: Implement session cleanup.
        reapInterval: -1
    });
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



var FileStore = function(options) {
  this.basePath = options.basePath;
  this.reapInterval = options.reapInterval || -1;
};
FileStore.prototype.__proto__ = Store.prototype;
FileStore.prototype.get = function(sid, fn){
  var self = this;
  path.exists(self.basePath + "/" + sid, function(exists) {
      if (exists) {
          fs.readFile(self.basePath + "/" + sid, function(err, data) {
              if (err) {
                  fn && fn(err);
              }
              else {
                  var sess = JSON.parse(data);
                  var expires = (typeof sess.cookie.expires === 'string')
                      ? new Date(sess.cookie.expires)
                      : sess.cookie.expires;
                  if (!expires || new Date < expires) {
                      fn(null, sess);
                  } else {
                      self.destroy(sid, fn);
                  }                      
              }
          });
      }
      else {
          fn();
      }
  });      
};
FileStore.prototype.set = function(sid, sess, fn){
  var self = this;
  fs.writeFile(self.basePath + "/" + sid, JSON.stringify(sess), function(err) {
      if (err) {
          fn && fn(err);
      }
      else {
          fn && fn();
      }
  });
};
FileStore.prototype.destroy = function(sid, fn){
  var self = this;
  path.exists(self.basePath + "/" + sid, function(exists) {
      if (exists) {
          fs.unlink(self.basePath + "/" + sid, function(err) {
              if (err) {
                  fn && fn(err);
              }
              else {
                  fn && fn();
              }
          });              
      } else {
          fn && fn();
      }
  });
};
FileStore.prototype.all = function(fn){
    throw new Error("NYI");
/*        
  var arr = []
    , keys = Object.keys(this.sessions);
  for (var i = 0, len = keys.length; i < len; ++i) {
    arr.push(this.sessions[keys[i]]);
  }
  fn(null, arr);
*/
};
FileStore.prototype.clear = function(fn){
    throw new Error("NYI");
/*
  this.sessions = {};
  fn && fn();
*/
};
FileStore.prototype.length = function(fn){
    throw new Error("NYI");
/*
  fn(null, Object.keys(this.sessions).length);
*/
};

