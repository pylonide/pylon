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

// #ifdef __TP_RPC_CGI
// #define __TP_RPC 1

/**
 * Implementation of the Common Gateway Interface (CGI) as a module for the RPC
 * plugin of jpf.teleport. 
 * Example:
 * Javeline Markup Language
 * <code>
 *  <j:teleport>
 *      <j:rpc id="comm" protocol="cgi">
 *          <j:method 
 *            name    = "searchProduct" 
 *            url     = "http://example.com/search.php" 
 *            receive = "processSearch">
 *              <j:variable name="search" />
 *              <j:variable name="page" />
 *              <j:variable name="textbanner" value="1" />
 *          </j:method>
 *          <j:method 
 *            name = "loadProduct" 
 *            url  = "http://example.com/show-product.php">
 *              <j:variable name="id" />
 *              <j:variable name="search_id" />
 *          </j:method>
 *      </j:rpc>
 *  </j:teleport>
 *
 *  <j:script>
 *      //This function is called when the search returns
 *      function processSearch(data, state, extra){
 *          alert(data)
 *      }
 *
 *      //Execute a search for the product car
 *      comm.searchProduct('car', 10);
 *  </j:script>
 * </code>
 *
 * @addenum rpc[@protocol]:cgi
 *
 * @constructor
 *
 * @inherits jpf.BaseComm
 * @inherits jpf.http
 * @inherits jpf.rpc
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 *
 * @default_private
 */
jpf.cgi = function(){
    this.supportMulticall = false;
    this.namedArguments   = true;
    
    // Register Communication Module
    jpf.teleport.register(this);
    
    // Stand Alone
    if (!this.uniqueId) {
        jpf.makeClass(this);
        this.inherit(jpf.BaseComm, jpf.http, jpf.rpc);
    }
    
    this.unserialize = function(str){
        return str;
    }
    
    this.getSingleCall = function(name, args, obj){
        obj.push(args);
    }
    
    // Create message to send
    this.serialize = function(functionName, args){
        var vars = [];
        
        function recur(o, stack){
            if (o && o.dataType == "array") {
                for (var j = 0; j < o.length; j++) 
                    recur(o[j], stack + "%5B" + j + "%5D");//" + j + "
            }
            else 
                if (typeof o == "object") {
                    for (prop in o) {
                        //#ifdef __SUPPORT_SAFARI2
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
                //#ifdef __SUPPORT_SAFARI2
                if (jpf.isSafariOld && (!args[prop] || typeof args[prop] == "function")) 
                    continue;
                //#endif
                
                recur(args[prop], prop);
            }
        }
        
        if (!this.baseUrl)
            this.baseUrl = this.url;
        
        this.url = this.urls[functionName]
            ? this.urls[functionName]
            : this.baseUrl;
        
        if (this.method != "GET")
            return vars.join("&");
        
        this.url = this.url + (vars.length 
            ? (this.url.indexOf("?") > -1 ? "&" : "?") + vars.join("&")
            : "");
        
        return "";
    }
    
    this.$load = function(x){
        this.method      = (x.getAttribute("http-method") || "GET").toUpperCase();
        this.contentType = this.method == "GET" 
            ? null
            : "application/x-www-form-urlencoded";

        if (x.getAttribute("method-name")) {
            var mName = x.getAttribute("method-name");
            var nodes = x.childNodes;
            
            for (var v, i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType != 1) 
                    continue;
                
                v = nodes[i].insertBefore(x.ownerDocument.createElement("variable"),
                    nodes[i].firstChild);
                v.setAttribute("name",  mName);
                v.setAttribute("value", nodes[i].getAttribute("name"));
            }
        }
    }
    
    /**
     * Submit a form with ajax (GET)
     *
     * @param {HTMLElement} form      the html form element to submit.
     * @param {Function} 	  callback  called when the http call returns.
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
}

// #ifdef __WITH_DATA_INSTRUCTIONS

jpf.datainstr["url"]        = 
jpf.datainstr["url.post"]   =
jpf.datainstr["url.delete"] =
jpf.datainstr["url.put"]    =
jpf.datainstr["url.get"]    = function(xmlContext, options, callback){
    if (!options.parsed) {
        var query = options.instrData.join(":").split("?");
        var url   = query.shift();
    
        //@todo change this parser to support {} and []
        query = query.join("?").replace(/\=(xpath|eval)\:([^\&]*)\&/g, 
          function(m, type, content){
            if (type == "xpath") {
                var o = xmlNode.selectSingleNode(RegExp.$1);
                var retvalue = o
                    ? (o.nodeType >= 2 && o.nodeType <= 4
                        ? o.nodeValue
                        : o.xml || o.serialize())
                    : ""
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
                    throw new Error(jpf.formatErrorString(0, null, 
                        "Saving/Loading data", "Could not execute javascript \
                        code in process instruction '" + content 
                        + "' with error " + e.message));
                    //#endif
                }
            }
            
            return "=" + retvalue + "&";
        });
    
        var args     = options.args;
        var httpBody = (args && args.length)
            ? (args[0].nodeType 
                ? args[0].xml || args[0].serialize() 
                : jpf.serialize(args[0]))
            : query;
    
        if (options.preparse) {
            options.parsed = [query, httpBody];
            options.preparse = false;
            return;
        }
    }
    else {
        var query    = options.parsed[0];
        var httpBody = options.parsed[1];
    }
    
    var oHttp = new jpf.http();
    oHttp.method = (options.instrType.replace(/url.?/, "") || "GET").toUpperCase();
    oHttp.get(url + (oHttp.method == "GET" ? "?" + query : ""), callback, 
        jpf.extend({data : httpBody}, options));
}

// #endif

// #endif