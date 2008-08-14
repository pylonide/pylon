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
// #ifdef __TP_RPC
// #define __WITH_TELEPORT 1

/**
 * Baseclass for any RPC protocol. Modules are available for
 * SOAP, XML-RPC, JSON-RPC and several proprietary protocols.
 *
 * @classDescription		This class creates a new Rpc object
 * @return {Rpc} Returns a new Rpc object
 * @type {Rpc}
 * @constructor
 * @baseclass
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.rpc = function(){
    if (!this.supportMulticall) 
        this.multicall = false;
    
    this.stack   = {};
    this.globals = [];
    this.names   = {};
    this.urls    = {};
    
    this.isRPC   = true;
    this.useHTTP = true;
    this.TelePortModule = true;
    
    this.routeServer = jpf.host + "/cgi-bin/rpcproxy.cgi";
    this.autoroute   = false;
    
    this.namedArguments = false;
    this.tagName        = "RPC";
    
    /* ADD METHODS */
    
    this.addMethod = function(name, receive, names, async, vexport, is_global, global_name, global_lookup, caching){
        if (is_global) 
            this.callbacks[name] = new Function('data', 'status', 'extra', 'jpf.lookup('
                + this.uniqueId + ').setGlobalVar("' + global_name + '"'
                + ', data, extra.http, "' + global_lookup + '", "' + receive
                + '", extra, status)');
        else 
            if (receive) 
                this.callbacks[name] = receive;
        
        this.setName(name, names);
        if (vexport) 
            this.vexport = vexport;
        this[name] = new Function('return this.call("' + name + '"' 
            + ', this.fArgs(arguments, this.names["' + name + '"], '
            + (this.vartype != "cgi" && this.vexport == "cgi") + '));');
        this[name].async   = async;
        this[name].caching = caching;
        
        return true;
    }
    
    this.setName = function(name, names){
        this.names[name] = names;
    }
    
    this.setCallback = function(name, func){
        this.callbacks[name] = func;
    }
    
    this.fArgs = function(a, nodes, no_globals){
        var args = this.namedArguments ? {} : [];
        if (!no_globals) 
            for (var i = 0; i < this.globals.length; i++) 
                args[this.globals[i][0]] = this.globals[i][1];
        
        if (this.namedArguments) {
            if (!nodes || nodes && !nodes.length) 
                return args;
            //throw new Error(0, jpf.formatErrorString(0, this, "Calling RPC method", "Cannot set argument(s) which are not defined"));
            
            for (var value, j = 0, i = 0; i < nodes.length; i++) {
                // Determine value
                var name = nodes[i].getAttribute("name");
                if (nodes[i].getAttribute("value")) 
                    value = nodes[i].getAttribute("value");
                else 
                    if (nodes[i].getAttribute("method")) 
                        value = self[nodes[i].getAttribute("method")](args);
                    else {
                        //Fugly Rik Hack				
                        if (a.length == 1 && typeof a[0] == 'object'
                          && !jpf.isNull(a[0])) {
                            //typeof(a[0][name]) != "undefined";
                            value = a[0][name];
                        }
                        else {
                            value = a[j];
                            j++;
                        }
                        if (jpf.isNot(value)) 
                            value = nodes[i].getAttribute("default");
                    }
                
                //Encode string optionally
                value = nodes[i].getAttribute("encoded") == "true"
                    ? encodeURIComponent(value)
                    : value;
                
                //Set arguments
                this.namedArguments ? (args[name] = value) : (args.push(value)); //isn't this only called for namedArguments = true (should)
            }
        }
        else 
            for (var i = 0; i < a.length; i++) 
                args.push(a[i]);
        
        return args;
    }
    
    /* GLOBALS */
    
    this.setGlobalVar = function(name, data, http, lookup, receive, extra, status){
        if (status != __RPC_SUCCESS__) {
            // #ifdef __DEBUG
            jpf.debugMsg("Could not get Global Variable<br />", "teleport");
            // #endif
            
            if (receive) 
                self[receive](data, status, extra);
            return;
        }
        
        if (this.vartype == "header" && lookup && http) 
            data = http.getResponseHeader(lookup);
        if (lookup.split("\:", 2)[0] == "xpath") {
            try {
                var doc = jpf.getObject("XMLDOM", data).documentElement;
            }
            catch (e) {
                throw new Error(1083, jpf.formatErrorString(1083, null, "Receiving global", "Returned value is not XML (for global variable lookup with name '" + name + "')"));
            }
            
            var data = jpf.getXmlValue(doc, lookup.split("\:", 2)[1]);
        }
        
        for (var found = false, i = 0; i < this.globals.length; i++) {
            if (this.globals[i][0] == name) {
                this.globals[i][1] = data;
                found = true;
            }
        }
        if (!found) 
            this.globals.push([name, data]);
        
        if (receive) 
            self[receive](data, __RPC_SUCCESS__, extra);
    }
    
    /* CALL */
    
    this.call = function(name, args){
        if (this.workOffline) 
            return;
        
        if (this.oncall) 
            this.oncall(name, args);
        
        var receive = typeof this.callbacks[name] == "string"
            ? self[this.callbacks[name]]
            : this.callbacks[name];
        if (!receive) 
            receive = function(){};
        // #ifdef __DEBUG
        //if(!receive){throw new Error(1602, "---- Javeline Error ----\nProcess :  RPC Send\nMessage : Callback method is not declared: '" + this.callbacks[name] + "'")}
        // #endif
        
        // Set up multicall
        if (this.multicall) {
            if (!this.stack[this.URL]) 
                this.stack[this.URL] = this.getMulticallObject ? this.getMulticallObject() : new Array();
            //this.stack[this.URL].push();
            this.getSingleCall(name, args, this.stack[this.URL])
            return true;
        }
        
        // Get Data
        var data = this.serialize(name, args); //function of module
        // Sent the request
        var info = this.get(this.URL, receive, this[name].async,
            this[name].userdata, true, data, false, null, null, null,
            this[name].caching);
        
        return info;
    }
    
    /* PURGE MULTICALL */
    
    this.purge = function(receive, userdata, async, extradata){
        //#ifdef __DEBUG
        if (!this.stack[this.URL] || !this.stack[this.URL].length) 
            throw new Error(0, jpf.formatErrorString(0, null, "Executing a multicall", "No RPC calls where executed before calling purge()."));
        //#endif
        
        // Get Data
        var data = this.serialize("multicall", [this.stack[this.URL]]); //function of module
        var url = this.URL;
        if (extradata) {
            for (var vars = [], i = 0; i < extradata.length; i++) {
                vars.push(encodeURIComponent(extradata[i][0]) + "="
                    + encodeURIComponent(extradata[i][1] || ""))
            }
            url = url + (url.match(/\?/) ? "&" : "?") + vars.join("&");
        }
        
        info = this.get(url, receive, async, userdata, true, data, false);
        this.stack[this.URL] = this.getMulticallObject ? this.getMulticallObject() : [];
        
        //return info[1];
    }
    
    this.revert = function(modConst){
        this.stack[modConst.URL] = this.getMulticallObject
            ? this.getMulticallObject()
            : [];
    }
    
    this.getStackLength = function(){
        return this.stack[this.URL] ? this.stack[this.URL].length : 0;
    }
    
    /**
     * Load XML Definitions
     *
     * @allowchild  method
     * @attribute {String} url
     * @attribute {String} url-eval
     * @attribute {String} protocol
     * @attribute {Boolean} multicall
     * @attribute {Integer} timeout
     * @attribute {Boolean} autoroute
     * @attribute {Boolean} offline
     * @attribute {Boolean} async
     * @attribute {String} export
     * @attribute {String} type
     * @attribute {String} variable
     * @attribute {String} lookup
     * @attribute {Boolean} caching
     * @define method
     * @allowchild  variable
     * @attribute name
     * @attribute url
     * @attribute receive
     * @define variable
     * @attribute name
     * @attribute value
     * @attribute default
     */
    this.load = function(x){
        this.jml         = x;
        this.timeout     = parseInt(x.getAttribute("timeout")) || this.timeout;
        this.URL         = x.getAttribute("urleval") ? eval(x.getAttribute("urleval")) : x.getAttribute("url");
        if (this.URL) 
            this.server = this.URL.replace(/^(.*\/\/[^\/]*)\/.*$/, "$1") + "/";
        this.multicall   = x.getAttribute("multicall") == "true";
        this.autoroute   = x.getAttribute("autoroute") == "true";
        this.workOffline = x.getAttribute("offline") == "true";
        
        if (this.__load) 
            this.__load(x);
        
        var q = x.childNodes;
        for (var url, i = 0; i < q.length; i++) {
            if (q[i].nodeType != 1) 
                continue;
            
            if (q[i].tagName == "global") {
                this.globals.push([q[i].getAttribute("name"),
                    q[i].getAttribute("value")]);
                continue;
            }
            
            //var nodes = $xmlns(q[i], "variable", jpf.ns.jpf);
            var nodes = q[i].getElementsByTagName("*");
            
            url = q[i].getAttribute("urleval")
                ? eval(q[i].getAttribute("urleval"))
                : q[i].getAttribute("url");
            if (url) 
                this.urls[q[i].getAttribute("name")] = url;
            
            //Add Method
            this.addMethod(q[i].getAttribute("name"),
                q[i].getAttribute("receive") || x.getAttribute("receive"), nodes,
                (q[i].getAttribute("async") == "false" ? false : true),
                q[i].getAttribute("export"),
                q[i].getAttribute("type") == "global",
                q[i].getAttribute("variable"), q[i].getAttribute("lookup"),
                q[i].getAttribute("caching") == "true");
        }
    }
    
    /**
     * Post a form with ajax
     *
     * @param form     form
     * @param function callback  Called when http result is received
     this.submitForm = function(form, callback, callName) {
     this.addMethod('postform', callback);
     this.urls['postform'] = form.action;
     var args = [];
     for (var i=0; i < form.elements.length; i++) {
     var name = form.elements[i].name.split("[");
     for(var j=0;j<name.length;j++){
     //Hmm problem with sequence of names... have to get that from the variable sequence...
     }
     args[] = form.elements[i].value;
     }
     
     this['postform'].apply(this, args);
     }*/
}
// #endif
