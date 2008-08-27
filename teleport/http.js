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
    jpf.Teleport.register(this);
    
    this.toString = this.toString || function(){
        return "[Javeline TelePort Component : (HTTP)]";
    }
    
    //#ifdef __WITH_STORAGE && __WITH_HTTP_CACHE
    var namespace = jpf.appsettings.name + ".jpf.http";
    
    this.saveCache = function(name, path){
        // #ifdef __DEBUG
        if (!jpf.serialize) 
            throw new Error(1079, jpf.formatErrorMessage(1079, this, "HTTP save cache", "Could not find JSON library."));
        // #endif
        
        // #ifdef __STATUS
        jpf.status("[HTTP] Loading HTTP Cache", "teleport");
        // #endif
        
        var strResult = jpf.serialize(comm.cache);
        jpf.storage.put("cache_" + _self.name, strResult, namespace);
    }
    
    this.loadCache = function(name){
        var strResult = jpf.storage.get("cache_" + _self.name, namespace);
        
        // #ifdef __STATUS
        jpf.status("[HTTP] Loading HTTP Cache", "steleport");
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
     *   async     {boolean}  Sets wether the request is sent asynchronously. Defaults to true.
     *   userdata  {object}   Object that is passed to the callback
     *   method    {string}   Sets the request method (POST|GET|PUT|DELETE). Defaults to GET.
     *   nocache   {boolean}  Sets wether browser caching is prevented
     *   data      {string}   The data that is sent in the body of the message
     *   useXML    {boolean}  Specifying wether the result should be interpreted as XML
     *   autoroute {boolean}  Specifying wether the request can fallback to a server proxy
     *   useXSLT   {boolean}  Specifying wether the request should be transformed using an XSLT document
     *   caching   {boolean}  Sets wether the request should use internal caching
     */
    this.getString = 
    this.get       = function(url, callback, options, id){
        //#ifdef __WITH_OFFLINE
        if (!jpf.offline.isOnline) {
            if (jpf.offline.canTransact()) {
                //Let's record all the necesary information for future use (during sync)
                jpf.offline.transaction.add(Array.prototype.slice.call(arguments));
                
                return;
            }
            
            /* 
                Apparently we're doing an HTTP call even though we're offline
                I'm allowing it, because the developer seems to know more
                about it than I right now
            */
            
            //#ifdef __DEBUG
            jpf.issueWarning(0, "Executing HTTP request even though application is offline");
            //#endif
        }
        //#endif
        
        if(!options)
            options = {};
        
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
                var http = jpf.getObject("HTTP");
            
            id = this.queue.push({
                http     : http, 
                url      : url,
                callback : callback, 
                options  : options
            }) - 1;
            
            // #ifdef __WITH_HTTP_CACHE
            if (http.isCaching) {
                if (async) 
                    return setTimeout("jpf.lookup(" + this.uniqueId + ").receive("
                        + id + ");", 50);//Math.round(Math.random()*200));
                else 
                    return this.receive(id);
            }
            // #endif
        }
        else {
            var http = this.queue[id].http;

            // #ifdef __WITH_HTTP_CACHE
            if (http.isCaching) 
                http = jpf.getObject("HTTP");
            else 
            // #endif
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
        var srv = autoroute ? this.routeServer : url;
        
        // #ifdef __DEBUG
        jpf.debugMsg("<strong>Making request[" + id + "] to " + url + (autoroute ? "<br /><span style='color:green'>[via: " + srv + (nocache ? (srv.match(/(\.asp|\.aspx|\.ashx)$/) ? "/" : (srv.match(/\?/) ? "&" : "?")) + Math.random() : "") + "]</span>" : "") + "</strong> with data:<br />" + new String(data && data.xml ? data.xml : data).replace(/\&/g, "&amp;").replace(/</g, "&lt;") + "<hr />", "teleport");
        // #endif
        
        // #ifdef __STATUS
        jpf.status("[HTTP] Making request[" + id + "] url: " + url, "teleport");
        // #endif
        
        try {
            //if(srv.match(/(\.asp|\.aspx|\.ashx)$/)) nocache = false;
            http.open(this.protocol || options.method || "GET", srv + (options.nocache
                ? (srv.match(/\?/) ? "&" : "?") + Math.random()
                : ""), async);
            
            //OPERA ERROR's here... on retry
            http.setRequestHeader("User-Agent", "Javeline TelePort 1.0.0");
            http.setRequestHeader("Content-type", this.contentType
                || (this.useXML || options.useXML ? "text/xml" : "text/plain"));
            
            if (autoroute) {
                http.setRequestHeader("X-Route-Request", url);
                http.setRequestHeader("X-Proxy-Request", url);
                http.setRequestHeader("X-Compress-Response", "gzip");
            }
        }
        catch (e) {
            var useOtherXH = false;
            
            if (self.XMLHttpRequestUnSafe) {
                try {
                    http = new XMLHttpRequestUnSafe();
                    http.onreadystatechange = function(){
                        if (!_self.queue[id] || http.readyState != 4) 
                            return;

                        _self.receive(id);
                    }
                    http.open(this.protocol || "GET", srv + (options.nocache
                        ? (srv.match(/\?/) ? "&" : "?") + Math.random() 
                        : ""), async);

                    this.queue[id][0] = http;
                    options.async     = true; //force async
                    useOtherXH        = true;
                }
                catch (e) {}
            }
            
            // Retry request by routing it
            if (!useOtherXH && this.autoroute && !autoroute) {
                //#ifdef __SUPPORT_IE5
                if (!jpf.isNot(id)) {
                    clearInterval(this.queue[id].timer);
                }
                //#endif
                
                this.shouldAutoroute = true;
                
                options.autoroute = true;
                return this.get(url, receive, options, id);
            }
            
            if (!useOtherXH) {
                //Routing didn't work either... Throwing error
                var noClear = receive ? receive(null, __HTTP_ERROR__, {
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
        
        if (this.__HeaderHook) 
            this.__HeaderHook(http);
        
        //Set request headers
        if (options.headers) {
            for (var name in options.headers) {
                http.setRequestHeader(name, options.headers[name]);
            }
        }
        
        // #ifdef __DEBUG
        http.send(data);
        /* #else
         try{
             // Sending
             http.send(data);
         }catch(e){
             // Strange behaviour in IE causing errors in the callback to not be handled
             jpf.debugMsg("<strong>File or Resource not available " + arguments[0] + "</strong><hr />", "teleport");
             
             // File not found
             var noClear = receive ? receive(null, __RPC_ERROR__, {
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
        
        var qItem = this.queue[id];
        
        //#ifdef __SUPPORT_IE5
        clearInterval(qItem.timer);
        //#endif
        
        var data, message, http = qItem.http;
        
        // Test if HTTP object is ready
        try {
            if (http.status) {}
        } 
        catch (e) {
            return setTimeout('jpf.lookup(' + this.uniqueId + ').receive(' + id + ')', 10);
        }
        
        var from_url = qItem.url;
        var callback = qItem.callback;
        var retries  = qItem.retries;
        var useXSLT  = qItem.options.useXSLT;
        var useXML   = qItem.options.useXML;
        var userdata = qItem.options.userdata;
        
        // #ifdef __DEBUG
        jpf.debugMsg("<strong>Receiving [" + id + "]" + (http.isCaching ? "[<span style='color:orange'>cached</span>]" : "") + " from " + from_url + "<br /></strong>" + http.responseText.replace(/\&/g, "&amp;").replace(/\</g, "&lt;").replace(/\n/g, "<br />") + "<hr />", "teleport");
        // #endif
        
        // #ifdef __STATUS
        jpf.status("[HTTP] Receiving [" + id + "]" + (http.isCaching ? "[caching]" : "") + " from " + from_url, "teleport");
        // #endif
        
        try {
            var msg = "";
            
            // Check HTTP Status
            if (http.status != 200 && http.status != 0) {
                if (this.isRPC && this.checkPermissions
                  && this.checkPermissions(message, {
                    id      : id,
                    http    : http,
                    tpModule: this,
                    retries : retries
                }) === true) 
                    return;
                throw new Error(0, "HTTP error [" + id + "]:" + http.status + "\n" + http.responseText);
            }
            
            // Check for XML Errors
            if (useXML || this.useXML) {
                if (http.responseText.replace(/^[\s\n\r]+|[\s\n\r]+$/g, "") == "") 
                    throw new Error("Empty Document");
                
                msg = "Received invalid XML\n\n";
                //var lines = http.responseText.split("\n");
                //if(lines[22] && lines[22].match(/Cafco /)) lines[22] = "";
                //lines.join("\n")
                var xmlDoc = (http.responseXML && http.responseXML.documentElement)
                    ? jpf.xmlParseError(http.responseXML)
                    : jpf.getObject("XMLDOM", http.responseText);
                if (!jpf.supportNamespaces) 
                    xmlDoc.setProperty("SelectionLanguage", "XPath");
                var xmlNode = xmlDoc.documentElement;
            }
            
            // Get content
            var data = useXML || this.useXML ? xmlNode : http.responseText;
            
            // Check RPC specific Error messages
            if (this.isRPC) {
                msg = "RPC result did not validate: ";
                message = this.checkErrors(data, http, {
                    id      : id,
                    http    : http,
                    tpModule: this
                });
                if (this.checkPermissions && this.checkPermissions(message, {
                    id      : id,
                    http    : http,
                    tpModule: this,
                    retries : retries
                }) === true) 
                    return;
                data = this.unserialize(message);
            }
            
            //Use XSLT to transform xml node if needed
            if (useXML && useXSLT) {
                var xmlNode = data;
                this.getXml(useXSLT, function(data, state, extra){
                    if (state != __HTTP_SUCCESS__) {
                        if (state == __HTTP_TIMEOUT__ && extra.retries < jpf.maxHttpRetries) 
                            return extra.tpModule.retry(extra.id);
                        else {
                            extra.userdata.message = "Could not load XSLT from external resource :\n\n"
                                + extra.message;
                            extra.userdata.callback(data, state, extra.userdata);
                        }
                    }
                    
                    var result = xmlNode.transformNode(data);
                    
                    var noClear = extra.userdata.callback
                        ? extra.userdata.callback([result, xmlNode], __RPC_SUCCESS__, extra.userdata)
                        : false;
                    if (!noClear) 
                        extra.tpModule.queue[id] = null;
                }, true, {
                    callback: callback,
                    userdata: userdata,
                    http    : http,
                    url     : from_url,
                    tpModule: this,
                    id      : id,
                    retries : retries
                });
                
                return;
            }
        }
        catch (e) {
            // Send callback error state
            var noClear = callback ? callback(data, __RPC_ERROR__, {
                userdata: userdata,
                http    : http,
                url     : from_url,
                tpModule: this,
                id      : id,
                message : msg + e.message,
                retries : retries
            }) : false;
            if (!noClear) {
                http.abort();
                this.clearQueueItem(id);
            }
            
            return;
        }
        
        // #ifdef __WITH_HTTP_CACHE
        //Caching
        if (qItem.options.caching) {
            if (!this.cache[from_url]) 
                this.cache[from_url] = {};
            this.cache[from_url][qItem.options.data] = http.responseText;
        }
        //#endif
        
        var noClear = callback ? callback(data, __RPC_SUCCESS__, {
            userdata: userdata,
            http    : http,
            url     : from_url,
            tpModule: this,
            id      : id,
            retries : retries
        }) : false;
        if (!noClear) 
            this.clearQueueItem(id);
        
        return data;
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
            return setTimeout('HTTP.dotimeout(' + id + ')', 10);
        }
        
        var callback = qItem.callback;
        var useXML   = qItem.options.useXML;
        var userdata = qItem.options.userdata;
        
        http.abort();
        
        // #ifdef __DEBUG
        jpf.debugMsg("<strong>HTTP Timeout [" + id + "]<br /></strong><hr />", "teleport");
        // #endif
        
        // #ifdef __STATUS
        jpf.status("[HTTP] Timeout [" + id + "]", "teleport");
        // #endif
        
        var noClear = callback ? callback(null, __RPC_TIMEOUT__, {
            userdata: userdata,
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
    
    this.clearQueueItem = function(id){
        if (!this.queue[id]) 
            return false;
        
        //#ifdef __SUPPORT_IE5
        clearInterval(this.queue[id].timer);
        //#endif

        jpf.Teleport.releaseHTTP(this.queue[id].http);

        this.queue[id] = null;
        delete this.queue[id];
        
        return true;
    }
    
    this.retry = function(id){
        if (!this.queue[id]) 
            return false;
        
        //#ifdef __SUPPORT_IE5
        clearInterval(qItem.timer);
        //#endif
        
        var qItem = this.queue[id];
        
        // #ifdef __DEBUG
        jpf.debugMsg("<strong>Retrying request...<br /></strong><hr />", "teleport");
        // #endif
        
        // #ifdef __STATUS
        jpf.status("[HTTP] Retrying request [" + id + "]", "teleport");
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
                useXSLT : x.getAttribute("xslt"),
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
jpf.Init.run('HTTP');
