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

// #define __WITH_TELEPORT 1

/**
 * Object allowing for easy non-prototol-specific data
 * communication from within the browser. (Ajax)
 *
 * @classDescription		This class creates a new Http object
 * @return {Http} Returns a new Http object
 * @type {Http}
 * @constructor
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.http = function(){
    this.queue     = [null];
    this.callbacks = {};
    this.cache     = {};
    this.timeout   = 10000; //default 10 seconds
    if (!this.uniqueId) 
        this.uniqueId = jpf.all.push(this) - 1;
    
    var _self = this;
    
    // Register Communication Module
    jpf.teleport.register(this);
    
    this.toString = this.toString || function(){
        return "[Javeline TelePort Component : (HTTP)]";
    }
    
    //#ifdef __WITH_STORAGE && __WITH_HTTP_CACHE
    var namespace = jpf.appsettings.name + ".jpf.http";
    
    this.saveCache = function(name, path){
        // #ifdef __DEBUG
        if (!jpf.serialize) 
            throw new Error(jpf.formatErrorMessage(1079, this, "HTTP save cache", "Could not find JSON library."));
        // #endif
        
        // #ifdef __DEBUG
        jpf.console.info("[HTTP] Loading HTTP Cache", "teleport");
        // #endif
        
        var strResult = jpf.serialize(comm.cache);
        jpf.storage.put("cache_" + _self.name, strResult, namespace);
    }
    
    this.loadCache = function(name){
        var strResult = jpf.storage.get("cache_" + _self.name, namespace);
        
        // #ifdef __DEBUG
        jpf.console.info("[HTTP] Loading HTTP Cache", "steleport");
        // #endif
        
        if (!strResult) 
            return false;
        
        this.cache = jpf.unserialize(strResult);
        
        return true;
    }
    
    this.clearCache = function(name){
        jpf.storage.remove("cache_" + _self.name, namespace);
    }
    //#endif
    
    this.getXml = function(url, callback, options){
        if(!options) options = {};
        options.useXML = true;
        return this.get(url, callback, options);
    }
    
    /**
     * Executes a HTTP Request
     * @param {string}      url         Specifies the url that is called
     * @param {function}    callback    This function is called when the request succeeds, has an error or times out
     * @param {object}      options     Valid options are:
     *   async           {boolean}  Sets wether the request is sent asynchronously. Defaults to true.
     *   userdata        {object}   Object that is passed to the callback
     *   method          {string}   Sets the request method (POST|GET|PUT|DELETE). Defaults to GET.
     *   nocache         {boolean}  Sets wether browser caching is prevented
     *   data            {string}   The data that is sent in the body of the message
     *   useXML          {boolean}  Specifying wether the result should be interpreted as XML
     *   autoroute       {boolean}  Specifying wether the request can fallback to a server proxy
     *   caching         {boolean}  Sets wether the request should use internal caching
     *   ignoreOffline   {boolean}  Sets wether to ignore offline catching
     */
    this.getString = 
    this.get       = function(url, callback, options, id){
        if(!options)
            options = {};
        
        //#ifdef __WITH_OFFLINE
        if (!jpf.offline.isOnline && options.notWhenOffline)
            return false;
        
        if (!jpf.offline.isOnline && !options.ignoreOffline) {
            if (jpf.offline.queue.enabled) {
                //Let's record all the necesary information for future use (during sync)
                var info = jpf.extend({
                    url      : url,
                    callback : callback,
                    retry    : function(){
                        _self.get(this.url, this.callback, this, id);
                    },
                    __object : [this.name, "jpf.oHttp", "new jpf.http()"],
                    __retry : "this.object.get(this.url, this.callback, this)"
                }, options);
                
                jpf.offline.queue.add(info);
                
                return;
            }
            
            /* 
                Apparently we're doing an HTTP call even though we're offline
                I'm allowing it, because the developer seems to know more
                about it than I right now
            */
            
            //#ifdef __DEBUG
            jpf.console.warn("Executing HTTP request even though application is offline");
            //#endif
        }
        //#endif
        
        var async = options.async 
            || options.async === undefined || jpf.isOpera;

        //#ifdef __SUPPORT_Safari
        if (jpf.isSafari) 
            url = jpf.html_entity_decode(url);
        //#endif
        
        var data = options.data || "";
        
        if (jpf.isNot(id)) {
            //#ifdef __WITH_HTTP_CACHE
            if (this.cache[url] && this.cache[url][data]) {
                var http = {
                    responseText : this.cache[url][data],
                    responseXML  : {},
                    status       : 200,
                    isCaching    : true
                }
            }
            else 
            //#endif
                var http = jpf.getHttpReq();
            
            id = this.queue.push({
                http     : http, 
                url      : url,
                callback : callback, 
                options  : options
            }) - 1;
            
            //#ifdef __WITH_HTTP_CACHE
            if (http.isCaching) {
                if (async) 
                    return setTimeout("jpf.lookup(" + this.uniqueId 
                        + ").receive(" + id + ");", 50);
                else 
                    return this.receive(id);
            }
            //#endif
        }
        else {
            var http = this.queue[id].http;

            //#ifdef __WITH_HTTP_CACHE
            if (http.isCaching) 
                http = jpf.getHttpReq();
            else 
            //#endif
                http.abort();
        }
        
        if (async) {
            //#ifdef __SUPPORT_IE5
            if (jpf.hasReadyStateBug) {
                this.queue[id].starttime = new Date().getTime();
                this.queue[id].timer = setInterval(function(){
                    var diff = new Date().getTime() - _self.queue[id].starttime;
                    if (diff > _self.timeout) {
                        _self.dotimeout(id);
                        return
                    };
                    
                    if (_self.queue[id].http.readyState == 4) {
                        clearInterval(_self.queue[id].timer);
                        _self.receive(id);
                    }
                }, 20);
            }
            else
            //#endif 
            {
                http.onreadystatechange = function(){
                    if (!_self.queue[id] || http.readyState != 4) 
                        return;
                    _self.receive(id);
                }
            }
        }
        
        var autoroute = this.autoroute && jpf.isOpera 
            ? true //Bug in opera
            : (options.autoroute || this.shouldAutoroute);
        var httpUrl = autoroute ? this.routeServer : url;
        
        // #ifdef __DEBUG
        if (!options.hideLogMessage) {
            jpf.console.info("[HTTP] Making request[" + id + "] using " 
                + (this.method || options.method || "GET") + " to " + url 
                + (autoroute 
                    ? "<span style='color:green'>[via: " + httpUrl + "]</span>" 
                    : ""),
                "teleport",
                new String(data && data.xml ? data.xml : data));
        }
        // #endif
        
        var errorFound = false;
        try {
            //if(srv.match(/(\.asp|\.aspx|\.ashx)$/)) nocache = false;
            http.open(this.method || options.method || "GET", (options.nocache
                ? jpf.getNoCacheUrl(httpUrl)
                : httpUrl), async);
            
            //OPERA ERROR's here... on retry
            http.setRequestHeader("User-Agent", "Javeline TelePort 1.0.0"); //@deprecated
            http.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            http.setRequestHeader("Content-type", this.contentType
                || (this.useXML || options.useXML ? "text/xml" : "text/plain"));
            
            if (autoroute) {
                http.setRequestHeader("X-Route-Request", url);
                http.setRequestHeader("X-Proxy-Request", url);
                http.setRequestHeader("X-Compress-Response", "gzip");
            }
        }
        catch (e) {
            errorFound = true;
        }
        
        if (errorFound) {
            var useOtherXH = false;
            
            //#ifdef __DEBUG
            if (self.XMLHttpRequestUnSafe) {
                try {
                    http = new XMLHttpRequestUnSafe();
                    http.onreadystatechange = function(){
                        if (!_self.queue[id] || http.readyState != 4) 
                            return;

                        _self.receive(id);
                    }
                    http.open(this.method || options.method || "GET", (options.nocache
                        ? jpf.getNoCacheUrl(httpUrl)
                        : httpUrl), async);

                    this.queue[id].http = http;
                    options.async     = true; //force async
                    useOtherXH        = true;
                }
                catch (e) {}
            }
            //#endif
            
            // Retry request by routing it
            if (!useOtherXH && this.autoroute && !autoroute) {
                //#ifdef __SUPPORT_IE5
                if (!jpf.isNot(id))
                    clearInterval(this.queue[id].timer);
                //#endif
                
                this.shouldAutoroute = true;
                
                options.autoroute = true;
                return this.get(url, receive, options, id);
            }
            
            if (!useOtherXH) {
                //Routing didn't work either... Throwing error
                var noClear = callback ? callback(null, jpf.ERROR, {
                    userdata: options.userdata,
                    http    : http,
                    url     : url,
                    tpModule: this,
                    id      : id,
                    message : "Permission denied accessing remote resource: " + url
                }) : false;
                if (!noClear) 
                    this.clearQueueItem(id);
                
                return;
            }
        }
        
        if (this.$HeaderHook) 
            this.$HeaderHook(http);
        
        //Set request headers
        if (options.headers) {
            for (var name in options.headers)
                http.setRequestHeader(name, options.headers[name]);
        }
        
        // #ifdef __DEBUG
        if (jpf.isIE && location.protocol == "file:" && url.indexOf("http://") == -1) {
            setTimeout(function(){http.send(data)});
        }
        else {
            http.send(data);
        }
        /* #else
         try{
            if (jpf.isIE && location.protocol == "file:" && url.indexOf("http://") == -1) {
                setTimeout(function(){http.send(data)});
            }
            else {
                http.send(data);
            }
         }catch(e){
             // Strange behaviour in IE causing errors in the callback to not be handled
             jpf.console.info("<strong>File or Resource not available " + arguments[0] + "</strong><hr />", "teleport");
             
             // File not found
             var noClear = callback ? callback(null, jpf.ERROR, {
                 userdata : options.userdata,
                 http     : http,
                 url      : url,
                 tpModule : this,
                 id       : id,
                 message  : "---- Javeline Error ----\nMessage : File or Resource not available: " + arguments[0]
             }) : false;
             if(!noClear) this.clearQueueItem(id);
             
             return;
         }
         #endif */

        if (!async) 
            return this.receive(id);
        else 
            return id;
    }
    
    this.receive = function(id){
        if (!this.queue[id]) 
            return false;
        
        var qItem    = this.queue[id];
        var http     = qItem.http;
        var callback = qItem.callback;
        
        //#ifdef __SUPPORT_IE5
        clearInterval(qItem.timer);
        //#endif
        
        // Test if HTTP object is ready
        try {
            if (http.status) {}
        } 
        catch (e) {
            return setTimeout(function(){
                _self.receive(id)
            }, 10);
        }

        // #ifdef __DEBUG
        if (!qItem.options.hideLogMessage) {
            jpf.console.info("[HTTP] Receiving [" + id + "]" 
                + (http.isCaching 
                    ? "[<span style='color:orange'>cached</span>]" 
                    : "") 
                + " from " + qItem.url, 
                "teleport",
                http.responseText);
        }
        // #endif
        
        //Gonna check for validity of the http response
        var errorMessage = [];
        
        var extra = {
            tpModule : this,
            http     : http,
            url      : qItem.url,
            callback : callback,
            id       : id,
            retries  : qItem.retries,
            userdata : qItem.options.userdata
        }
        
        // Check HTTP Status
        if (http.status >= 0 && http.status < 600)
            extra.data = http.responseText; //Can this error?
        else {
            //#ifdef __WITH_AUTH
            //@todo This should probably have a RPC specific handler
            if (http.status == 401) {
                if (jpf.auth.authRequired(extra) === true)
                    return;
            }
            //#endif

            errorMessage.push("HTTP error [" + id + "]:" + http.status + "\n" + http.responseText);
        }
        
        // Check for XML Errors
        if (qItem.options.useXML || this.useXML) {
            if (http.responseText.replace(/^[\s\n\r]+|[\s\n\r]+$/g, "") == "") 
                errorMessage.push("Received an empty XML document (0 bytes)");
            else{
                try{
                    var xmlDoc = (http.responseXML && http.responseXML.documentElement)
                        ? jpf.xmlParseError(http.responseXML)
                        : jpf.getXmlDom(http.responseText);
                    
                    if (!jpf.supportNamespaces) 
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
            if (!callback || !callback(extra.data, jpf.ERROR, extra))
                this.clearQueueItem(id);
            
            return;
        }
        
        // #ifdef __WITH_HTTP_CACHE
        if (qItem.options.caching) {
            if (!this.cache[qItem.url]) 
                this.cache[qItem.url] = {};

            this.cache[qItem.url][qItem.options.data] = http.responseText;
        }
        //#endif
        
        //Http call was successfull Success
        if (!callback || !callback(extra.data, jpf.SUCCESS, extra))
            this.clearQueueItem(id);
        
        return extra.data;
    }
    
    this.dotimeout = function(id){
        if (!this.queue[id]) 
            return false;
        
        var qItem = this.queue[id];
        var http  = qItem.http;
        
        //#ifdef __SUPPORT_IE5
        clearInterval(qItem.timer);
        //#endif
        
        // Test if HTTP object is ready
        try {
            if (http.status) {}
        } 
        catch (e) {
            return setTimeout(function(){
                _self.dotimeout(id)
            }, 10);
        }
        
        var callback = qItem.callback;
        
        http.abort();
        
        // #ifdef __DEBUG
        jpf.console.info("HTTP Timeout [" + id + "]", "teleport");
        // #endif
        
        var noClear = callback ? callback(null, jpf.TIMEOUT, {
            userdata: qItem.options.userdata,
            http    : http,
            url     : qItem.url,
            tpModule: this,
            id      : id,
            message : "HTTP Call timed out",
            retries : qItem.retries
        }) : false;
        if (!noClear) 
            this.clearQueueItem(id);
    }
    
    this.retryTimeout = function(extra, state, jmlNode, oError, maxRetries){
        if (state == jpf.TIMEOUT 
          && extra.retries < (maxRetries || jpf.maxHttpRetries))
            return extra.tpModule.retry(extra.id);
        
        //#ifdef __DEBUG
        oError = oError || new Error(jpf.formatErrorString(0, 
            this, "Communication " + (state == jpf.TIMEOUT 
                ? "timeout" 
                : "error"), "Url: " + extra.url + "\nInfo: " + extra.message));
        //#endif

        if ((jmlNode || jpf).dispatchEvent("onerror", jpf.extend({
            error   : oError,
            state   : state,
            bubbles : true
        }, extra)) === false)
            return true;
    }
    
    this.clearQueueItem = function(id){
        if (!this.queue[id]) 
            return false;
        
        //#ifdef __SUPPORT_IE5
        clearInterval(this.queue[id].timer);
        //#endif

        jpf.teleport.releaseHTTP(this.queue[id].http);

        this.queue[id] = null;
        delete this.queue[id];
        
        return true;
    }
    
    this.retry = function(id){
        if (!this.queue[id]) 
            return false;
        
        var qItem = this.queue[id];
        
        //#ifdef __SUPPORT_IE5
        clearInterval(qItem.timer);
        //#endif
        
        // #ifdef __DEBUG
        jpf.console.info("[HTTP] Retrying request [" + id + "]", "teleport");
        // #endif
        
        qItem.retries++;
        this.get(qItem.url, qItem.callback, qItem.options, id);
        
        return true;
    }
    
    this.cancel = function(id){
        if (id === null) 
            id = this.queue.length - 1;

        if (!this.queue[id]) 
            return false;
        
        //this.queue[id][0].abort();
        this.clearQueueItem(id);
    }
    
    if (!this.load) {
        this.load = function(x){
            var receive = x.getAttribute("receive");
            
            for (var i = 0; i < x.childNodes.length; i++) {
                if (x.childNodes[i].nodeType != 1) 
                    continue;
                
                var url      = x.childNodes[i].getAttribute("url");
                var callback = self[x.childNodes[i].getAttribute("receive") || receive];
                var options  = {
                    useXML  : x.childNodes[i].getAttribute("type") == "XML",
                    async   : !jpf.isFalse(x.childNodes[i].getAttribute("async"))
                }
                
                this[x.childNodes[i].getAttribute("name")] = function(data, userdata){
                    options.userdata = userdata;
                    options.data     = data;
                    return this.get(url, callback, options);
                }
            }
        }
        
        this.instantiate = function(x){
            var url     = x.getAttribute("src");
            var options = {
                async   : x.getAttribute("async") != "false",
                nocache : true
            }
            
            this.getURL = function(data, userdata){
                options.data     = data;
                options.userdata = userdata;
                return this.get(url, this.callbacks.getURL, options);
            }
            
            var name = "http" + Math.round(Math.random() * 100000);
            jpf.setReference(name, this);
            
            return name + ".getURL()";
        }
        
        this.call = function(method, args){
            this[method].call(this, args);
        }
    }
}

//Init.addConditional(function(){jpf.Comm.register("http", "variables", HTTP);}, null, ['Kernel']);
jpf.Init.run('http');
