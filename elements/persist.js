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
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
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
    this.PATHS = {
        login  : "/login",
        logout : "/logout",
        pipe   : "/pipe"
    };
    
    this.$supportedProperties.push("host");

    this.$propHandlers["host"] = function(value) {
        
    };
    
    this.$handleError = function(data, state, extra, callback){
        var oError, amlNode = this;
        
        if (extra.http.status == 401 
         || extra.http.status == 403 
         || extra.http.status == 500) {
            oError = new Error(apf.formatErrorString(1032, amlNode,
                "Persist protocol",
                extra.http.statusText + " in " + amlNode.name
                + "[" + amlNode.tagName + "] \nUrl: " + extra.url
                + "\nInfo: " + extra.message));
        }
        else {
            oError = new Error(apf.formatErrorString(1032, amlNode,
                "Polling in persist protocol",
                "Connection dissapeared " + amlNode.name
                + "[" + amlNode.tagName + "] \nUrl: " + extra.url
                + "\nInfo: " + extra.message));
        }
        
        if (typeof callback == "function") {
            callback.call(amlNode, data, state, extra);
            return true;
        }
        else if (amlNode.retryTimeout(extra, state, amlNode, oError) === true)
            return true;

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
    
    this.$poll = function(){
        if (!this.sessionId || !this.listening)
            return;
        
        var _self = this;
        this.$lastpoll = this.get(this.host + this.PATHS.pipe + "?sid=" + this.sessionId, {
            nocache       : true,
            ignoreOffline : true,
            method        : "GET",
            callback      : function(message, state, extra){
                if (state != apf.SUCCESS)
                    _self.$handleError(message, state, extra);
                else {
                    _self.$poll(); //continue polling
                    
                    if (message) {
                        var data = apf.unserialize(message);
                        var body = [];
                        for (var i = 0, l = data.length; i < l; i++) {
                            if (data[i].type == "update") {
                                _self.dispatchEvent("datachange", {
                                    body      : [data[i].message], //@todo remote.js is not generic enough
                                    session   : data[i].uri,
                                    annotator : data[i].uId
                                });
                            }
                            else if (data[i].type == "join") {
                                _self.dispatchEvent("datastatuschange", {
                                    type      : "result",
                                    session   : data[i].uri,
                                    baseline  : data[i].baseline, //@todo what is this?
                                    modeldata : data[i].document,
                                    annotator : data[i].uId,
                                    fields    : [] //what is this?
                                });
                            }
                            else if (data[i].type == "leave") {
                                //@todo what to do here?
                            }
                        }
                    }
                }
            }
        });
    };
    
    this.$stopListen = function(){
        this.listening = false;
        delete this.sessionId;

        this.cancel(this.$lastpoll);
    }
    
    //add a listener to a document
    this.join     = 
    this.startRDB = function(sSession, callback){
        if (sSession == "empty")
            return;
        var _self = this;
        this.get(this.host + new apf.url(sSession).path + "?sid=" + this.sessionId, {
            nocache       : true,
            ignoreOffline : true,
            method        : "LOCK",
            callback      : function(data, state, extra){
                if (state != apf.SUCCESS)
                    _self.$handleError(data, state, extra, callback);
                else {
                    if (callback)
                        callback(sSession);
                }
            }
        });
    }
    
    //remove a listener to a document
    this.leave  = 
    this.endRDB = function(sSession){
        var _self = this;
        this.get(this.host + new apf.url(sSession).path + "?sid=" + this.sessionId, {
            nocache       : true,
            ignoreOffline : true,
            method        : "UNLOCK",
            callback      : function(data, state, extra){
                if (state != apf.SUCCESS)
                    _self.$handleError(data, state, extra, callback);
            }
        });
    }
    
    //send change
    this.sendRDB = function(sSession, message){
        var _self = this;
        this.get(this.host + new apf.url(sSession).path + "?sid=" + this.sessionId, {
            nocache       : true,
            ignoreOffline : true,
            method        : "PUT",
            data          : message,
            callback      : function(data, state, extra){
                if (state != apf.SUCCESS)
                    _self.$handleError(data, state, extra);
            }
        });
    }
    
    //what should this do??
    this.sendSyncRDB = function(annotator, sSession, iBaseline, sModel) {
        
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
    this.connect = function(username, password, redirect, callback) {
        var _self = this;
        if (this.listening)
            return this.disconnect(function(){
                _self.connect(username, password, redirect, callback);
            })

        this.get(this.host + this.PATHS.login, {
            nocache       : true,
            ignoreOffline : true,
            method        : "POST",
            data          : "username=" + encodeURIComponent(username) 
                            + "&password=" + encodeURIComponent(password)
                            + (redirect
                                ? "&redirect=" + encodeURIComponent(redirect)
                                : ""),
            callback      : function(data, state, extra){
                if (state != apf.SUCCESS)
                    _self.$handleError(data, state, extra, callback);
                else {
                    data = apf.unserialize(data);
                    _self.sessionId = data.sId;
                    
                    if (!_self.sessionId) {
                        _self.$handleError(data, apf.ERROR, {
                            message: "Did not get a session id from the server"
                        }, callback);
                    }
                    else {
                        var m = data.availableMethods;
                        for (var i = 0; i < m.length; i++) {
                            this[m[i]] = _self.$addMethod(m[i]);
                        }
                        
                        _self.$startListen();
                        _self.dispatchEvent("connected"); //@todo reconnect
                        
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
        this.get(this.host + this.PATHS.logout + "?sid=" + this.sessionId, {
            nocache       : true,
            ignoreOffline : true,
            method        : "POST",
            callback      : function(data, state, extra){
                if (state != apf.SUCCESS) {
                    //@todo startlisten here?
                    
                    _self.$handleError(data, state, extra, callback);
                }
                else {
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
    
    //add a listener to a document
    this.create = function(sSession, callback){
        var _self = this;
        this.get(this.host + new apf.url(sSession).path + "?sid=" + this.sessionId, {
            nocache       : true,
            ignoreOffline : true,
            method        : "POST",
            callback      : function(data, state, extra){
                if (state != apf.SUCCESS)
                    _self.$handleError(data, state, extra, callback);
                else {
                    if (callback)
                        callback(data);
                }
            }
        });
    }
    
    this.$addMethod = function(name){
        this[name] = function(body, callback){
            var _self = this;
            this.get(this.host + "/" + name + "?sid=" + this.sessionId, {
                nocache       : true,
                ignoreOffline : true,
                method        : "POST",
                data          : body,
                callback      : function(data, state, extra){
                    if (state != apf.SUCCESS)
                        _self.$handleError(data, state, extra, callback);
                    else {
                        if (callback)
                            callback(data);
                    }
                }
            });
        }
    }
    
    /**
     * Instruction handler for XMPP protocols. It supports the following directives:
     * - xmpp:name.login(username, password)
     * - xmpp:name.logout()
     * - xmpp:name.notify(message, to_address, thread, type)
     */
    this.exec = function(method, args, callback){
        switch(method){
            case "login":
                this.connect(args[0], args[1], args[2], callback);
                break;
            case "logout":
                this.disconnect();
                break;
            default:
                if (typeof this[method] == "function") {
                    this[method](args[0], callback);
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
