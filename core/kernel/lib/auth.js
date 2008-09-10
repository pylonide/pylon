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
 * Centralized login handling. Not being logged in, for instance after being
 * offline for enough time, or your session that expires can put the application
 * in a complex undefined state. This object makes sure the state is never
 * undefined. It gets signalled 'authentication is required' and gives off
 * appropriate events to display a login box. It can automatically retry logging
 * in to one or more services. Using stored username/password combinations. it
 * will queue all requests that require authentication until we're logged in
 * again and will then empty the queue.
 * Example:
 * <pre class="code">
 * <j:appsettings>
 *     <j:authentication>
 *          <j:service name   = "my-backend" 
 *                     login  = "rpc:comm.login(username, password)" 
 *                     logout = "rpc:comm.logout()" />
 *          <j:service name   = "my-jabber-server" 
 *                     login  = "xmpp:login(username, password, domain)" 
 *                     logout = "xmpp:logout()" />
 *     </j:authentication>
 * </j:appsettings>
 * </pre>
 * Example:
 * <pre class="code">
 * <j:appsettings>
 *     <j:authentication login  = "rpc:comm.login(username, password)" 
 *                       logout = "rpc:comm.logout()" />
 * </j:appsettings>
 * </pre>
 * @todo: Think about have login-state, fail-state, logout-state, model, window attributes
 */
jpf.auth = {
    services   : {},
    cache      : {},
    retry      : true,
    queue      : [],
    loggedIn   : false,
    needsLogin : false,
    autoStart  : true,
    
    /** 
     * Indicates what's happening right now
     * 0 = idle
     * 1 = logging in
     * 2 = logging out
     */
    inProcess  : 0,
    
    init : function(jml){
        jpf.makeClass(this);
        
        this.jml = jml;
        if (jml.getAttribute("login"))
            this.services["default"] = jml;
        
        if (jml.getAttribute("retry"))
            this.retry = jpf.isTrue(jml.getAttribute("retry"));
        
        if (jml.getAttribute("auto-start"))
            this.autoStart = jpf.isTrue(jml.getAttribute("auto-start"));
        
        var nodes = jml.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if(nodes[i].nodeType != 1)
                continue;

            //#ifdef __DEBUG
            if (!nodes[i].getAttribute("name")) {
                throw new Error(jpf.formatErrorString(0, this, "Parsing \
                    login settings", "Invalid format for the service tag, \
                    missing name attribute: <j:service name='' />", nodes[i]));
            }
            //#endif

            this.services[nodes[i].getAttribute("name")] = nodes[i];
            this.needsLogin = true;
        }
        
        //Events
        var attr = jml.attributes;
        for (var i = 0; i < attr.length; i++) {
            if (attr[i].nodeName.substr(0,2) == "on")
                this.addEventListener(attr[i].nodeName,
                    new Function(attr[i].nodeValue));
        }
        
        if (this.autoStart)
            this.authRequired();
    },
    
    login : function(username, password, callback, options){
        if (!options) options = {};
        
        options.username = username;
        options.password = password;
        
        if (this.dispatchEvent("onbeforelogin", options) === false)
            return false;
        
        this.inProcess = 1; //Logging in
        
        var pos = 0, len = 0;
        var doneCallback = function (){
            if (len != ++pos)
                return;
                
            jpf.auth.inProcess = 0; //Idle
            jpf.auth.loggedIn  = true;
            jpf.auth.clearQueue();
            
            if (callback)
                callback();
        }
        
        if (!options.service) {
            for (var name in this.services) {
                len++;
                this.__do(name, options, "in", null, doneCallback);
            }
        }
        else if (options.service) {
            len = 1;
            this.__do(options.service, options, "in", null, doneCallback);
        }
    },
    
    relogin : function(){
        if (this.dispatchEvent("onbeforerelogin") === false)
            return false;
        
        //#ifdef __DEBUG
        jpf.console.info("Retrying login...", "auth");
        //#endif
        
        for (var name in this.services) {
            if (!this.cache[name])
                return false;
            
            this.__do(name, this.cache[name], "in", true);
        }
        
        return true;
    },
    
    __do : function(service, options, type, isRelogin, callback){
        var xmlNode = this.services[service];
        var _self   = options.userdata = this;
        
        //#ifdef __WITH_OFFLINE
        options.ignoreOffline = true; //We don't want to be cached by jpf.offline
        //#endif
        
        //#ifdef __DEBUG
        jpf.console.info("Logging " + type + " on service '" + service + "'", "auth");
        //#endif
        
        //Execute login call
        jpf.saveData(xmlNode.getAttribute("log" + type), null, options,
          function(data, state, extra){
            if (state == jpf.TIMEOUT && extra.retries < jpf.maxHttpRetries) 
                return extra.tpModule.retry(extra.id);
            
            /*
                Login is sometimes very complex, so this check is 
                here to test the data for login information
            */
            var result = _self.dispatchEvent("onlog" + type + "check", 
                jpf.extend({
                    state   : state,
                    data    : data,
                    bubbles : true
                }, extra));
            
            var loginFailed = typeof result == "boolean"
                ? !result
                : state != jpf.SUCCESS;
            
            if (loginFailed) {
                jpf.auth.inProcess = 0; //Idle
                
                if (isRelogin) //If we're retrying then we'll step out here
                    return _self.authRequired();
                
                //#ifdef __DEBUG
                jpf.console.info("Log " + type + " failure for service '" 
                    + service + "'", "auth");
                //#endif
                
                var commError = new Error(jpf.formatErrorString(0, null, 
                    "Logging " + type, "Error logging in: " + extra.message));

                if (_self.dispatchEvent("onlog" + type + "fail", jpf.extend({
                    error   : commError,
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
            }
            
            if (callback)
                callback();
            
            _self.dispatchEvent("onlog" + type + "success", jpf.extend({
                state   : state,
                data    : data,
                bubbles : true
            }, extra));
            
            //#ifdef __DEBUG
            jpf.console.info("Log " + type + " success for service '" 
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
                jpf.console.warn("Unable to retry queue item after \
                    successfull logging in. It seems the protocol that sent \
                    the message doesn't allow it.");
            //#endif
        }
        
        //The queue might be filled somehow
        if (this.queue.length)
            this.clearQueue();
    },
    
    logout : function(callback, options){
        if (!options) options = {};
        
        if (this.dispatchEvent("onbeforelogout", options) === false)
            return;
        
        this.loggedIn = false;
        
        if (!options.service) {
            for (var name in this.services) {
                this.__do(name, options, "out", null, callback);
            }
        }
        else if (options.service)
            this.__do(options.service, options, "out", null, callback);
    },
    
    /**
     * Possible ways to handle this is
     * - Display a login dialogue
     * - Let the error pass through
     */
    authRequired : function(options){
        // If we're already logging in return
        if (options && options.userdata == this)
            return;
        
        // If we're supposed to be logged in we'll try to log in automatically
        if (this.loggedIn && this.retry && this.relogin()) {
            var result = false;
        }
        else if (this.inProcess != 1) { //If we're not already logging in
            /*
                Apparently our credentials aren't valid anymore, 
                or retry is turned off. If this event returns false
                the developer will call jpf.auth.login() at a later date.
            */
            var result = this.dispatchEvent("onauthrequired", jpf.extend({
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
}

//#endif