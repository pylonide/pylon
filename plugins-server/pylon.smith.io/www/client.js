
define(function(require, exports, module) {

	var ENGINE_IO = require("engine.io");
	var SMITH = require("smith");
	var EVENTS = require("smith/events-amd");

	var transports = [];
	var debugHandler = null;
	var connectCounter = 0;

	function inherits(Child, Parent) {
	    Child.prototype = Object.create(Parent.prototype, { constructor: { value: Child }});
	}

	function getLogTimestamp() {
		var date = new Date();
		return "[" + date.toLocaleTimeString() + ":" + date.getMilliseconds() + "]";
	}

	var Transport = function(options) {
		this.options = options;
		this.options.host = this.options.host || document.location.hostname;
		if (this.options.port === 443) {
			this.options.secure = true;
		}
		this.options.port = this.options.port || document.location.port;
		this.options.path = this.options.prefix;
		delete this.options.prefix;
		this.id = false;
		this.serverId = false;
		this.connecting = false;
		this.connected = false;
		this.away = false;
		this.buffer = false;
		this.connectIndex = -1;
	}

	inherits(Transport, EVENTS.EventEmitter);

	Transport.prototype.getUri = function() {
		return "http" + ((this.options.secure)?"s":"") + "://" +
			   this.options.host +
			   ((this.options.port)?":"+this.options.port:"") +
			   this.options.path +
			   this.options.resource;
	}

	Transport.prototype.connect = function(options, callback) {
		var _self = this;
		connectCounter += 1;
		_self.connectIndex = connectCounter;

		var failed = false;

		function log(message) {
			console.log(getLogTimestamp() + "[smith.io:" + _self.connectIndex + ":" + _self.getUri() + "] " + message);
		}

		try {

			if (!_self.away && _self.connected) {
				throw new Error("smith.io '" + _self.getUri() + "' is already connected!");
			}
			if (_self.connecting) {
				throw new Error("smith.io '" + _self.getUri() + "' is already connecting!");
			}

			if (_self.debug) {
				log("Try connect", options);
			}

			_self.connecting = true;

			function reconnect() {
				if (_self.debug) {
					log("Trigger re-connect scheduler.");
				}

				if (typeof options.reconnectAttempt === "undefined") {
					options.reconnectAttempt = 0;
				}

				options.reconnectAttempt += 1;

				if (options.reconnectAttempt === 1) {
					_self.away = false;
		            _self.connected = false;
		            try {
						_self.emit("disconnect", "away re-connect attempts exceeded");
					} catch(err) {
						console.error(err.stack);
					}
				}

				var delay = 250;
				if (options.reconnectAttempt > 10) {
					delay = 15 * 1000;
				}
				else if (options.reconnectAttempt > 5) {
					delay = 5 * 1000;
				}
				else if (options.reconnectAttempt > 3) {
					delay = 1 * 1000;
				}

				if (_self.debug) {
					log("Schedule re-connect in: " + delay);
				}

				setTimeout(function() {

					if (!_self.away && _self.connected) {
						if (_self.debug) {
							log("Don't re-connect. Already connected!");
						}
						return;
					}
					if (_self.connecting) {
						if (_self.debug) {
							log("Don't re-connect. Already connecting!");
						}
						return;
					}

					try {
						_self.emit("reconnect", options.reconnectAttempt);
					} catch(err) {
						console.error(err.stack);
					}

					_self.connect({
						reconnectAttempt: options.reconnectAttempt,
						fireConnect: (options.reconnectAttempt >= 1) ? true : false
					}, function(err) {
						if (err) {
							reconnect();
							return;
						}
					});
				}, delay);
			}

			_self.socket = new ENGINE_IO.Socket(_self.options);

			_self.socket.on("error", function (err) {
				if (_self.debug) {
					log("Connect error (failed: " + failed + "): " + err.stack);
				}
				// Only relay first connection error.
				if (!failed) {
					failed = true;

					_self.connecting = false;
					try {
						callback(err);
					} catch(err) {
						console.error(err.stack);
					}

					if (_self.debug) {
						log("Close failed socket (" + _self.socket.readyState + ") on error");
					}
					if (_self.socket.readyState !== "closed") {
						try {
							_self.socket.close();
						} catch(err) {}
					}
				}
			});

			_self.socket.on("pong", function (pongPayload) {
				if (failed) {
					if (_self.debug) {
						log("Close failed socket (" + _self.socket.readyState + ") on heartbeat");
					}
					if (_self.socket.readyState !== "closed") {
						try {
							_self.socket.close();
						} catch(err) {}
					}
					return;
				} else
				if (pongPayload && pongPayload.serverId && pongPayload.serverId !== _self.serverId) {
            		// If `pongPayload.serverId` does not match our cached `_self.serverId` we close
            		// the connection and re-connect as the server instance has changed and we may need to re-init.
					if (_self.debug) {
						log("Detected server reboot on heartbeat. Close connection.");
					}
					if (_self.socket.readyState !== "closed") {
						try {
							_self.socket.close();
						} catch(err) {}
					}
					return;
				}
				_self.emit("heartbeat");
			});

			_self.socket.on("heartbeat", function () {
				if (failed) {
					if (_self.debug) {
						log("Close failed socket (" + _self.socket.readyState + ") on heartbeat");
					}
					if (_self.socket.readyState !== "closed") {
						try {
							_self.socket.close();
						} catch(err) {}
					}
					return;
				}
			});

			_self.socket.on("open", function () {

				_self.connecting = false;

				if (failed) {
					if (_self.debug) {
						log("Close failed socket (" + _self.socket.readyState + ") on open");
					}
					if (_self.socket.readyState !== "closed") {
						try {
							_self.socket.close();
						} catch(err) {}
					}
					return;
				}

				if (_self.debug) {
					log("Init new socket (" + _self.socket.id + ")");
				}

				_self.transport = new SMITH.EngineIoTransport(_self.socket);

				_self.transport.on("legacy", function (message) {
		            if (typeof message === "object" && message.type === "__ASSIGN-ID__") {

		            	if (_self.serverId !== false && _self.serverId !== message.serverId) {
		            		// If `message.serverId` does not match our cached `_self.serverId` we issue
		            		// a connect as the server instance has changed and we may need to re-init.
							if (_self.debug) {
								log("Detected server reboot on handshake. Issue re-connect.");
							}
							options.fireConnect = true;
							if (_self.connected === true) {
								_self.connected = false;
								try {
									_self.emit("disconnect", "server reboot");
								} catch(err) {
									console.error(err.stack);
								}
							}
		            	}
	            		_self.serverId = message.serverId;

		            	if (_self.id === false) {
			            	_self.id = message.id;
			            }
			            _self.transport.send({
			            	type: "__ANNOUNCE-ID__",
			            	id: _self.id
			            });
			            if (_self.away && (Date.now()-_self.away) > 30*1000)  {
							if (_self.debug) {
								log("Long away (hibernate) detected. Issue re-connect.");
							}
							options.fireConnect = true;
							if (_self.connected === true) {
								_self.connected = false;
								try {
									_self.emit("disconnect", "long away (hibernate)");
								} catch(err) {
									console.error(err.stack);
								}
							}
			            }
			            _self.away = false;
			            _self.connected = true;
			            if (options.fireConnect !== false) {
			            	try {
								_self.emit("connect", _self);
							} catch(err) {
								console.error(err.stack);
							}
						}
						else if (options.reconnectAttempt > 0) {
							try {
								_self.emit("back");
							} catch(err) {
								console.error(err.stack);
							}
						}
						options.reconnectAttempt = 0;
						if (_self.buffer) {
							_self.buffer.forEach(function(message) {
								_self.transport.send(message);
							});
							_self.buffer = false;
						}
		            } else {
		            	try {
							_self.emit("message", message);
						} catch(err) {
							console.error(err.stack);
						}
		            }
				});

				_self.transport.on("disconnect", ondisconnect);
				_self.transport.on("error", ondisconnect);
				var once = false;
				function ondisconnect(reason) {
					// Ignore probe errors
					if (/probe error/i.test(reason)) return;

					// Only one try to reconnect
					if (once) return;
					once = true;

					if (_self.debug) {
						log("Disconnect socket: " + reason);
					}

					if (_self.connected) {
						_self.away = Date.now();
						try {
							_self.emit("away");
						} catch(err) {
							console.error(err.stack);
						}
					}

					reconnect();
				};
				callback(null, _self);
			});

		} catch(err) {
			callback(err);
		}
	}
	Transport.prototype.send = function(message) {
		if (this.connected === false) {
			var err = new Error("Cannot send smith.io message while disconnected! Sender should respect connect/disconnect states!");
			// We log error here in case sender does not catch.
			console.log(err.stack);
			throw err;
		}
		else if(this.away) {
			if (!this.buffer) {
				this.buffer = [];
			}
			this.buffer.push(message);
		}
		this.transport.send(message);
	}

	exports.connect = function(options, callback) {
		var transport = new Transport(options, callback);
		transports.push(transport);
		if (debugHandler) {
			debugHandler.hookTransport(transport);
		}
		if (transport.debug) {
			console.log(getLogTimestamp() + "[smith.io:" + transport.getUri() + "] New transport", options);
		}
		transport.connect({}, callback);
		return transport;
	}

	exports.setDebug = function(debug, events) {
		if (debugHandler !== null) {
			debugHandler.stop();
			if (window.localStorage) {
				localStorage.smithioDebug = "";
				localStorage.debug = "";
			}
		}
		if (!debug) return;
		events = events || [];
		if (window.localStorage) {
			localStorage.smithioDebug = JSON.stringify([debug, events]);
		}
		debugHandler = {
			transports: [],
			handlers: [],
			start: function() {
				transports.forEach(debugHandler.hookTransport);
			},
			stop: function() {
				transports.forEach(debugHandler.unhookTransport);
				debugHandler = null;
			},
			hookTransport: function(transport) {
				var index = debugHandler.transports.indexOf(transport);
				if (index !== -1) return;

				function log(message) {
					console.log(getLogTimestamp() + "[smith.io:" + transport.connectIndex + ":" + transport.getUri() + "] " + message);
				}

				log("Hook debugger");

				var listeners = {};

				transport.debug = true;

				transport.on("connect", listeners["connect"] = function() {
					log("Connect");
				});
				transport.on("reconnect", listeners["reconnect"] = function(attempt) {
					log("Reconnect: " + attempt);
				});
				transport.on("disconnect", listeners["disconnect"] = function(reason) {
					log("Disconnect: " + reason);
				});
				transport.on("heartbeat", listeners["heartbeat"] = function(message) {
					log("Heartbeat");
				});
				if (events.indexOf("message") !== -1) {
					transport.on("message", listeners["message"] = function(message) {
						log("Message", message);
					});
				}
				transport.on("away", listeners["away"] = function() {
					log("Away");
				});
				transport.on("back", listeners["back"] = function() {
					log("Back");
				});

				if (events.indexOf("engine.io") !== -1) {
					if (window.localStorage) {
						localStorage.debug = "*";
					}
				}

				debugHandler.transports.push(transport);
				debugHandler.handlers.push({
					unhook: function() {
						log("Unhook debugger");
						transport.debug = false;
						for (var type in listeners) {
							transport.removeListener(type, listeners[type]);
						}
					}
				});
			},
			unhookTransport: function(transport) {
				var index = debugHandler.transports.indexOf(transport);
				if (index === -1) return;
				debugHandler.transports.splice(index, 1);
				debugHandler.handlers[index].unhook();
				debugHandler.handlers.splice(index, 1);
			}
		};
		debugHandler.start();
	}

	if (window.localStorage && localStorage.smithioDebug) {
		exports.setDebug.apply(null, JSON.parse(localStorage.smithioDebug));
	}

});
