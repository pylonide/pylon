/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

// #ifdef __TP_PERSIST

/**
 * Element implementing the persist messaging protocol.
 *
 * @event authfailure Fires when the authentication process failed or halted.
 *   bubbles: yes
 *   cancelable: Prevents an authentication failure to be thrown
 *   object:
 *     {String}        username   the username used for the login attempt
 *     {String}        server     the server address (URI) of the PERSIST server
 *     {String}        message    a more detailed explanation of the error
 * @event connectionerror Fires when the connection with the PERSIST server dropped.
 *   bubbles: yes
 *   cancelable: Prevents an connection error to be thrown
 *   object:
 *     {String}        username   the username used for the last-active session
 *     {String}        server     the server address (URI) of the PERSIST server
 *     {String}        message    a more detailed explanation of the error
 * @event connected Fires when a login attempt has succeeded, and a session has been setup.
 *   bubbles: yes
 *   object:
 *     {String}        username   the username used for the last-active session
 * @event receivechat Fires when the user received a chat message from a contact.
 *   bubbles: yes
 *   object:
 *     {String}        from       the username of the contact that sent the message
 *     {String}        message    the body of the chat message
 * @event datachange Fires when a data-change message is received from one of the contacts.
 *   bubbles: yes
 *   object:
 *     {String}        data       the data-instruction of the changed data that
 *                                the RDB implementation can grok
 *
 * @define persist
 * @addnode teleport
 * 
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       3.0
 * @constructor
 *
 * @inherits apf.Class
 * @inherits apf.BaseComm
 * @inherits apf.http
 * @namespace apf
 *
 * @default_private
 */

apf.persist = function(struct, tagName){
    this.$init(tagName || "persist", apf.NODE_HIDDEN, struct);
    
    var _self = this;
    apf.addEventListener("exit", function(e){
        if (_self.listening)
            _self.disconnect();
    });
};

(function() {
    this.retryinterval = 1000;
    
    this.PATHS = {
        login  : "/login",
        logout : "/logout",
        pipe   : "/pipe"
    };
    
    this.$supportedProperties.push("host", "retry", "retryinterval");

    /*this.$propHandlers["host"] = function(value) {
        
    };*/
    
    this.$handleError = function(data, state, extra, callback){
        var oError, amlNode = this;
        
        if (extra.http.readyState && (extra.status == 401 
         || extra.status == 403 
         || extra.status == 500)) {
            oError = new Error(apf.formatErrorString(10000, amlNode,
                "Persist protocol",
                extra.statusText + " in " + amlNode.name
                + "[" + amlNode.tagName + "] \nUrl: " + extra.url
                + "\nInfo: " + extra.message));
        }
        else {
            oError = new Error(apf.formatErrorString(10001, amlNode,
                "Polling in persist protocol",
                "Connection dissapeared " + amlNode.name
                + "[" + amlNode.tagName + "] \nUrl: " + extra.url
                + "\nInfo: " + extra.message));
        }
        
        if (typeof callback == "function") {
            return callback.call(amlNode, data, state, extra, oError);
        }
        else {
            var result = amlNode.retryTimeout(extra, state, amlNode, oError)
            //Retrying
            if (result === true)
                return true;
            
            //Canceled Error
            else if (result === 2) {
                this.dispatchEvent("disconnect");
                this.$stopListen();
                return true;
            }
        }

        this.dispatchEvent("disconnect");
        this.$stopListen();

        throw oError;

        /*bIsAuth
            ? "authfailure"
            : bIsConn ? "connectionerror" : "registererror", extra);*/
    }
    
    this.addEventListener("error", function(e){
        return this.dispatchEvent("connectionerror", e);
    });
    
    this.normalizeEntity = function(id){
        return id;
    }
    
    this.isConnected = function(){
        return this.listening == true;
    }
    
    this.$startListen = function(){
        this.listening = true;
        
        this.$poll();
    }
    
    this.$stopListen = function(){
        this.listening = false;
        this.setProperty("sessionId", "");

        this.cancel(this.$lastpoll);
    }
    
    this.$poll = function(){
        if (!this.sessionId || !this.listening)
            return;
        
        var _self = this;
        this.$lastpoll = this.get(this.host + this.PATHS.pipe + "?sid=" + this.sessionId, {
            nocache       : true,
            ignoreOffline : true,
            method        : "GET",
            callback      : function(message, state, extra){
                if (state != apf.SUCCESS) {
                    var knownError = extra.http.readyState 
                      && (extra.status == 401 
                      || extra.status == 403 
                      || extra.status == 500);

                    if (state == apf.TIMEOUT || !knownError
                      && extra.retries < (_self.maxretries || apf.maxHttpRetries)) {
                        setTimeout(function(){
                            extra.tpModule.retry(extra.id);
                        }, _self.retryinterval);
                        return true;
                    }
                    
                    _self.$stopListen();
                    
                    return _self.$handleError(message, state, extra);
                }
                else {
                    _self.$poll(); //continue polling
                    
                    if (message) {
                        var data = apf.unserialize(message);
                        var body = [];
                        for (var i = 0, l = data.length; i < l; i++) {
                            if (!data[i]) {
                                apf.console.warn("empty message received!");
                                continue;
                            }
                            
                            var d = data[i];
                            if (d.type == "update") {
                                _self.dispatchEvent("update", {
                                    message   : d.message, //@todo remote.js is not generic enough
                                    uri       : d.uri,
                                    annotator : d.uId
                                });
                            }
                            else if (d.type == "join") {
                                _self.dispatchEvent("join", {
                                    uri       : d.uri,
                                    basetime  : d.basetime, //@todo what is this?
                                    document  : d.document,
                                    annotator : d.uId
                                });
                            }
                            else if (d.type == "leave") {
                                //@todo what to do here?
                                _self.dispatchEvent("leave", {
                                    uri : d.uri
                                });
                            }
                        }
                    }
                }
            }
        });
    };
    
    //add a listener to a document
    this.join     = function(uri, callback){
        if (!this.sessionId) {
            apf.console.warn("Could not start RDB session, missing session id.");
            return false;
        }
        
        var _self = this;
        this.get(this.host + new apf.url(uri).path + "?sid=" + this.sessionId, {
            nocache       : true,
            ignoreOffline : true,
            method        : "LOCK",
            callback      : function(data, state, extra){
                if (state != apf.SUCCESS)
                    return _self.$handleError(data, state, extra, callback);
                else {
                    if (callback)
                        callback(uri);
                }
            }
        });
    }
    
    //remove a listener to a document
    this.leave  = function(uri){
        var _self = this;
        this.get(this.host + new apf.url(uri).path + "?sid=" + this.sessionId, {
            nocache       : true,
            ignoreOffline : true,
            method        : "UNLOCK",
            callback      : function(data, state, extra){
                if (state != apf.SUCCESS)
                    return _self.$handleError(data, state, extra); //, callback
            }
        });
    }
    
    //send change
    this.sendUpdate = function(uri, message){
        var _self = this;
        this.contentType = "application/json";
        this.get(this.host + new apf.url(uri).path + "?sid=" + this.sessionId, {
            nocache       : true,
            ignoreOffline : true,
            method        : "PUT",
            data          : message,
            callback      : function(data, state, extra){
                if (state != apf.SUCCESS)
                    return _self.$handleError(data, state, extra);
            }
        });
    }
    
    /**
     * Connect to the PERSIST server with a username and password combination
     * provided.
     *
     * @param {String}   username   Name of the user on the PERSIST server Virtual
     *                              Host
     * @param {String}   password   Password of the user
     * @param {Function} [callback] Function that will be called after the Async
     *                              login request
     * @type  {void}
     */
    this.login   = 
    this.connect = function(username, password, redirect, token, callback) {
        var _self = this;
        if (this.listening) {
            this.$stopListen();
            _self.dispatchEvent("disconnect");
            /*return this.disconnect(function(){
                _self.connect(username, password, redirect, token, callback);
            })*/
        }

        this.contentType = "application/x-www-form-urlencoded";
        this.get(this.host + this.PATHS.login + "?sid=" + this.sessionId, {
            nocache       : true,
            ignoreOffline : true,
            method        : "POST",
            data          : "username=" + encodeURIComponent(username) 
                            + "&password=" + encodeURIComponent(password)
                            + (redirect
                                ? "&redirect=" + encodeURIComponent(redirect)
                                : "")
                            + (token
                                ? "&token=" + encodeURIComponent(token)
                                : ""),
            callback      : function(data, state, extra){
                if (state != apf.SUCCESS)
                    return _self.$handleError(data, state, extra, callback);
                else {
                    data = apf.unserialize(data);
                    _self.setProperty("sessionId", data.sId || data.pId);
                    
                    if (!_self.sessionId) {
                        extra.message = "Did not get a session id from the server";
                        return _self.$handleError(data, apf.ERROR, extra, callback);
                    }
                    else {
                        var m = data.availableMethods;
                        for (var i = 0; i < m.length; i++) {
                            this[m[i]] = _self.$addMethod(m[i]);
                        }
                        
                        _self.$startListen();
                        
                        _self.dispatchEvent("connect", data);
                        
                        if (callback) 
                            callback(data, state, extra);
                    }
                }
            }
        });
    };

    /**
     * Disconnect from the PERSIST server. It suspends the connection with the
     * 'pause' attribute when using BOSH. Poll-based connection only need to
     * stop polling.
     *
     * @param {Function} callback Data instruction callback that will be called
     *                            after the Async request
     * @type {void}
     */
    this.logout     = 
    this.disconnect = function(callback) {
        if (!this.listening)
            return;
        
        var _self = this;
        this.contentType = "application/x-www-form-urlencoded";
        this.get(this.host + this.PATHS.logout + "?sid=" + this.sessionId, {
            nocache       : true,
            ignoreOffline : true,
            method        : "POST",
            callback      : function(data, state, extra){
                if (state != apf.SUCCESS) {
                    //@todo startlisten here?
                    
                    return _self.$handleError(data, state, extra, callback);
                }
                else {
                    _self.dispatchEvent("disconnect");
                    
                    if (callback) 
                        callback(data, state, extra);
                }
            }
        });
        
        this.$stopListen();
    };

    /**
     * If the client uses a BOSH session to connect to the PERSIST server, the
     * connection can be paused to any number of seconds until the maximum set
     * by the server.
     *
     * @see http://persist.org/extensions/xep-0124.html#inactive
     * @param {Number} secs Number of seconds to pause the connection.
     *                      Defaults to the max set by the server. (usually 120)
     * @type {void}
     */
    this.pause = function(secs) {
        
    };
    
    this.$addMethod = function(def){
        var funcName = def.name.replace(/\/(\w)/g, function(m, a) { return a.toUpperCase()})
        this[funcName] = function(){
            var args = def.args, out = [];
            for (var i = 0; i < args.length; i++) {
                out.push(args[i] + "=" + encodeURIComponent(arguments[i]));
            }
            var callback = arguments[arguments.length - 1];
            
            var _self = this;
            this.contentType = "application/x-www-form-urlencoded";
            this.get(this.host + "/" + def.name + "?sid=" + this.sessionId, {
                nocache       : true,
                ignoreOffline : true,
                method        : "POST",
                data          : out.join("&"),
                callback      : function(data, state, extra){
                    if (state != apf.SUCCESS)
                        return _self.$handleError(data, state, extra, callback);
                    else {
                        if (typeof callback == "function")
                            callback(data, state, extra);
                    }
                }
            });
        }
    }
    this.$addMethod({name: "sendpassword", args: ["username"]});
    
    /**
     * Instruction handler for XMPP protocols. It supports the following directives:
     * - xmpp:name.login(username, password)
     * - xmpp:name.logout()
     * - xmpp:name.notify(message, to_address, thread, type)
     */
    this.exec = function(method, args, callback){
        switch(method){
            case "login":
                this.connect(args[0], args[1], args[2], args[3], callback);
                break;
            case "logout":
                this.disconnect(callback);
                break;
            default:
                if (typeof this[method] == "function") {
                    args.push(callback);
                    this[method].apply(this, args);
                }
                else {
                    //#ifdef __DEBUG
                    throw new Error(apf.formatErrorString(0, null, "Saving/Loading data", 
                        "Invalid XMPP method '" + method + "'"));
                    //#endif
                }
            break;
        }
    };
}).call(apf.persist.prototype = new apf.Teleport());

apf.aml.setElement("persist", apf.persist);

// #endif
