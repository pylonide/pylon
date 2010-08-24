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
 * 02110-1301 USA, or see the FSF site: socket://www.fsf.org.
 *
 */

// #ifdef __TP_SOCKET

/**
 * This object does what is commonly known as Ajax, it <strong>A</strong>synchronously
 * communicates using <strong>J</strong>avascript <strong>A</strong>nd in most
 * cases it sends or receives <strong>X</strong>ml. It allows for easy socket
 * communication from within the browser. This object provides
 * {@link teleport.socket.method.savecache caching} on top of
 * the browser's cache. This enables you to optimize your application, because
 * this can be set on a per call basis.
 * Example:
 * Retrieving content over socket synchronously:
 * <code>
 *  var socket = new apf.socket();
 *  var data = socket.get("http://www.example.com/mydata.jsp", {async: false});
 *  alert(data);
 * </code>
 * Example:
 * Retrieving content over socket asynchronously:
 * <code>
 *  var socket = new apf.socket();
 *  socket.get("socket://www.example.com/mydata.jsp", {
 *      callback: function(data, state, extra){
 *         if (state != apf.SUCCESS)
 *             return alert('an error has occurred');
 *
 *         alert(data);
 *      }
 *  });
 * </code>
 * Example:
 * Async socket request with retry.
 * <code>
 *  var socket = new apf.socket();
 *  socket.get("http://www.example.com/mydata.jsp", {
 *      callback: function(data, state, extra){
 *          if (state != apf.SUCCESS) {
 *              var oError = new Error(apf.formatErrorString(0, null,
 *                  "While loading data", "Could not load data\n" + extra.message));
 *
 *              if (extra.tpModule.retryTimeout(extra, state, null, oError) === true)
 *                  return true;
 *
 *              throw oError;
 *          }
 *
 *          alert(data);
 *      }
 *  });
 * </code>
 *
 * @event error Fires when a communication error occurs.
 *   bubbles: yes
 *   cancelable:  Prevents a communication error to be thrown.
 *   object:
 *     {Error}          error     the error object that is thrown when the event
 *                                callback doesn't return false.
 *     {Number}         state     the state of the call
 *       Possible values:
 *       apf.SUCCESS  the request was successfull
 *       apf.TIMEOUT  the request has timed out.
 *       apf.ERROR    an error has occurred while making the request.
 *       apf.OFFLINE  the request was made while the application was offline.
 *     {mixed}          userdata  data that the caller wanted to be available in
 *                                the callback of the socket request.
 *     {XMLHttpRequest} socket      the object that executed the actual socket request.
 *     {String}         url       the url that was requested.
 *     {Http}           tpModule  the teleport module that is making the request.
 *     {Number}         id        the id of the request.
 *     {String}         message   the error message.
 *
 * @constructor
 * @define socket
 * @addnode teleport
 * @default_private
 *
 * @author      Mike de Boer (mike AT ajax DOT org)
 * @version     %I%, %G%
 * @since       3.0
 */
apf.socket = function(){
    this.pool      = {};
    this.callbacks = {};
    this.cache     = {};

    /**
     * Sets the timeout of a socket requests in milliseconds. Default is 10000ms (10s).
     */
    this.timeout   = this.timeout || 10000; //default 10 seconds

    if (!this.$uniqueId)
        this.$uniqueId = apf.all.push(this) - 1;

    this.toString = this.toString || function(){
        return "[Ajax.org Teleport Component : (Socket)]";
    };

    //#ifdef __WITH_STORAGE && __WITH_HTTP_CACHE
    
    this.saveCache = apf.K;

    this.loadCache = function(){ return true; };

    this.clearCache = apf.K;
    //#endif

    /**
     * Makes an socket request that receives xml
     * @param {String}   url       the url that is accessed.
     * @param {Object}   options   the options for the socket request
     *   Properties:
     *   {Boolean} async          whether the request is sent asynchronously. Defaults to true.
     *   {mixed}   userdata       custom data that is available to the callback function.
     *   {String}  method         the request method (POST|GET|PUT|DELETE). Defaults to GET.
     *   {Boolean} nocache        whether browser caching is prevented.
     *   {String}  data           the data sent in the body of the message.
     *   {Boolean} autoroute      whether the request can fallback to a server proxy.
     *   {Boolean} caching        whether the request should use internal caching.
     *   {Boolean} ignoreOffline  whether to ignore offline catching.
     *   {Function} callback      the handler that gets called whenever the
     *                            request completes succesfully or with an error,
     *                            or when the request times out.
     */
    this.getXml = function(url, callback, options){
        if (!options) options = {};
        options.useXML = true;
        options.callback = callback;
        return this.get(url, options);
    };

    /**
     * Makes an socket request.
     * @param {String}   url       the url that is accessed.
     * @param {Object}   options   the options for the socket request
     *   Properties:
     *   {mixed}   userdata       custom data that is available to the callback function.
     *   {String}  data           the data sent in the body of the message.
     *   {Boolean} useXML         whether the result should be interpreted as xml.
     *   {Function} callback      the handler that gets called whenever the
     *                            request completes succesfully or with an error,
     *                            or when the request times out.
     */
    this.get = this.$get = function(url, options){
        if (!options)
            options = {};

        var socket,
            _self = this,
            id    = options.id   || url,
            data  = options.data || "";
            
        function handleError(){
            var msg = "File or Resource not available " + url;

            //#ifdef __DEBUG
            apf.console.warn(msg, "teleport");
            // #endif
            
            var state = apf.ERROR;

            // File not found
            if (options.callback) {
                options.callback(null, state, {
                    userdata : options.userdata,
                    socket   : socket,
                    url      : url,
                    tpModule : _self,
                    id       : id,
                    message  : msg
                });
            }
        }

        function send(isLocal){
            var hasError;

            try{
                socket.write(data);
            }
            catch(e){
                hasError = true;
            }

            if (hasError) {
                handleError();
                return;
            }
        }
        
        if (!(socket = this.pool[id] ? this.pool[id].socket : null)) {
            //socket = apf.getSocket();
            var oUrl = new apf.url(url);
            if (!oUrl.host || !oUrl.port)
                throw new Error("no valid connection string for a socket connection: " + url);
            
            var net = require("net");
            socket = net.createConnection(oUrl.port, oUrl.host);
            socket.setEncoding("utf8");
            
            socket.addListener("connect", function() {
                send.call(_self);
            });

            socket.addListener("data", function(data) {
                if (arguments.callee.caller)
                    setTimeout(function(){_self.receive(id, data)});
                else
                    _self.receive(id, data);
            });
            
            //#ifdef __DEBUG
            socket.addListener("close", function() {
                apf.console.log("[socket] connection closed");
            });
            
            socket.addListener("error", function(e) {
                apf.console.log("[socket] connection error: " + e);
            });
            //#endif
            
            socket.addListener("end", function() {
                //#ifdef __DEBUG
                apf.console.log("[socket] connection ended");
                //#endif
                _self.pool[id] = null;
                delete _self.pool[id];
            });
            
            this.pool[id] = {
                socket    : socket,
                url       : url,
                callbacks : [options.callback],
                retries   : 0,
                options   : options,
                received  : ""
            };
        }
        else {
            this.pool[id].callbacks.push(options.callback);
            send.call(this);
        }
        
        return id;
    };

    // #ifdef __WITH_DATA
    /**
     * Method that all async objects should implement
     * @private
     */
    if (!this.exec) {
        this.exec = function(method, args, callback, options){
            if (!options)
                options = {};

            var url = args[0], query = "";
            if (!options.method)
                options.method = method.toUpperCase();
            if (!options.callback)
                options.callback = callback;

            this.$get(apf.getAbsolutePath(apf.config.baseurl, url), options);
        }
    }
    // #endif

    /**
     * @private
     */
    this.receive = function(id, data){
        if (!this.pool[id])
            return false;

        var qItem    = this.pool[id],
            socket   = qItem.socket,
            callback = qItem.callbacks.shift();

        //Gonna check for validity of the socket response
        var errorMessage = [],
            extra = {
                //#ifdef __DEBUG
                end      : new Date(),
                //#endif
                tpModule : this,
                socket   : socket,
                url      : qItem.url,
                callback : callback,
                id       : id,
                retries  : qItem.retries || 0,
                userdata : qItem.options.userdata
            };

        // Check HTTP Status
        // The message didn't receive the server. We consider this a timeout (i.e. 12027)
        //if (socket.status > 600)
        //    return this.$timeout(id);

        extra.data = data; //Can this error?
		
		qItem.received += data;
		var t = qItem.received.split(/(<\/(?:message|stream:features|challenge)>)/);

		if(t.length<=1){
			return;
		}
		data = t[0]+t[1];
		qItem.received = t[2];
	
        // Check for XML Errors
        if (qItem.options.useXML || this.useXML) {
            /* Note (Mike, Oct 14th 2008): for WebDAV, I had to copy the lines below,
                                           it required custom responseXML handling/
                                           parsing.
                                           If you alter this code, please correct
                                           webdav.js appropriately.
            */
            if ((data || "").replace(/^[\s\n\r]+|[\s\n\r]+$/g, "") == "")
                errorMessage.push("Received an empty XML document (0 bytes)");
            else {
                try {
                    var xmlDoc = apf.getXmlDom(data);

                    if (!apf.supportNamespaces)
                        xmlDoc.setProperty("SelectionLanguage", "XPath");

                    extra.data = xmlDoc.documentElement;
                }
                catch(e){
                    errorMessage.push("Received invalid XML\n\n" + e.message);
                }
            }
        }

        //Process errors if there are any
        if (errorMessage.length) {
            extra.message = errorMessage.join("\n");

            // Send callback error state
            if (callback)
                callback(extra.data, apf.ERROR, extra);

            return;
        }

        //Http call was successfull Success
        if (callback)
            callback(extra.data, apf.SUCCESS, extra);

        return extra.data;
    };

    this.$timeout = function(id){
        if (!this.pool[id])
            return false;

        var qItem  = this.pool[id],
            socket = qItem.socket;

        // Test if HTTP object is ready
        try {
            if (socket.status) {}
        }
        catch (e) {
            var _self = this;
            return $setTimeout(function(){
                _self.$timeout(id)
            }, 10);
        }

        var callback = qItem.callback;

        socket.abort();

        // #ifdef __DEBUG
        apf.console.info("Socket Timeout [" + id + "]", "teleport");
        // #endif

        var extra;
        var noClear = callback ? callback(null, apf.TIMEOUT, extra = {
            //#ifdef __DEBUG
            end     : new Date(),
            //#endif
            userdata: qItem.options.userdata,
            socket  : socket,
            url     : qItem.url,
            tpModule: this,
            id      : id,
            message : "HTTP Call timed out",
            retries : qItem.retries || 0
        }) : false;
    };

    /**
     * Checks if the request has times out. If so it's retried
     * three times before an exception is thrown. Request retrying is a very
     * good way to create robust Ajax applications. In many cases, even with
     * good connections requests time out.
     * @param {Object}  extra      the information object given as a third
     *                             argument of the socket request callback.
     * @param {Number}  state      the return code of the socket request.
     *   Possible values:
     *   apf.SUCCESS  the request was successfull
     *   apf.TIMEOUT  the request has timed out.
     *   apf.ERROR    an error has occurred while making the request.
     *   apf.OFFLINE  the request was made while the application was offline.
     * @param {AmlNode} [amlNode]    the element receiving the error event.
     * @param {Error}   [oError]     the error to be thrown when the request is
     *                               not retried.
     * @param {Number}  [maxRetries] the number of retries that are done before
     *                               the request times out. Default is 3.
     */
    this.retryTimeout = function(extra, state, amlNode, oError, maxRetries){
        if (state == apf.TIMEOUT
          && extra.retries < (maxRetries || apf.maxHttpRetries))
            return extra.tpModule.retry(extra.id);

        oError = oError || new Error(apf.formatErrorString(0,
            this, "Communication " + (state == apf.TIMEOUT
                ? "timeout"
                : "error"), "Url: " + extra.url + "\nInfo: " + extra.message));

        if ((amlNode || apf).dispatchEvent("error", apf.extend({
            error   : oError,
            state   : state,
            bubbles : true
        }, extra)) === false)
            return true;
    };

    /**
     * Removes the item from the queue. This is usually done automatically.
     * For the socket component, this Function is just a stub, to be compatible with 
     * the HTTP interface
     * @param {Number} id the id of the call that should be removed from the queue.
     */
    this.clearQueueItem = function(id){
        return;
    };

    /**
     * Retries a call based on it's id. The id of the call is found on the
     * 'extra' object. The third argument of the callback.
     * Example:
     * <code>
     *  function callback(data, state, extra){
     *      if (state == apf.TIMEOUT && extra.retries < apf.maxHttpRetries)
     *          return extra.tpModule.retry(extra.id);
     *
     *      //Do stuff here
     *  }
     * </code>
     * @param {Number} id the id of the call that should be retried.
     */
    this.retry = function(id){
        if (!this.pool[id])
            return false;

        var qItem = this.pool[id];

        // #ifdef __DEBUG
        apf.console.info("[Socket] Retrying request [" + id + "]", "teleport");
        // #endif

        qItem.retries++;
        qItem.options.id = id;
        this.get(qItem.url, qItem.options);

        return true;
    };

    /**
     * see {@link teleport.socket.method.clearqueueitem}
     */
    this.cancel = function(id){
        if (id === null)
            id = this.pool.length - 1;

        if (!this.pool[id])
            return false;

        //this.pool[id][0].abort();
    };

    if (!this.$loadAml && !this.instantiate && !this.call) {
        /**
         * @private
         */
        this.$loadAml = function(x){
            var receive = this["receive"];

            for (var i = 0, l = this.childNodes.length; i < l; i++) {
                if (this.childNodes[i].nodeType != 1)
                    continue;

                var url      = this.childNodes[i].getAttribute("url"),
                    callback = self[this.childNodes[i].getAttribute("receive") || receive],
                    options  = {
                        useXML  : this.childNodes[i].getAttribute("type") == "XML"
                    };

                this[this.childNodes[i].getAttribute("name")] = function(data, userdata){
                    options.userdata = userdata;
                    options.data     = data;
                    return this.get(url, options);
                }
            }
        };

        /**
         * @private
         */
        this.instantiate = function(x){
            var url     = x.getAttribute("src"),
                options = {
                    async   : x.getAttribute("async") != "false",
                    nocache : true
                };

            this.getURL = function(data, userdata){
                options.data     = data;
                options.userdata = userdata;
                options.callback = this.callbacks.getURL;
                return this.get(url, options);
            }

            var name = "socket" + Math.round(Math.random() * 100000);
            apf.setReference(name, this);

            return name + ".getURL()";
        };

        /**
         * @private
         */
        this.call = function(method, args){
            this[method].call(this, args);
        };
    }
};

//#ifdef __DEBUG
apf.teleportLog = function(extra){
    // @todo when WebSockets are implemented
    this.setXml = function(pNode){ return; };
    this.request = function(headers){ return; };
    this.response = function(extra){ return; };
}
//#endif

// #endif
