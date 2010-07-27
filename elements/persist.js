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
};

(function() {
    this.PATHS = {
        login  : "/login",
        logout : "/logout",
        pipe   : "/pipe"
    }
    
    this.$supportedProperties.push("host);

    this.$propHandlers["host"] = function(value) {
        
    };
    
    function handleError(state, extra){
        //if (extra.tpModule.retryTimeout(extra, state, _self, oError) === true)
        
        return this.dispatchEvent(bIsAuth
            ? "authfailure"
            : bIsConn ? "connectionerror" : "registererror", extra);
    }
    
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
        if (!this.$sessionId || !this.listening)
            return;
        
        var _self = this;
        this.$lastpoll = this.get(this.host + this.PATHS.pipe + "?sid=" + this.$sessionId , {
            nocache       : true,
            ignoreOffline : true,
            method        : "GET",
            callback      : function(message, state, extra){
                if (state != apf.SUCCESS)
                    handleError(state, extra, callback);
                else {
                    this.$poll(); //continue polling
                    
                    if (message) {
                        var data = apf.unserialize(message);
                        var body = [];
                        for (var i = 0, l = data.length; i < l; i++) {
                            if (data[i].type == "update") {
                                _self.dispatchEvent("datachange", {
                                    body      : [data[i].message], //@todo remote.js is not generic enough
                                    session   : data[i].model,
                                    annotator : data[i].uId
                                }
                            }
                            else if (data[i].type == "join") {
                                _self.dispatchEvent("datastatuschange", {
                                    session     : data[i].uri,
                                    e.baseline  : null, //@todo what is this?
                                    e.modeldata : data[i].document,
                                    e.annotator : data[i].uId
                                });
                            }
                            else if (data[i].type == "leave") {
                                //@todo what to do here?
                            }
                        }
                    }
                }
            }
        }
    }
    
    this.$stopListen = function(){
        this.listening = false;
        delete this.$sessionId;
        
        this.cancel(this.$lastpoll);
    }
    
    //add a listener to a document
    this.startRDB = function(sSession, callback){
        var _self = this;
        this.get(this.host + apf.getDirname(sSession), {
            nocache       : true,
            ignoreOffline : true,
            method        : "LOCK",
            callback      : function(data, state, extra){
                if (state != apf.SUCCESS)
                    handleError(state, extra, callback);
                else {
                    if (callback)
                        callback(data, state);
                }
            }
        }
    }
    
    //remove a listener to a document
    this.endRDB = function(sSession){
        var _self = this;
        this.get(this.host + apf.getDirname(sSession), {
            nocache       : true,
            ignoreOffline : true,
            method        : "UNLOCK",
            callback      : function(data, state, extra){
                if (state != apf.SUCCESS)
                    handleError(state, extra, callback);
                else {
                    if (callback)
                        callback(data, state);
                }
            }
        }
    }
    
    //send change
    this.sendRDB = function(model, message){
        var _self = this;
        this.get(this.host + apf.getDirname(sSession), {
            nocache       : true,
            ignoreOffline : true,
            method        : "PUT",
            data          : message,
            callback      : function(data, state, extra){
                if (state != apf.SUCCESS)
                    handleError(state, extra, callback);
                else {
                    if (callback)
                        callback(data, state);
                }
            }
        }
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
    this.connect = function(username, password, redirect_url, callback) {
        /**
         * Makes an http request.
         * @param {String}   url       the url that is accessed.
         * @param {Object}   options   the options for the http request
         *   Properties:
         *   {Boolean} async          whether the request is sent asynchronously. Defaults to true.
         *   {mixed}   userdata       custom data that is available to the callback function.
         *   {String}  method         the request method (POST|GET|PUT|DELETE). Defaults to GET.
         *   {Boolean} nocache        whether browser caching is prevented.
         *   {String}  data           the data sent in the body of the message.
         *   {Boolean} useXML         whether the result should be interpreted as xml.
         *   {Boolean} autoroute      whether the request can fallback to a server proxy.
         *   {Boolean} caching        whether the request should use internal caching.
         *   {Boolean} ignoreOffline  whether to ignore offline catching.
         *   {Function} callback      the handler that gets called whenever the
         *                            request completes succesfully or with an error,
         *                            or when the request times out.
         */
         
         var _self = this;
         this.get(this.host + this.PATHS.login, {
            nocache       : true,
            ignoreOffline : true,
            method        : "POST",
            data          : "username=" + encodeURIComponent(username) 
                            + "&password=" + encodeURIComponent(password)
                            + "&redirect_url=" + encodeURIComponent(redirect_url);
            callback      : function(data, state, extra){
                if (state != apf.SUCCESS)
                    handleError(state, extra, callback);
                else {
                    _self.$sessionId = parseInt(data);
                    
                    if (!_self.$sessionId) {
                        handleError(apf.ERROR, {
                            message: "Did not get a session id from the server"
                        }, callback);
                    }
                    else {
                        _self.$startListen();
                        
                        if (callback) 
                            callback(data, state, {session: _self.$sessionId});
                    }
                }
            }
        }
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
    this.disconnect = function(callback) {
        this.get(this.host + this.PATHS.logout, {
            nocache       : true,
            ignoreOffline : true,
            method        : "POST",
            callback      : function(data, state, extra){
                if (state != apf.SUCCESS)
                    handleError(state, extra, callback);
                else {
                    _self.$stopListen();
    
                    if (callback) 
                        callback(data, state, {session: this.$sessionId});
                }
            }
        }
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
    // #endif
}).call(apf.persist.prototype = new apf.Teleport());

apf.aml.setElement("persist", apf.persist);

// #endif
