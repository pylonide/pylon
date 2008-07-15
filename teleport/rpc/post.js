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
// #ifdef __TP_RPC_POST
// #define __TP_RPC 1

/**
 * Implementation of the HTTP POST protocol (CGI).
 *
 * @classDescription		This class creates a new HTTP POST TelePort module.
 * @return {Post} Returns a new HTTP POST TelePort module.
 * @type {Post}
 * @constructor
 *
 * @addenum rpc[@protocol]:post
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.post = function(){
    this.supportMulticall = true;
    this.mcallname        = "multicall";
    this.multicall        = false;
    this.protocol         = "POST";
    this.vartype          = "cgi";
    this.isXML            = true;
    this.namedArguments   = true;
    this.contentType      = "application/x-www-form-urlencoded";
    
    // Register Communication Module
    jpf.Teleport.register(this);
    
    // Stand Alone
    if (!this.uniqueId) {
        jpf.makeClass(this);
        /**
         * @inherits jpf.BaseComm
         * @inherits jpf.http
         * @inherits jpf.rpc
         */
        this.inherit(jpf.BaseComm, jpf.http, jpf.rpc);
    }
    
    this.unserialize = function(str){
        return str;
    }
    
    this.__HeaderHook = function(http){};
    
    this.getSingleCall = function(name, args, obj){
        //var args2={};for(var i = 0;i<args.length;i++)args2[args[i][0]]=args[i][1];
        obj.push(args);
    }
    
    // Create message to send
    this.serialize = function(functionName, args){
        //functionName == 'postform' && 
        if (postVars) {
            var v    = postVars;
            postVars = null;
            this.URL = this.urls[functionName];
            return v;
        }
        
        var vars = [];
        
        function recur(o, stack){
            if (jpf.isArray(o)) {
                for (var j = 0; j < o.length; j++) 
                    recur(o[j], stack + "%5B" + j + "%5D");
            }
            else 
                if (typeof o == "object") {
                    for (prop in o) {
                        if (typeof o[prop] == "function") 
                            continue;
                        recur(o[prop], stack + "%5B" + encodeURIComponent(prop) + "%5D");
                    }
                } else 
                    vars.push(stack + "=" + encodeURIComponent(o));
        };
        
        if (this.multicall) {
            vars.push("func=" + this.mcallname);
            for (var i = 0; i < args[0].length; i++) 
                recur(args[0][i], "f%5B" + i + "%5D");
        }
        else {
            for (prop in args) 
                recur(args[prop], prop);
        }
        
        if (!this.BaseURL) 
            this.BaseURL = this.URL;
        this.URL = this.urls[functionName]
            ? this.urls[functionName]
            : this.BaseURL;
        
        return vars.join("&");
    }
    
    // Check Received Data for errors
    this.checkErrors = function(data, http){
        return data;
    }
    
    /**
     * @define rpc
     * @attribute method-name
     */
    this.__load = function(x){
        if (x.getAttribute("method-name")) {
            var mName = x.getAttribute("method-name");
            var nodes = x.childNodes;
            
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType != 1) 
                    continue;
                var y = nodes[i];
                var v = y.insertBefore(x.ownerDocument.createElement("variable"), y.firstChild);
                v.setAttribute("name",  mName);
                v.setAttribute("value", y.getAttribute("name"));
            }
        }
    }
    
    /**
     * Submit a form with ajax (POST)
     *
     * @param form	 form
     * @param function callback  Called when http result is received
     */
    var postVars;
    this.submitForm = function(form, callback){
        if (!this['postform']) 
            this.addMethod('postform', callback);
        
        var args = [];
        for (var i = 0; i < form.elements.length; i++) {
            if (!form.elements[i].name) 
                continue;
            if (form.elements[i].tagName = 'input' && (form.elements[i].type == 'checkbox' || form.elements[i].type == 'radio') && !form.elements[i].checked) 
                continue;
            
            if (form.elements[i].tagName = 'select' && form.elements[i].multiple) {
                for (j = 0; j < form.elements[i].options.length; j++) {
                    if (form.elements[i].options[j].selected) 
                        args.push(form.elements[i].name + "="
                            + encodeURIComponent(form.elements[i].options[j].value));
                }
            }
            else {
                args.push(form.elements[i].name + "="
                    + encodeURIComponent(form.elements[i].value));
            }
        }
        
        this.urls['postform'] = form.action || location.href;
        postVars              = args.join("&");
        this['postform'].call(this);
        
        return false;
    }
    
    this.callWithString = function(func, str, callback){
        //this.urls[func] = url;
        this.setCallback(func, callback)
        postVars = str;
        this[func].call(this);
    }
}

// #endif
