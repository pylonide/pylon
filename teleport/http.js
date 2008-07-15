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
    this.queue = [null];
    this.callbacks = {};
    this.cache = {};
    this.timeout = 10000; //default 10 seconds
    if (!this.uniqueId) 
        this.uniqueId = jpf.all.push(this) - 1;
    
    // Register Communication Module
    jpf.Teleport.register(this);
    
    if (!this.toString) {
        this.toString = function(){
            return "[Javeline TelePort Component : (HTTP)]";
        }
    }
    
    //#ifdef __WITH_DESKRUN
    this.saveCache = function(name, path){
        // #ifdef __DEBUG
        if (!self.JSON) 
            throw new Error(1079, jpf.formErrorMessage(1079, this, "HTTP save cache", "Could not find JSON library."));
        // #endif
        
        // #ifdef __DEBUG
        if (!me || !me.useDeskRun) 
            throw new Error(1080, jpf.formErrorMessage(1080, this, "HTTP save cache", "Could not find DeskRun."));
        // #endif
        
        // #ifdef __STATUS
        jpf.status("[HTTP] Loading HTTP Cache", "teleport");
        // #endif
        
        var strResult = new JSON().serialize("test", comm.cache);
        
        var fs = me.deskrun.fs();
        fs.createMount("croot", "c:/");
        fs.createFile("/croot/temp/" + name + ".txt").data = strResult;
    }
    //#endif
    
    this.loadCache = function(name){
        //#ifdef __WITH_DESKRUN
        if (self.me && me.useDeskRun) {
            var fs = me.deskrun.fs();
            fs.createMount("croot", "c:/");
            var strResult = fs.getChild("/croot/temp/" + name + ".txt").data;
        }
        else 
            //#endif
            var strResult = this.get(CWD + name + ".txt");
        
        // #ifdef __STATUS
        jpf.status("[HTTP] Loading HTTP Cache", "steleport");
        // #endif
        
        if (!strResult) 
            return false;
        
        eval("var data = " + strResult);
        this.cache = data.params;
        
        return true;
    }
    
    this.getXml = function(url, receive, async, userdata, nocache, data){
        return this.get(url, receive, !!async, userdata, nocache, data || "", true);
    }
    
    this.getString = function(url, receive, async, userdata, nocache, data){
        return this.get(url, receive, !!async, userdata, nocache, data || "");
    }
    
    this.get = function(url, receive, async, userdata, nocache, data, useXML, id, autoroute, useXSLT, caching){
        var tpModule = this;
        
        if (data) {
            this.protocol    = "POST";
            this.contentType = "application/x-www-form-urlencoded";
        }
        
        if (async === undefined) 
            async = true;
        //#ifdef __SUPPORT_Opera
        if (jpf.isOpera) 
            async = true; //opera doesnt support sync calls
        //#endif
        
        //#ifdef __SUPPORT_Safari
        if (jpf.isSafari) 
            url = jpf.html_entity_decode(url);
        //#endif
        
        if (jpf.isNot(id)) {
            // #ifdef __WITH_HTTPCACHING
            //Caching
            if (this.cache[url] && this.cache[url][data]) {
                var http = {
                    responseText: this.cache[url][data],
                    responseXML : {},
                    status      : 200,
                    isCaching   : true
                }
            }
            else 
                //#endif
                var http = jpf.getObject("HTTP");
            
            id = this.queue.push([http, receive, null, null, userdata, null, [
                    url, async, data, nocache, useXSLT, caching
                ], useXML, 0]) - 1;
            
            // #ifdef __WITH_HTTPCACHING
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
            var http = this.queue[id][0];
            // #ifdef __WITH_HTTPCACHING
            if (http.isCaching) 
                http = jpf.getObject("HTTP");
            else 
                // #endif
                http.abort();
        }
        
        if (async) {
            if (jpf.hasReadyStateBug) {
                this.queue[id][3] = new Date();
                this.queue[id][2] = function(){
                    var dt = new Date(new Date().getTime()
                        - tpModule.queue[id][3].getTime());
                    var diff = parseInt(dt.getSeconds() * 1000 + dt.getMilliseconds());
                    if (diff > tpModule.timeout) {
                        tpModule.dotimeout(id);
                        return
                    };
                    
                    if (tpModule.queue[id][0].readyState == 4) {
                        tpModule.queue[id][0].onreadystatechange = function(){};
                        tpModule.receive(id);
                    }
                };
                this.queue[id][5] = setInterval(function(){
                    tpModule.queue[id][2]()
                }, 20);
            }
            else {
                http.onreadystatechange = function(){
                    if (!tpModule.queue[id] || http.readyState != 4) 
                        return;
                    tpModule.receive(id);
                }
            }
        }
        
        if (!autoroute) 
            autoroute = this.shouldAutoroute;
        if (this.autoroute && jpf.isOpera) 
            autoroute = true; //Bug in opera
        var srv = autoroute ? this.routeServer : url;
        
        // #ifdef __DEBUG
        jpf.debugMsg("<strong>Making request[" + id + "] to " + url + (autoroute ? "<br /><span style='color:green'>[via: " + srv + (nocache ? (srv.match(/(\.asp|\.aspx|\.ashx)$/) ? "/" : (srv.match(/\?/) ? "&" : "?")) + Math.random() : "") + "]</span>" : "") + "</strong> with data:<br />" + new String(data && data.xml ? data.xml : data).replace(/\&/g, "&amp;").replace(/</g, "&lt;") + "<hr />", "teleport");
        // #endif
        
        // #ifdef __STATUS
        jpf.status("[HTTP] Making request[" + id + "] url: " + url, "teleport");
        // #endif
        
        try {
            //if(srv.match(/(\.asp|\.aspx|\.ashx)$/)) nocache = false;
            http.open(this.protocol || "GET", srv + (nocache
                ? (srv.match(/\?/) ? "&" : "?") + Math.random()
                : ""), async);
            
            //OPERA ERROR's here... on retry
            http.setRequestHeader("User-Agent", "Javeline TelePort 1.0.0");
            http.setRequestHeader("Content-type", this.contentType
                || (this.useXML || useXML ? "text/xml" : "text/plain"));
            
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
                        if (!tpModule.queue[id] || http.readyState != 4) 
                            return;
                        tpModule.receive(id);
                    }
                    http.open(this.protocol || "GET", srv + (nocache
                        ? (srv.match(/\?/) ? "&" : "?") + Math.random() 
                        : ""), async);

                    this.queue[id][0] = http;
                    async             = true; //force async
                    useOtherXH        = true;
                }
                catch (e) {}
            }
            
            // Retry request by routing it
            if (!useOtherXH && this.autoroute && !autoroute) {
                if (!jpf.isNot(id)) {
                    clearInterval(this.queue[id][5]);
                    //this.queue[id] = null;
                }
                this.shouldAutoroute = true;
                return this.get(url, receive, async, userdata, nocache, data,
                    useXML, id, true, useXSLT);
            }
            
            if (!useOtherXH) {
                //Routing didn't work either... Throwing error
                var noClear = receive ? receive(null, __RPC_ERROR__, {
                    userdata: userdata,
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
         userdata : userdata,
         http : http,
         url : url,
         tpModule : this,
         id : id,
         message : "---- Javeline Error ----\nMessage : File or Resource not available: " + arguments[0]
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
        
        clearInterval(this.queue[id][5]);
        
        var data, message;
        var http = this.queue[id][0];
        
        // Test if HTTP object is ready
        try {
            if (http.status) {}
        } 
        catch (e) {
            return setTimeout('jpf.lookup(' + this.uniqueId + ').receive(' + id + ')', 10);
        }
        
        var callback = this.queue[id][1];
        var useXML   = this.queue[id][7];
        var userdata = this.queue[id][4];
        var retries  = this.queue[id][8];
        
        var a        = this.queue[id][6];
        var from_url = a[0];
        var useXSLT  = a[4];
        
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
        
        // #ifdef __WITH_HTTPCACHING
        //Caching
        if (a[5]) {
            if (!this.cache[from_url]) 
                this.cache[from_url] = {};
            this.cache[from_url][a[2]] = http.responseText;
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
        
        clearInterval(this.queue[id][5]);
        var http = this.queue[id][0];
        
        // Test if HTTP object is ready
        try {
            if (http.status) {}
        } 
        catch (e) {
            return setTimeout('HTTP.dotimeout(' + id + ')', 10);
        }
        
        var callback = this.queue[id][1];
        var useXML   = this.queue[id][7];
        var userdata = this.queue[id][4];
        
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
            url     : this.queue[id][6][0],
            tpModule: this,
            id      : id,
            message : "HTTP Call timed out",
            retries : this.queue[id][8]
        }) : false;
        if (!noClear) 
            this.clearQueueItem(id);
    }
    
    this.clearQueueItem = function(id){
        if (!this.queue[id]) 
            return false;
        
        if (jpf.hasReadyStateBug) 
            clearInterval(this.queue[id][5]);

        jpf.Teleport.releaseHTTP(this.queue[id][0]);
        this.queue[id] = null;
        delete this.queue[id];
        
        return true;
    }
    
    this.retry = function(id){
        if (!this.queue[id]) 
            return false;
        
        clearInterval(this.queue[id][5]);
        var q = this.queue[id];
        var a = q[6];
        
        // #ifdef __DEBUG
        jpf.debugMsg("<strong>Retrying request...<br /></strong><hr />", "teleport");
        // #endif
        
        // #ifdef __STATUS
        jpf.status("[HTTP] Retrying request [" + id + "]", "teleport");
        // #endif
        
        q[8]++;
        this.get(a[0], q[1], a[1], q[4], a[3], a[2], q[7], id, null, null, a[5]);
        
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
                
                var useXML  = x.childNodes[i].getAttribute("type") == "XML";
                var url     = x.childNodes[i].getAttribute("url");
                var receive = x.childNodes[i].getAttribute("receive") || receive;
                var async   = x.childNodes[i].getAttribute("async") != "false";
                
                this[x.childNodes[i].getAttribute("name")] = function(data, userdata){
                    return this.get(url, self[receive], async, userdata, false, data, useXML);
                }
            }
        }
        
        this.instantiate = function(x){
            var url     = x.getAttribute("src");
            var useXSLT = x.getAttribute("xslt");
            var async   = x.getAttribute("async") != "false";
            
            this.getURL = function(data, userdata){
                return this.get(url, this.callbacks.getURL, async, userdata,
                    false, data, true, null, null, useXSLT);
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
