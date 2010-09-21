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
 *  <a:appsettings>
 *      <a:auth>
 *           <a:service name   = "my-backend"
 *                      login  = "{comm.login(username, password)}"
 *                      logout = "{comm.logout()}" />
 *           <a:service name   = "my-jabber-server"
 *                      login  = "{myXmpp.login(username, password, domain)}"
 *                      logout = "{myXmpp.logout()}" />
 *      </a:auth>
 *  </a:appsettings>
 * </code>
 * Example:
 * A login window with different states managed by apf.auth
 * <code>
 *   <a:appsettings>
 *       <a:auth 
 *         login         = "{comm.login(username, password)}" 
 *         logout        = "{comm.logout()}"
 *         autostart     = "false"
 *         window        = "winLogin"
 *         fail-state    = "stFail"
 *         error-state   = "stError"
 *         login-state   = "stIdle"
 *         logout-state  = "stLoggedOut"
 *         waiting-state = "stLoggingIn" />
 *   </a:appsettings>
 *   <a:teleport>
 *       <a:rpc 
 *         id       = "comm" 
 *         protocol = "cgi">
 *           <a:method name="login" url="login.php">
 *               <a:param name="username" />
 *               <a:param name="password" />
 *           </a:method>
 *           <a:method name="logout" url="logout.php" />
 *       </a:rpc>
 *   </a:teleport>
 *  
 *   <a:state-group
 *     loginMsg.visible  = "false"
 *     winLogin.disabled = "false">
 *       <a:state id="stFail"
 *         loginMsg.value    = "Username or password incorrect"
 *         loginMsg.visible  = "true"
 *         winLogin.disabled = "false" />
 *       <a:state id="stError"
 *         loginMsg.value    = "An error has occurred. Please check your network."
 *         loginMsg.visible  = "true"
 *         winLogin.disabled = "false" />
 *       <a:state id="stLoggingIn"
 *         loginMsg.value    = "Please wait whilst logging in..."
 *         loginMsg.visible  = "true"
 *         winLogin.disabled = "true"
 *         btnLogout.visible = "false" />
 *       <a:state id="stIdle"
 *         btnLogout.visible = "true" />
 *       <a:state id="stLoggedOut"
 *         btnLogout.visible = "false"
 *         loginMsg.visible  = "false"
 *         winLogin.disabled = "false" />
 *  </a:state-group>
 * 
 *  <a:window id="winLogin" visible="true" width="400" height="400">
 *      <a:label>Username</a:label>
 *      <a:textbox type="username" value="TestUser" />
 *  
 *      <a:label>Password</a:label>
 *      <a:textbox type="password" value="open" />
 * 
 *      <a:label id="loginMsg" />
 *      <a:button action="login">Log in</a:button>
 *  </a:window>
 *  <a:button id="btnLogout" visible="false" action="logout">Log out</a:button>
 * </code>
 *
 * @event beforelogin   Fires before the log in request is sent to the service
 *   cancelable:    Prevents the log in from happening
 * @event beforelogout  Fires before the log out request is sent to the service
 *   cancelable:    Prevents the log out from happening
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
 * @attribute {String}  window          the id of the window element that offers a log in form to the user. DEPRECATED.
 * @attribute {String}  authreq-state   the id of the state element which is activated when logging in failed because the credentials where incorrect.
 * @attribute {String}  login-state     the id of the state element which is activated when logging in succeeded.
 * @attribute {String}  waiting-state   the id of the state element which is activated when the user is waiting while the application is logging in.
 * @attribute {String}  fail-state      the id of the state element which is activated when logging in failed because the credentials where incorrect.
 * @attribute {String}  error-state     the id of the state element which is activated when logging in failed because of an error (i.e. network disconnected).
 * @attribute {String}  logout-state    the id of the state element which is activated when the user is logged out.
 * @attribute {String}  model           the id of the model element which gets the data loaded given at login success.
 * @attribute {String}  remember        whether to remember the login credentials after the first successful login attempt. Will only be used i.c.w. RPC
 * @allowchild service
 * @define service  Element specifying a server to log into.
 * @attribute {String} name     the unique identifier of the service
 * @attribute {String} login    the {@link term.datainstruction data instruction} on how to log in to a service
 * @attribute {String} logout   the {@link term.datainstruction data instruction} on how to log out of a service
 * @see element.appsettings
 *
 * @default_private
 */

apf.auth = function(struct, tagName){
    this.$init(tagName || "auth", apf.NODE_HIDDEN, struct);

    this.$services    = {};
    this.$cache       = {};
    this.$queue       = [];
    this.$credentials = null;
};

apf.aml.setElement("auth", apf.auth);

(function(){
    this.autostart     = true;
    this.authenticated = false;
    this.enablequeue   = false;
    
    this.$retry      = true;
    this.loggedIn    = false;
    this.$needsLogin = false;
    this.$hasHost    = false;

    /**
     * Indicates the state of the log in process.
     * Possible values:
     * 0 idle
     * 1 logging in
     * 2 logging out
     */
    this.inProcess  = 0;
    
    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = apf.extend({
        login   : 1,
        logout  : 1
    }, this.$attrExcludePropBind);
    
    this.$booleanProperties["autostart"] = true;
    this.$booleanProperties["remember"]  = true;

    this.$supportedProperties.push("login", "logout", "fail-state", "error-state",
        "login-state", "logout-state", "waiting-state", "window", "autostart",
        "remember", "authenticated", "enablequeue");

    this.$propHandlers["login"]         = 
    this.$propHandlers["login-state"]   = function(value){
        this.$services["default"] = value ? this : null;
        this.$needsLogin          = value ? true : false;
    };
    
    this.register = function(node){
        this.$services[node.name] = node;
        this.$needsLogin = true;
    };
    
    this.unregister = function(node){
        var prop;
        delete this.$services[node.name];
        if (!(prop in this.$services))
            this.$needsLogin = false;
    };
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        this.inited = true;

        if (this.parentNode && this.parentNode.$setAuth) {
            this.parentNode.$setAuth(this);
            this.$hasHost = true;
        }

        if (this.autostart && !this.$hasHost) {
            var _self = this;
            apf.addEventListener("load", function(){
                _self.authRequired();
                apf.removeEventListener("load", arguments.callee);
            });
        }
    });
    
    this.addEventListener("authrequired", function(){
        if (self[this.window]) {
            this.win = self[this.window];
            if (this.win) {
                this.win.show();
                return false;
            }
        }
        
        if (self[this["authreq-state"]]) {
            this.state = self[this["authreq-state"]];
            if (this.state) {
                this.state.activate();
                return false;
            }
        }
    });

    this.addEventListener("beforelogin", function(){
        if (self[this["waiting-state"]]) {
            this.state = self[this["waiting-state"]];
            if (this.state)
                this.state.activate();
        }
    });

    var knownHttpAuthErrors = {401:1, 403:1}
    function failFunction(e){
        var st = (e.state == apf.TIMEOUT || !knownHttpAuthErrors[e.status]
            ? self[this["error-state"]]
            : self[this["fail-state"]]) || self[this["fail-state"]]

        if (st) {
            this.state = st;
            if (this.state) {
                this.state.activate();
                return false;
            }
        }
    }
    
    this.addEventListener("loginfail",  failFunction);
    this.addEventListener("logoutfail", failFunction);

    this.addEventListener("logoutsuccess", function(){
        if (self[this["logout-state"]]) {
            this.state = self[this["logout-state"]];
            if (this.state)
                this.state.activate();
        }
    });

    this.addEventListener("loginsuccess", function(e){
        if (self[this.window]) {
            this.win = self[this.window];
            if (this.win)
                this.win.hide();
        }

        if (self[this["login-state"]]) {
            this.state = self[this["login-state"]];
            if (this.state)
                this.state.activate();
        }

        //#ifdef __WITH_NAMESERVER
        if (e.data && this.model) {
            this.model = apf.nameserver.get("model", this.model);
            if (this.model)
                this.model.load(e.data);
        }
        //#endif
    });

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
    this.logIn = function(username, password, callback, options){
        if (!options) options = {};

        options.username = username;
        options.password = password;

        if (this.dispatchEvent("beforelogin", options) === false)
            return false;

        this.inProcess = 1; //Logging in

        var pos = 0,
            len = 0,
            _self = this,
            doneCallback = function() {
                if (len != ++pos)
                    return;

                _self.inProcess = 0; //Idle
                _self.loggedIn  = true;
                _self.clearQueue();

                if (callback)
                    callback();
            };

        if (this.$hasHost) { // child of Teleport element
            this.$credentials  = options;
            callback           = this.$hostCallback;
            this.$hostCallback = null;
            len                = 1;
            doneCallback();
            this.dispatchEvent("loginsuccess", {
                state    : 1,
                data     : null,
                bubbles  : true,
                username : username,
                password : password
            });
            if (!this.remember)
                this.$credentials = null;
        }
        else {
            if (!options.service) {
                var s = options.$services || this.$services;
                for (var name in s) {
                    len++;
                    this.$do(name, options, "in", null, doneCallback);
                }
            }
            else if (options.service) {
                len = 1;
                this.$do(options.service, options, "in", null, doneCallback);
            }
        }
    };

    this.relogin = function(){
        if (this.dispatchEvent("beforerelogin") === false)
            return false;

        //#ifdef __DEBUG
        apf.console.info("Retrying login...", "auth");
        //#endif

        //@todo shouldn't I be using inProces here?
        var name, pos = 0, len = 0, _self = this,
            doneCallback = function(){
                if (len != ++pos)
                    return;

                _self.inProcess = 0; //Idle
                _self.loggedIn  = true;
                _self.clearQueue();
            };

        for (name in this.$services) {
            if (!this.$cache[name])
                return false;
            len++;
            this.$do(name, this.$cache[name], "in", true, doneCallback);
        }

        return true;
    };

    this.$do = function(service, options, type, isRelogin, callback){
        var xmlNode = this.$services[service],
            _self   = options.userdata = this;

        //#ifdef __WITH_OFFLINE
        options.ignoreOffline = true; //We don't want to be cached by apf.offline
        //#endif

        //#ifdef __DEBUG
        apf.console.info("Logging " + type + " on service '"
            + service + "'", "auth");
        //#endif

        //Execute login call
        options.callback = function(data, state, extra){
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
                }, extra)),

                loginFailed = typeof result == "boolean"
                    ? !result
                    : !(state == apf.SUCCESS || type == "out" && extra.status == 401);

            if (loginFailed) {
                _self.inProcess = 0; //Idle

                if (isRelogin) //If we're retrying then we'll step out here
                    return _self.authRequired();

                //#ifdef __DEBUG
                apf.console.info("Log " + type + " failure for service '"
                    + service + "'", "auth");
                //#endif

                var commError = new Error(apf.formatErrorString(0, null,
                    "Logging " + type, "Error logging in: " + extra.message));

                if (_self.dispatchEvent("log" + type + "fail", apf.extend({
                    error    : commError,
                    service  : service,
                    state    : state,
                    data     : data,
                    bubbles  : true,
                    username : options.username,
                    password : options.password
                }, extra)) !== false)
                    throw commError; //@todo ouch, too harsh?

                //@todo Call auth required again??
                
                _self.setProperty("authenticated", false);

                return;
            }

            if (type == "in") {
                //If we use retry, cache the login information
                if (!isRelogin && _self.$retry) {
                    var cacheItem = {};
                    for (var prop in options) {
                        if ("object|array".indexOf(typeof options[prop]) == -1)
                            cacheItem[prop] = options[prop];
                    }
                    _self.$cache[service || "default"] = cacheItem;
                }
            }
            else {
                //Remove cached credentials
                if (_self.$cache[service || "default"])
                     _self.$cache[service || "default"] = null;

                //_self.authRequired();
            }

            if (callback)
                callback();

            _self.dispatchEvent("log" + type + "success", apf.extend({}, extra, {
                state   : state,
                service : service,
                data    : data,
                bubbles : true,
                username : options.username,
                password : options.password
            }));

            //#ifdef __DEBUG
            apf.console.info("Log " + type + " success for service '"
                + service + "'", "auth");
            //#endif
            
            _self.setProperty("authenticated", true);
        };
        apf.saveData(xmlNode.getAttribute("log" + type), options);
    };

    this.clearQueue = function(){
        if (!this.loggedIn) //Queue should only be cleared when we're logged in
            return;

        var queue = this.$queue.slice();
        this.$queue.length = 0;

        for (var i = 0; i < queue.length; i++) {
            var qItem = queue[i];

            //We might be logged out somewhere in this process (think sync)
            if (!this.loggedIn) {
                this.$queue.push(qItem);
                continue;
            }

             //Specialty retry (protocol specific)
            if (qItem.retry)
                qItem.$retry.call(qItem.object);

            //Standard TelePort Module retry
            else if (qItem.id)
                qItem.tpModule.retry(qItem.id);

            //#ifdef __DEBUG
            //Dunno what's up, lets tell the developer
            else
                apf.console.warn("Unable to retry queue item after "
                  + "successfull logging in. It seems the protocol that sent "
                  + "the message doesn't allow it.");
            //#endif
        }

        //The queue might be filled somehow
        if (this.$queue.length)
            this.clearQueue();
    };

    /**
     * Log out of one or more services
     * @param {Function} [callback] code to be called when the application succeeds or fails logging out
     * @param {Object}   [options]  extra settings and variables for the login. These variables will be available out the {@link term.datainstruction data instruction} which is called to execute the actual log out.
     *   Properties:
     *   {Array} services   a list of names of services to be logged out of
     *   {String} service   the name of a single service to log out of
     */
    this.logOut = function(callback, options){
        if (!options) options = {};

        if (this.dispatchEvent("beforelogout", options) === false)
            return;

        this.loggedIn = false;

        if (!options.service) {
            for (var name in this.$services)
                this.$do(name, options, "out", null, callback);
        }
        else if (options.service)
            this.$do(options.service, options, "out", null, callback);

    };
    
    this.getCredentials = function(service){
        var cache = this.$cache[service || "default"];
        return !cache ? ["", ""] : [cache.username, cache.password];
    }

    /**
     * Signals services that a log in is required and fires authrequired event
     * @param {Object}   [options]      information on how to reconstruct a failed action, that detected a log in was required. (i.e. When an HTTP call fails with a 401 Auth Required the options object contains information on how to retry the http request)
     * @param {Object}   [forceNoRetry] don't try to log in with stored credentials. 
     */
    this.authRequired = function(options, forceNoRetry){
        // If we're already logging in return
        if (options && options.userdata == this)
            return;

        // If we're supposed to be logged in we'll try to log in automatically
        if (this.loggedIn && !forceNoRetry && this.$retry && this.relogin()) {
            var result = false;
        }
        else if (this.inProcess != 1) { //If we're not already logging in
            if (this.$hasHost && typeof options == "function") { //inside Teleport element
                if (this.$credentials) 
                    return options();
                this.$hostCallback = options;
            }
            /*
                Apparently our credentials aren't valid anymore,
                or retry is turned off. If this event returns false
                the developer will call apf.auth.login() at a later date.
            */
            var result = this.dispatchEvent("authrequired", apf.extend({
                bubbles : true,
                data    : options && options.data
            }, options));
        }

        this.loggedIn = false;

        if (result === false) {
            if (this.enablequeue && options) //Add communication to queue for later processing
                this.$queue.push(options);

            return true; //cancels error state in protocol
        }
    };

}).call(apf.auth.prototype = new apf.AmlElement());
//#endif