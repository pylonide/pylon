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

// #ifdef __TP_RPC_REST || __TP_RPC_GET
// #define __TP_RPC 1

/**
 * Implementation of the HTTP GET protocol (CGI).
 *
 * @classDescription		This class creates a new HTTP GET TelePort module.
 * @return {Get} Returns a new HTTP GET TelePort module.
 * @type {Get}
 * @constructor
 *
 * @addenum rpc[@protocol]:get
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.get = function(){
    this.supportMulticall = false;
    this.protocol         = "GET";
    this.vartype          = "cgi";
    this.isXML            = true;
    this.namedArguments   = true;
    
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
    
    this.getSingleCall = function(name, args, obj){
        //var args2={};for(var i = 0;i<args.length;i++)args2[args[i][0]]=args[i][1];
        obj.push(args);
    }
    
    // Create message to send
    this.serialize = function(functionName, args){
        if (justUseUrl) {
            this.URL = this.urls[functionName];
            return "";
        }
        
        var vars = [];
        
        function recur(o, stack){
            if (jpf.isArray(o)) {
                for (var j = 0; j < o.length; j++) 
                    recur(o[j], stack + "%5B%5D");//" + j + "
            }
            else 
                if (typeof o == "object") {
                    for (prop in o) {
                        //#ifdef __SUPPORT_Safari_Old
                        if (jpf.isSafariOld && (!o[prop] || typeof p[prop] != "object")) 
                            continue;
                        //#endif
                        
                        if (typeof o[prop] == "function") 
                            continue;
                        recur(o[prop], stack + "%5B" + encodeURIComponent(prop) + "%5D");
                    }
                }
                else 
                    vars.push(stack + "=" + encodeURIComponent(o));
        };
        
        if (this.multicall) {
            vars.push("func=" + this.mcallname);
            for (var i = 0; i < args[0].length; i++) 
                recur(args[0][i], "f%5B" + i + "%5D");
        }
        else {
            for (prop in args) {
                //#ifdef __SUPPORT_Safari_Old
                if (jpf.isSafariOld && (!args[prop] || typeof args[prop] == "function")) 
                    continue;
                //#endif
                
                recur(args[prop], prop);
            }
        }
        
        if (!this.BaseURL)
            this.BaseURL = this.URL;
        
        var nUrl = this.urls[functionName] ? this.urls[functionName] : this.BaseURL;
        this.URL = nUrl + (vars.length ? (nUrl.match(/\?/) ? "&" : "?")
            + vars.join("&") : "");
        
        return "";
    }
    
    // Check Received Data for errors
    this.checkErrors = function(data, http){
        return data;
    }
    
    this.__load = function(x){
        if (x.getAttribute("method-name")) {
            var mName = x.getAttribute("method-name");
            var nodes = x.childNodes;
            
            for (var i = 0; i < nodes.length; i++) {
                var y = nodes[i];
                var v = y.insertBefore(x.ownerDocument.createElement("variable"),
                    y.firstChild);
                v.setAttribute("name",  mName);
                v.setAttribute("value", y.getAttribute("name"));
            }
        }
    }
    
    /**
     * Submit a form with ajax (GET)
     *
     * @param form	 form
     * @param function callback  Called when http result is received
     */
    this.submitForm = function(form, callback){
        if (!this['postform']) 
            this.addMethod('postform', callback);
        
        var args = [];
        for (var i = 0; i < form.elements.length; i++) {
            if (!form.elements[i].name) 
                continue;
            if (form.elements[i].tagname = 'input'
              && (form.elements[i].type == 'checkbox'
              || form.elements[i].type == 'radio')
              && !form.elements[i].checked) 
                continue;
            
            if (form.elements[i].tagname = 'select' && form.elements[i].multiple) {
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
        
        var loc               = (form.action || location.href);
        this.urls['postform'] = loc + (loc.indexOf("?") > -1 ? "&" : "?") + args.join("&");
        this['postform'].call(this);
        
        return false;
    }
    
    var justUseUrl;
    this.callWithString = function(func, str, callback){
        this.setCallback(func, callback)
        var original_url = this.urls[func];
        
        justUseUrl = true;
        this.urls[func] = this.urls[func]
            + (this.urls[func].indexOf("?") > -1 ? "&" : "?") + str;
        this[func].call(this);
        
        justUseUrl      = false;
        this.urls[func] = original_url;
    }
}

// #ifdef __WITH_DSINSTR

jpf.datainstr["rest"] = 
jpf.datainstr["rest.post"] =
//jpf.datainstr["rest.delete"] =
//jpf.datainstr["rest.put"] =
jpf.datainstr["rest.get"] = 
jpf.datainstr["url"] = 
jpf.datainstr["url.post"] =
//jpf.datainstr["url.delete"] =
//jpf.datainstr["url.put"] =
jpf.datainstr["url.get"] = function(instrType, data, options, xmlContext, callback, multicall, userdata, arg, isGetRequest){
    var oPost = (instrType == "url.post") ? new jpf.post() : new jpf.get();

    //Need checks here
    var xmlNode = xmlContext;
    var x       = (instrType == "url.eval")
        ? eval(data.join(":")).split("?")
        : data.join(":").split("?");
    var url     = x.shift();
    
    var cgiData = x.join("?").replace(/\=(xpath|eval)\:([^\&]*)\&/g, function(m, type, content){
        if (type == "xpath") {
            var retvalue, o = xmlNode.selectSingleNode(RegExp.$1);
            if (!o)
                retvalue = "";
            else if(o.nodeType >= 2 && o.nodeType <= 4)
                retvalue = o.nodeValue;
            else
                retvalue = o.serialize ? o.serialize() : o.xml;
        }
        else if(type == "eval") {
            try {
                //Safely set options
                var retvalue = (function(){
                    //Please optimize this
                    if(options)
                        for(var prop in options)
                            eval("var " + prop + " = options[prop]");
                    
                    return eval(content);//RegExp.$1);
                })();
            }
            catch(e){
                //#ifdef __DEBUG
                throw new Error(0, jpf.formatErrorString(0, null, "Saving/Loading data", "Could not execute javascript code in process instruction '" + content + "' with error " + e.message));
                //#endif
            }
        }
        
        return "=" + retvalue + "&";
    });

    if (arg && arg.length) {
        var arg = arg[0];
        var pdata = arg.nodeType ? arg.xml || arg.serialize() : jpf.serialize(arg);
        url += "?" + cgiData;
    }
    else {
        //Get CGI vars
        var pdata = cgiData
    }
    
    //Add method and call it
    oPost.urls["saveData"] = url;
    oPost.addMethod("saveData", callback, null, true);
    oPost.callWithString("saveData", pdata, callback)
}

// #endif

// #endif