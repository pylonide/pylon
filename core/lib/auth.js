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

//#ifdef __WITH_AUTH

/**
 * @define auth Centralized authentication handling. Not being logged in, after being
 * offline for a while can put the application
 * in a complex undefined state. The auth element makes sure the state is always
 * properly managed. When it gets signalled 'authentication required' it dispatches the
 * appropriate events to display a login box. It can automatically retry logging
 * in to one or more services using in memory stored username/password
 * combinations. It will queue all requests that require authentication until
 * the application is logged in again and will then empty the queue.
 * Example:
 * This example sets up apf.auth with two services that it can log into. 
 * <code>
 * <a:appsettings>
 *     <a:auth>
 *          <a:service name   = "my-backend"
 *                     login  = "rpc:comm.login(username, password)"
 *                     logout = "rpc:comm.logout()" />
 *          <a:service name   = "my-jabber-server"
 *                     login  = "xmpp:login(username, password, domain)"
 *                     logout = "xmpp:logout()" />
 *     </a:auth>
 * </a:appsettings>
 * </code>
 * Example:
 * A login window with different states managed by apf.auth
 * <code>
 *  <a:appsettings>
 *      <a:auth login  = "xmpp:login(username, password)"
 *              logout = "xmpp:logout()"
 *              autostart     = "true"
 *              window        = "winLogin"
 *              fail-state    = "stFail"
 *              error-state   = "stError"
 *              login-state   = "stIdle"
 *              waiting-state = "stLoggingIn" />
 *  </a:appsettings>
 *
 *  <a:state-group
 *    loginMsg.visible  = "false"
 *    winLogin.disabled = "false">
 *      <a:state id="stFail"
 *          loginMsg.value   = "Username or password incorrect"
 *          loginMsg.visible = "true" />
 *      <a:state id="stError"
 *          loginMsg.value   = "An error has occurred. Please check your network."
 *          loginMsg.visible = "true" />
 *      <a:state id="stLoggingIn"
 *          loginMsg.value    = "Please wait whilst logging in..."
 *          loginMsg.visible  = "true"
 *          winLogin.disabled = "true" />
 *      <a:state id="stIdle" />
 *  </a:state-group>
 *
 *  <a:window id="winLogin">
 *      <a:label>Username</a:label>
 *      <a:textbox type="username" />
 *
 *      <a:label>Password</a:label>
 *      <a:textbox type="password" />
 *
 *      <a:text id="loginMsg" />
 *      <a:button action="login">Log in</a:button>
 *  </a:window>
 * </code>
 *
 * @event beforelogin   Fires before the log in request is sent to the service
 *   cancellable:    Prevents the log in from happening
 * @event beforelogout  Fires before the log out request is sent to the service
 *   cancellable:    Prevents the log out from happening
 * @event logincheck    Fires when log in data is received. Login is sometimes very complex, this event is dispatched to allow a custom check if a log in succeeded.
 *   bubbles: yes
 *   object:
 *     {Object} data     the data received from the log in request
 *     {Number} state    the return code of the log in request
 * @event loginfail     Fires when a log in attempt has failed
 * @event loginsuccess  Fires when a log in attempt succeeded
 * @event logoutcheck   Fires when log out data is received. Login is sometimes very complex, this event is dispatched to allow a custom check if a log out succeeded.
 *   bubbles: yes
 *   object:
 *     {Object} data     the data received from the log out request
 *     {Number} state    the return code of the log out request
 * @event logoutfail    Fires when a log out attempt has failed
 * @event logoutsuccess Fires when a log out attempt succeeded
 * @event authrequired  Fires when log in credentials are required, either because they are incorrect, or because they are unavailable.
 *   bubbles: yes
 *
 * @inherits apf.Class
 *
 * @attribute {String}  login           the {@link term.datainstruction data instruction} on how to log in to a service.
 * @attribute {String}  logout          the {@link term.datainstruction data instruction} on how to log out of a service.
 * @attribute {Boolean} autostart       whether to fire authrequired at startup. Defaults to true.
 * @attribute {String}  window          the id of the window element that offers a log in form to the user.
 * @attribute {String}  fail-state      the id of the state element which is activated when logging in failed because the credentials where incorrect.
 * @attribute {String}  error-state     the id of the state element which is activated when logging in failed because of an error (i.e. network disconnected).
 * @attribute {String}  login-state     the id of the state element which is activated when logging in succeeded.
 * @attribute {String}  waiting-state   the id of the state element which is activated when the user is waiting while the application is logging in.
 * @attribute {String}  logout-state    the id of the state element which is activated when the user is logged out.
 * @attribute {String}  model           the id of the model element which gets the data loaded given at login success.
 * @allowchild service
 * @define service  Element specifying a server to log into.
 * @attribute {String} name     the unique identifier of the service
 * @attribute {String} login    the {@link term.datainstruction data instruction} on how to log in to a service
 * @attribute {String} logout   the {@link term.datainstruction data instruction} on how to log out of a service
 * @see element.appsettings
 *
 * @default_private
 */
apf.auth = {
    services   : {},
    cache      : {},
    retry      : true,
    queue      : [],
    loggedIn   : false,
    needsLogin : false,
    autoStart  : true,

    /**
     * Indicates the state of the log in process.
     * Possible values:
     * 0 idle
     * 1 logging in
     * 2 logging out
     * @private
     */
    inProcess  : 0,

    init : function(aml){
        apf.makeClass(this);

        this.inited = true;
        if (!aml)
            return;
        
        this.$aml   = aml;
        if (aml.getAttribute("login")) {
            this.services["default"] = aml;
            this.needsLogin          = true;
        }

        if (aml.getAttribute("retry"))
            this.retry = apf.isTrue(aml.getAttribute("retry"));

        if (aml.getAttribute("autostart"))
            this.autoStart = apf.isTrue(aml.getAttribute("autostart"));

        //Handling
        var loginWindow  = aml.getAttribute("window");
        var waitingState = aml.getAttribute("waiting-state");
        var loginState   = aml.getAttribute("login-state");
        var failState    = aml.getAttribute("fail-state");
        var errorState   = aml.getAttribute("error-state");
        var logoutState  = aml.getAttribute("logout-state");
        var modelLogin   = aml.getAttribute("model");

        if (loginWindow || loginState || failState || logoutState) {
            this.addEventListener("authrequired", function(){
                if (loginWindow) {
                    var win = self[loginWindow];
                    if (win) {
                        win.show();
                        return false;
                    }
                }
            });

            this.addEventListener("beforelogin", function(){
                if (waitingState) {
                    var state = self[waitingState];
                    if (state) state.activate();
                }
            });

            function failFunction(e){
                var st = (e.state == apf.TIMEOUT
                    ? errorState
                    : failState) || failState

                if (st) {
                    var state = self[st];
                    if (state) {
                        state.activate();
                        return false;
                    }
                }
            }
            this.addEventListener("loginfail", failFunction);
            this.addEventListener("logoutfail", failFunction);

            this.addEventListener("logoutsuccess", function(){
                if (logoutState) {
                    var state = self[logoutState];
                    if (state) state.activate();
                }
            });

            this.addEventListener("loginsuccess", function(e){
                if (loginWindow) {
                    var win = self[loginWindow];
                    if (win) win.hide();
                }

                if (loginState) {
                    var state = self[loginState];
                    if (state) state.activate();
                }

                if (e.data && modelLogin) {
                    var model = apf.nameserver.get("model", modelLogin);
                    if (model) model.load(e.data);
                }
            });
        }

        var i, nodes = aml.childNodes;
        for (i = 0; i < nodes.length; i++) {
            if(nodes[i].nodeType != 1)
                continue;

            //#ifdef __DEBUG
            if (!nodes[i].getAttribute("name")) {
                throw new Error(apf.formatErrorString(0, this, "Parsing \
                    login settings", "Invalid format for the service tag, \
                    missing name attribute: <a:service name='' />", nodes[i]));
            }
            //#endif

            this.services[nodes[i].getAttribute("name")] = nodes[i];
            this.needsLogin = true;
        }

        //Events
        var attr = aml.attributes;
        for (i = 0; i < attr.length; i++) {
            if (attr[i].nodeName.substr(0,2) == "on")
                this.addEventListener(attr[i].nodeName,
                    new Function("event", attr[i].nodeValue));
        }

        if (this.autoStart) {
            apf.addEventListener("load", function(){
                apf.auth.authRequired();
                apf.removeEventListener("load", arguments.callee);
            });
        }
    },

    /**
     * Log in to one or more services
     * @param {String}   username   the username portion of the credentials used to log in with
     * @param {String}   password   the password portion of the credentials used to log in with
     * @param {Function} [callback] code to be called when the application succeeds or fails logging in
     * @param {Object}   [options]  extra settings and variables for the login. These variables will be available in the {@link term.datainstruction data instruction} which is called to execute the actual log in.
     *   Properties:
     *   {Array} services   a list of names of services to be logged in to
     *   {String} service   the name of a single service to log in to
     */
    login : function(username, password, callback, options){
        if (!options) options = {};

        options.username = username;
        options.password = password;

        if (this.dispatchEvent("beforelogin", options) === false)
            return false;

        this.inProcess = 1; //Logging in

        var pos = 0, len = 0;
        var doneCallback = function (){
            if (len != ++pos)
                return;

            apf.auth.inProcess = 0; //Idle
            apf.auth.loggedIn  = true;
            apf.auth.clearQueue();

            if (callback)
                callback();
        }

        if (!options.service) {
            var s = options.services || this.services;
            for (var name in s) {
                len++;
                this.$do(name, options, "in", null, doneCallback);
            }
        }
        else if (options.service) {
            len = 1;
            this.$do(options.service, options, "in", null, doneCallback);
        }
    },

    relogin : function(){
        if (this.dispatchEvent("beforerelogin") === false)
            return false;

        //#ifdef __DEBUG
        apf.console.info("Retrying login...", "auth");
        //#endif

        //@todo shouldn't I be using inProces here?

        var pos = 0, len = 0;
        var doneCallback = function (){
            if (len != ++pos)
                return;

            apf.auth.inProcess = 0; //Idle
            apf.auth.loggedIn  = true;
            apf.auth.clearQueue();
        }

        for (var name in this.services) {
            if (!this.cache[name])
                return false;
            len++;
            this.$do(name, this.cache[name], "in", true, doneCallback);
        }

        return true;
    },

    $do : function(service, options, type, isRelogin, callback){
        var xmlNode = this.services[service];
        var _self   = options.userdata = this;

        //#ifdef __WITH_OFFLINE
        options.ignoreOffline = true; //We don't want to be cached by apf.offline
        //#endif

        //#ifdef __DEBUG
        apf.console.info("Logging " + type + " on service '"
            + service + "'", "auth");
        //#endif

        //Execute login call
        apf.saveData(xmlNode.getAttribute("log" + type), null, options,
          function(data, state, extra){
            if (state == apf.TIMEOUT && extra.retries < apf.maxHttpRetries)
                return extra.tpModule.retry(extra.id);

            /*
                Login is sometimes very complex, so this check is
                here to test the data for login information
            */
            var result = _self.dispatchEvent("log" + type + "check",
                apf.extend({
                    state   : state,
                    data    : data,
                    service : service,
                    bubbles : true
                }, extra));

            var loginFailed = typeof result == "boolean"
                ? !result
                : !(state == apf.SUCCESS || type == "out" && extra.http.status == 401);

            if (loginFailed) {
                apf.auth.inProcess = 0; //Idle

                if (isRelogin) //If we're retrying then we'll step out here
                    return _self.authRequired();

                //#ifdef __DEBUG
                apf.console.info("Log " + type + " failure for service '"
                    + service + "'", "auth");
                //#endif

                var commError = new Error(apf.formatErrorString(0, null,
                    "Logging " + type, "Error logging in: " + extra.message));

                if (_self.dispatchEvent("log" + type + "fail", apf.extend({
                    error   : commError,
                    service : service,
                    state   : state,
                    bubbles : true
                }, extra)) !== false)
                    throw commError; //@todo ouch, too harsh?

                //@todo Call auth required again??

                return;
            }
            
            if (type == "in") {
                //If we use retry, cache the login information
                if (!isRelogin && _self.retry) {
                    var cacheItem = {};
                    for (var prop in options) {
                        if ("object|array".indexOf(typeof options[prop]) == -1)
                            cacheItem[prop] = options[prop];
                    }
                    _self.cache[service || "default"] = cacheItem;
                }
            }
            else {
                //Remove cached credentials
                if (_self.cache[service || "default"])
                     _self.cache[service || "default"] = null;
                
                apf.auth.authRequired();
            }

            if (callback)
                callback();

            _self.dispatchEvent("log" + type + "success", apf.extend({
                state   : state,
                service : service,
                data    : data,
                bubbles : true
            }, extra));

            //#ifdef __DEBUG
            apf.console.info("Log " + type + " success for service '"
                + service + "'", "auth");
            //#endif
        });
    },

    clearQueue : function(){
        if (!this.loggedIn) //Queue should only be cleared when we're logged in
            return;

        var queue = this.queue.slice();
        this.queue.length = 0;

        for (var i = 0; i < queue.length; i++) {
            var qItem = queue[i];

            //We might be logged out somewhere in this process (think sync)
            if (!this.loggedIn) {
                this.queue.push(qItem);
                continue;
            }

             //Specialty retry (protocol specific)
            if (qItem.retry)
                qItem.retry.call(qItem.object);

            //Standard TelePort Module retry
            else if (qItem.id)
                qItem.tpModule.retry(qItem.id);

            //#ifdef __DEBUG
            //Dunno what's up, lets tell the developer
            else
                apf.console.warn("Unable to retry queue item after \
                    successfull logging in. It seems the protocol that sent \
                    the message doesn't allow it.");
            //#endif
        }

        //The queue might be filled somehow
        if (this.queue.length)
            this.clearQueue();
    },

    /**
     * Log out of one or more services
     * @param {Function} [callback] code to be called when the application succeeds or fails logging out
     * @param {Object}   [options]  extra settings and variables for the login. These variables will be available out the {@link term.datainstruction data instruction} which is called to execute the actual log out.
     *   Properties:
     *   {Array} services   a list of names of services to be logged out of
     *   {String} service   the name of a single service to log out of
     */
    logout : function(callback, options){
        if (!options) options = {};

        if (this.dispatchEvent("beforelogout", options) === false)
            return;

        this.loggedIn = false;

        if (!options.service) {
            for (var name in this.services) {
                this.$do(name, options, "out", null, callback);
            }
        }
        else if (options.service)
            this.$do(options.service, options, "out", null, callback);
        
    },

    /**
     * Signals services that a log in is required and fires authrequired event
     * @param {Object}   [options]  information on how to reconstruct a failed action, that detected a log in was required. (i.e. When an HTTP call fails with a 401 Auth Required the options object contains information on how to retry the http request)
     */
    authRequired : function(options, forceNoRetry){
        if (!this.inited)
            this.init();

        // If we're already logging in return
        if (options && options.userdata == this)
            return;

        // If we're supposed to be logged in we'll try to log in automatically
        if (this.loggedIn && !forceNoRetry && this.retry && this.relogin()) {
            var result = false;
        }
        else if (this.inProcess != 1) { //If we're not already logging in
            /*
                Apparently our credentials aren't valid anymore,
                or retry is turned off. If this event returns false
                the developer will call apf.auth.login() at a later date.
            */
            var result = this.dispatchEvent("authrequired", apf.extend({
                bubbles : true
            }, options));
        }

        this.loggedIn = false;

        if (result === false) {
            if (options) //Add communication to queue for later processing
                this.queue.push(options);

            return true; //cancels error state in protocol
        }
    }
};

//#endif
