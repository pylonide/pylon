/**
 * tty.js
 * Copyright (c) 2012-2013, Christopher Jeffrey (MIT License)
 */

/**
 * Modules
 */

var path = require('path')
  , fs = require('fs')
  , Stream = require('stream').Stream
  , EventEmitter = require('events').EventEmitter;

var io = require('engine.io')
  , pty = require('pty.js')
  , term = require('term.js');

var logger = require('./logger');

/**
 * Server
 */

function Server(conf) {
  if (!(this instanceof Server)) {
    return new Server(conf);
  }

  var self = this;

  this.sessions = {};
  this.conf = conf;
  this.server = conf.server;
  this.io = io.attach(this.server, conf.io || { log: false });
  this.init();
}

Server.prototype.init = function() {
  this.init = function() {};
  if (this.conf.localOnly) this.initLocal();
  else this.initIO();
};

Server.prototype.initLocal = function() {
  var self = this;
  var io = this.io;

  this.warning('Only accepting local connections.'),
  io.on('connection', function(socket) {
    var address = socket.request.connection.remoteAddress;
    if (address !== '127.0.0.1' && address !== '::1') {
      self.log('Attempted connection from %s. Refused.', address);
    }
    else return self.handleConnection(socket);
  });
};

Server.prototype.initIO = function() {
  var self = this
    , io = this.io

  io.on('connection', function(socket) {
    return self.handleConnection(socket);
  });
};

Server.prototype.handleConnection = function(socket) {
  var session = new Session(this, socket);

  // XXX Possibly wrap socket events from inside Session
  // constructor, and do: session.on('create')
  // or session.on('create term').
  socket.on('message', function(data) {
    data = JSON.parse(data);
    if (data.cmd == 'data') {
      return session.handleData(data.id, data.payload);
    }
    if(data.cmd == 'create') {
      return session.handleCreate(data.cols, data.rows);
    }
    if (data.cmd == 'kill') {
      return session.handleKill(data.id);
    }
    if (data.cmd == 'move') {
      return session.handleMove(data.id, data.left, data.top);
    }
    if (data.cmd == 'resize') {
      return session.handleResize(data.id, data.cols, data.rows);
    }
    if (data.cmd == 'process') {
      return session.handleProcess(data.id);
    }
    if (data.cmd == 'request paste') {
      return session.handlePaste();
    }
    
    return console.log("Unknown message received: %s", JSON.stringify(data));
    
  });
  socket.on('close', function() {
    return session.handleDisconnect();
  });
};

Server.prototype.log = function() {
  return this._log('log', slice.call(arguments));
};

Server.prototype.error = function() {
  return this._log('error', slice.call(arguments));
};

Server.prototype.warning = function() {
  return this._log('warning', slice.call(arguments));
};

Server.prototype._log = function(level, args) {
  if (this.conf.log === false) return;
  args.unshift(level);
  return logger.apply(null, args);
};

/**
 * Session
 */

function Session(server, socket) {
  this.server = server;
  this.socket = socket;
  this.terms = {};
  this.req = socket.request;

  var conf = this.server.conf
    , terms = this.terms
    , sessions = this.server.sessions
    , req = socket.request;

  this.id = this.uid();

  // Kill/sync older session.
  if (conf.syncSession) {
    var stale = sessions[this.id];
    if (stale) {
      // Possibly do something like this instead:
      // if (!stale.socket.disconnected)
      //   return this.id += '~', sessions[this.id] = this;
      stale.disconnect();
      stale.socket = socket;
      stale.sync();
      stale.log('Session \x1b[1m%s\x1b[m resumed.', stale.id);
      return stale;
    }
  }

  sessions[this.id] = this;

  this.log('Session \x1b[1m%s\x1b[m created.', this.id);
}

Session.uid = 0;
Session.prototype.uid = function() {
  if (this.server.conf.syncSession) {
    var req = this.req;
    return req.connection.remoteAddress
      + '|' + req.headers['user-agent'];
  }
  return Session.uid++ + '';
};

Session.prototype.disconnect = function() {
  try {
    this.socket._events = {};
    this.socket.$emit = function() {};
    this.socket.disconnect();
  } catch (e) {
    ;
  }
  this.clearTimeout();
};

Session.prototype.log = function() {
  return this._log('log', slice.call(arguments));
};

Session.prototype.error = function() {
  return this._log('error', slice.call(arguments));
};

Session.prototype.warning = function() {
  return this._log('warning', slice.call(arguments));
};

Session.prototype._log = function(level, args) {
  if (typeof args[0] !== 'string') args.unshift('');
  var id = this.id.split('|')[0];
  args[0] = '\x1b[1m' + id + '\x1b[m ' + args[0];
  return this.server._log(level, args);
};

Session.prototype.sync = function() {
  var self = this
    , terms = {}
    , queue = [];

  Object.keys(this.terms).forEach(function(key) {
    var term = self.terms[key];
    terms[key] = {
      id: term.pty,
      pty: term.pty,
      cols: term.cols,
      rows: term.rows,
      left: term.left,
      top: term.top,
      process: sanitize(term.process)
    };
  });

  Object.keys(self.terms).forEach(function(key) {
    var term = self.terms[key]
      , cols = term.cols
      , rows = term.rows;

    // A tricky way to get processes to redraw.
    // Some programs won't redraw unless the
    // terminal has actually been resized.
    term.resize(cols + 1, rows + 1);
    queue.push(function() {
      term.resize(cols, rows);
    });

    // Send SIGWINCH to our processes, and hopefully
    // they will redraw for our resumed session.
    // self.terms[key].kill('SIGWINCH');
  });

  setTimeout(function() {
    queue.forEach(function(item) {
      item();
    });
  }, 30);

  if(!isEmpty(terms)) this.socket.send(JSON.stringify({cmd: 'sync', terms: terms}));
};

Session.prototype.handleCreate = function(cols, rows) {
  var self = this
    , terms = this.terms
    , conf = this.server.conf;

  var len = Object.keys(terms).length
    , term
    , id;

  if (len >= conf.limitPerUser || pty.total >= conf.limitGlobal) {
    this.warning('Terminal limit reached.');
    self.socket.send(JSON.stringify({cmd: 'createACK', error: 'Terminal limit.' }));
  }

  var shell = typeof conf.shell === 'function'
    ? conf.shell(this)
    : conf.shell;

  var shellArgs = typeof conf.shellArgs === 'function'
    ? conf.shellArgs(this)
    : conf.shellArgs;

  term = pty.fork(shell, shellArgs, {
    name: conf.termName,
    cols: cols,
    rows: rows,
    cwd: conf.cwd || process.env.HOME
  });

  id = term.pty;
  terms[id] = term;
  terms[id].left = '';
  terms[id].top = '';

  term.on('data', function(data) {
    //console.log('<- ID: %s | Payload: %s | Socket: %s', id, data, self.socket.readyState);
    self.socket.send(JSON.stringify({cmd: 'data', id: id, payload: data}));
  });

  term.on('close', function() {
    // Make sure it closes
    // on the clientside.
    self.socket.send(JSON.stringify({cmd: 'killACK', id: id}));

    // Ensure removal.
    if (terms[id]) delete terms[id];

    self.log(
      'Closed pty (%s): %d.',
      term.pty, term.fd);
  });

  this.log(
    'Created pty (id: %s, master: %d, pid: %d).',
    id, term.fd, term.pid);

  self.socket.send(JSON.stringify({cmd: 'createACK', id: id, pty: term.pty, process: sanitize(conf.shell)}));
};

Session.prototype.handleData = function(id, data) {
  //console.log('-> ID: %s | Payload: %s', id, data);
  var terms = this.terms;
  if (!terms[id]) {
    this.warning(''
      + 'Client attempting to'
      + ' write to a non-existent terminal.'
      + ' (id: %s)', id);
    return;
  }
  terms[id].write(data);
};

Session.prototype.handleKill = function(id) {
  var terms = this.terms;
  if (!terms[id]) return;
  terms[id].destroy();
  delete terms[id];
};

Session.prototype.handleMove = function(id, left, top) {
  var terms = this.terms;
  if (!terms[id]) return;
  terms[id].left = left;
  terms[id].top = top;
}

Session.prototype.handleResize = function(id, cols, rows) {
  var terms = this.terms;
  if (!terms[id]) return;
  terms[id].resize(cols, rows);
};

Session.prototype.handleProcess = function(id) {
  var socket = this.socket;
  var terms = this.terms;
  if (!terms[id]) return;
  var name = terms[id].process;
  socket.send(JSON.stringify({cmd: 'processACK', id: id, name: sanitize(name)}));
};

Session.prototype.handleDisconnect = function() {
  var self = this
    , terms = this.terms
    , sessions = this.server.sessions
    , conf = this.server.conf;

  // XXX Possibly create a second/different
  // destroy function to accompany the one
  // above?
  function destroy() {
    var key = Object.keys(terms)
      , i = key.length
      , term;

    while (i--) {
      term = terms[key[i]];
      delete terms[key[i]];
      term.destroy();
    }

    if (sessions[self.id]) {
      delete sessions[self.id];
    }

    self.log('Killing all pty\'s.');
  }

  this.log('Client disconnected.');

  if (!conf.syncSession) {
    return destroy();
  }

  if (conf.sessionTimeout <= 0 || conf.sessionTimeout === Infinity) {
    return this.log('Preserving session forever.');
  }

  // XXX This could be done differently.
  this.setTimeout(conf.sessionTimeout * 1000, destroy);
  this.log(
    'Preserving session for %d minutes.',
    conf.sessionTimeout / 60 | 0);
};

Session.prototype.handlePaste = function() {
  var socket = this.socket;
  var execFile = require('child_process').execFile;

  function exec(args) {
    var file = args.shift();
    return execFile(file, args, function(err, stdout, stderr) {
      if (err) return socket.send(JSON.stringify({cmd: 'pasteACK', error: err}));
      if (stderr && !stdout) return socket.send(JSON.stringify({cmd: 'pasteACK', error: new Error(stderr)}));
      socket.send(JSON.stringify({cmd: 'pasteACK', stdout: stdout}));
    });
  }

  // X11:
  return exec(['xsel', '-o', '-p'], function(err, text) {
    if (!err) return func(null, text);
    return exec(['xclip', '-o', '-selection', 'primary'], function(err, text) {
      if (!err) return func(null, text);
      // Mac:
      return exec(['pbpaste'], function(err, text) {
        if (!err) return func(null, text);
        // Windows:
        // return exec(['sfk', 'fromclip'], function(err, text) {
        return func(new Error('Failed to get clipboard contents.'));
      });
    });
  });
};

Session.prototype.setTimeout = function(time, func) {
  this.clearTimeout();
  this.timeout = setTimeout(func.bind(this), time);
};

Session.prototype.clearTimeout = function() {
  if (!this.timeout) return;
  clearTimeout(this.timeout);
  delete this.timeout;
};

// Server Methods
Object.keys(EventEmitter.prototype).forEach(function(key) {
  if (Server.prototype[key]) return;
  Server.prototype[key] = function() {
    return this.server[key].apply(this.server, arguments);
  };
});

/**
 * Helpers
 */

var slice = Array.prototype.slice;

function sanitize(file) {
  if (!file) return '';
  file = file.split(' ')[0] || '';
  return path.basename(file) || '';
}

function applyConfig() {
  var hasOwnProperty = Object.prototype.hasOwnProperty;

  for (var key in Terminal._opts) {
    if (!hasOwnProperty.call(Terminal._opts, key)) continue;
    if (typeof Terminal._opts[key] === 'object' && Terminal._opts[key]) {
      if (!Terminal[key]) {
        Terminal[key] = Terminal._opts[key];
        continue;
      }
      for (var k in Terminal._opts[key]) {
        if (hasOwnProperty.call(Terminal._opts[key], k)) {
          Terminal[key][k] = Terminal._opts[key][k];
        }
      }
    } else {
      Terminal[key] = Terminal._opts[key];
    }
  }

  delete Terminal._opts;
}

/**
 * Utility
 */

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

/**
 * Expose
 */

exports = Server;
exports.Server = Server;
exports.Session = Session;
exports.logger = logger;
exports.createServer = Server;

module.exports = exports;
