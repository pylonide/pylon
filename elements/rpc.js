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

/**
 * Baseclass for rpc in teleport. Modules are available for
 * SOAP, XML-RPC, CGI, JSON-RPC and several proprietary protocols.
 *
 * Example:
 * Ajax.org Markup Language
 * <code>
 *  <a:rpc id="comm" 
 *    protocol    = "soap" 
 *    url         = "http://example.com/show-product.php" 
 *    soap-prefix = "m" 
 *    soap-xmlns  = "http://example.com">
 *      <a:method 
 *        name    = "searchProduct" 
 *        receive = "processSearch">
 *          <a:param name="search" />
 *          <a:param name="page" />
 *          <a:param name="textbanner" value="1" />
 *      </a:method>
 *      <a:method 
 *        name = "loadProduct">
 *          <a:param name="id" />
 *          <a:param name="search_id" />
 *      </a:method>
 *  </a:rpc>
 *
 *  <a:script>
 *      //This function is called when the search returns
 *      function processSearch(data, state, extra){
 *          alert(data)
 *      }
 *
 *      //Execute a search for the product car
 *      comm.searchProduct('car', 10);
 *  </a:script>
 * </code>
 *
 * Example:
 * This example shows an rpc element using the xmlrpc protocol. It contains
 * two methods which can be called. The return of the first method is handled
 * by a javascript function called processSearch.
 * <code>
 *  <a:rpc 
 *    id       = "flickr" 
 *    protocol = "xmlrpc" 
 *    url      = "http://www.flickr.com/services/xmlrpc/"> 
 *      <a:method 
 *        name        = "search" 
 *        receive     = "flickrResult" 
 *        method-name = "flickr.photos.search" />
 *  </a:rpc>
 *  
 *  <a:script>//<!-- 
 *      //This function is called when the search returns
 *      function flickrResult(data, state, extra) {
 *          alert(data)
 *      };
 *      
 *      //Execute a search for the flowers keyword
 *      flickr.search({
 *          api_key  : '5ab84bdb606e86015a15a45ffe8d022b',
 *          text     : "flowers", 
 *          per_page : 4, 
 *          page     : 1
 *      });
 *  //--></a:script>
 * </code>
 *
 * Example:
 * Ajax.org Markup Language
 * <code>
 *  <a:rpc id="comm" protocol="cgi">
 *      <a:method
 *        name    = "searchProduct"
 *        url     = "http://localhost/search.php"
 *        receive = "processSearch">
 *          <a:param name="search" />
 *          <a:param name="page" />
 *          <a:param name="textbanner" value="1" />
 *      </a:method>
 *  </a:rpc>
 *  
 *  <a:script>
 *      //This function is called when the search returns
 *      function processSearch(data, state, extra){
 *         alert(data)
 *      }
 *  
 *      //Execute a search for the product car
 *      comm.searchProduct('car', 10);
 *  </a:script>
 * </code>
 *
 * Example:
 * Ajax.org Markup Language
 * <code>
 *  <a:rpc id="comm" protocol="jsonrpc">
 *      <a:method 
 *        name    = "searchProduct" 
 *        receive = "processSearch">
 *          <a:param name="search" />
 *          <a:param name="page" />
 *          <a:param name="textbanner" value="1" />
 *      </a:method>
 *      <a:method 
 *        name = "loadProduct">
 *          <a:param name="id" />
 *          <a:param name="search_id" />
 *      </a:method>
 *  </a:rpc>
 *
 *  <a:script>
 *      //This function is called when the search returns
 *      function processSearch(data, state, extra){
 *          alert(data)
 *      }
 *
 *      //Execute a search for the product car
 *      comm.searchProduct('car', 10);
 *  </a:script>
 * </code>
 *
 * Example:
 * Ajax.org Markup Language
 * <code>
 *  <a:rpc id="comm" protocol="cgi">
 *      <a:method
 *        name    = "searchProduct"
 *        url     = "http://example.com/search.php"
 *        receive = "processSearch">
 *          <a:param name="search" />
 *          <a:param name="page" />
 *          <a:param name="textbanner" value="1" />
 *      </a:method>
 *      <a:method
 *        name = "loadProduct"
 *        url  = "http://example.com/show-product.php">
 *          <a:param name="id" />
 *          <a:param name="search_id" />
 *      </a:method>
 *  </a:rpc>
 *
 *  <a:script>
 *      //This function is called when the search returns
 *      function processSearch(data, state, extra){
 *          alert(data)
 *      }
 *
 *      //Execute a search for the product car
 *      comm.searchProduct('car', 10);
 *  </a:script>
 * </code>
 *
 * Example:
 * Ajax.org Markup Language
 * <code>
 *  <a:rpc id="comm" protocol="jsonrpc">
 *      <a:method 
 *        name    = "searchProduct" 
 *        receive = "processSearch">
 *          <a:param name="search" />
 *          <a:param name="page" />
 *          <a:param name="textbanner" value="1" />
 *      </a:method>
 *      <a:method 
 *        name = "loadProduct">
 *          <a:param name="id" />
 *          <a:param name="search_id" />
 *      </a:method>
 *  </a:rpc>
 *
 *  <a:script>
 *      //This function is called when the search returns
 *      function processSearch(data, state, extra){
 *          alert(data)
 *      }
 *
 *      //Execute a search for the product car
 *      comm.searchProduct('car', 10);
 *  </a:script>
 * </code>
 *
 * @attribute {String}  protocol         the name of the plugin that is used
 *                                       to provide the messages.
 * @attribute {Boolean} [multicall]      whether the call is stacked until
 *                                       purge() is called.
 * @attribute {String}  [route-server]   the location of the proxy script that 
 *                                       allows for cross domain communication.
 * @attribute {String}  [http-method]    the http method used to send the data.
 *                                       This attribute is only used by the cgi protocol.
 *   Possible values:
 *   post   Used to store large chunks of data (on a resource).
 *   get    Used to retrieve data from a resource.
 *   delete Used to delete a resource.
 *   head   Returns only the headers.
 *   put    Used to store data at a resource.
 * @attribute {String}  [method-name]    the variable name used to sent the
 *                                       name of the method called to the
 *                                       server. This attribute is only used
 *                                       by the cgi protocol.
 * @attribute {String}  [soap-xmlns]     the url that uniquely identifies the
 *                                       xml namespace for the message. This
 *                                       attribute is only used by the soap
 *                                       protocol.
 * @attribute {String}  [soap-prefix]    the prefix that is paired with the
 *                                       message xml namespace. This attribute
 *                                       is only used by the soap protocol.
 * @define rpc
 * @allowchild method
 *
 * @constructor
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @author      Mike de Boer (mike AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 * @default_private
 */
apf.rpc = function(struct, tagName){
    this.$init(tagName || "rpc", apf.NODE_HIDDEN, struct);

    if (!this.supportMulticall)
        this.multicall = false;
    this.stack    = {};
    this.urls     = {};
    this.$methods = {};
};

(function(){
    this.useHTTP         = true;
    this.namedArguments  = false;

    this["route-server"] = apf.host + "/cgi-bin/rpcproxy.cgi";
    this.autoroute       = false;

    this.$auth           = false;

    this.$booleanProperties["multicall"] = true;

    this.$supportedProperties.push("protocol", "type", "multicall", "http-method");

    this.$propHandlers["route-server"] = function(value){
        this.autoroute = value ? true : false;
    };

    //@todo change this to use prototype
    this.$propHandlers["protocol"] = function(value){
        if (!value)
            return;
        
        if (!apf[value]) {
            //#ifdef __DEBUG
            throw new Error(apf.formatErrorString(1025, null, "Teleport baseclass",
                "Could not find Ajax.org Teleport RPC Component '" + value + "'", this));
            //#endif
            return;
        }
        var _self = this;
        // use a timeout, so that these protocols may override default methods
        // inherited from http.js and the like.
        $setTimeout(function() {_self.implement(apf[value]);})
    };

    this.$propHandlers["type"] = function(value) {
        this.$useXml = (typeof value == "string" && value.toUpperCase() == "XML");
    };

    /**
     * Sets the callback for a method on this object.
     * Example:
     * <code>
     *  comm.setCallback("login", function(data, state, extra) {
     *      alert(data);
     *  });
     *
     *  comm.login(user, pass);
     * </code>
     * @param {String}   name the name of the method defined on this object.
     * @param {Function} func the function that is called when the rpc method returns.
     */
    this.setCallback = function(name, func){
        // #ifdef __DEBUG
        if (!this.$methods[name])
            throw new Error(apf.formatErrorString(0, this, "Teleport RPC",
                "Trying to set callback: method not found."));
        // #endif
            
        this.$methods[name].callback = func;
    };

    /**
     * Sets the target url for a method on this object.
     * Example:
     * <code>
     *  comm.setCallback("login", "scripts/login.php");
     *
     *  comm.login(user, pass);
     * </code>
     * @param {String} name the name of the method defined on this object.
     * @param {String} url  the target url of method defined on this object.
     */
    this.setUrl = function(name, url) {
        // #ifdef __DEBUG
        if (!this.$methods[name])
            throw new Error(apf.formatErrorString(0, this, "Teleport RPC",
                "Trying to set callback: method not found."));
        // #endif

        this.$methods[name].setProperty("url", url);
    };

    this.$convertArgs = function(name, args){
        if (!this.namedArguments)
            return Array.prototype.slice.call(args);

        var nodes = this.$methods[name].names;
        if (!nodes || !nodes.length)
            return {};

        var value, j, i, l, result = {};
        for (j = 0, i = 0, l = nodes.length; i < l; i++) {
            name  = nodes[i].name;
            value = nodes[i].value;

            if (value) {
                value = apf.parseExpression(value);
            }
            else {
                value = args[j++];

                if (apf.isNot(value) && nodes[i]["default"])
                    value = apf.parseExpression(nodes[i]["default"]);
            }

            //Encode string optionally
            value = apf.isTrue(nodes[i].encoded)
                ? encodeURIComponent(value)
                : value;

            result[name] = value;
        }

        return result;
    };

    function getCallback(node) {
        var p, f;
        if (typeof node.callback == "string") {
            // support objects and namespaced functions
            p = node.callback.split("."),
            f = self[p.shift()];
            while (f && p.length)
                f = f[p.shift()];
        }
        else {
            f = node.callback;
        }
        return f || apf.K;
    }

    this.call = function(name, args, options){
        var callback,
            node = this.$methods[name];
        
        if (typeof args[args.length - 1] == "function") {
            args     = Array.prototype.slice.call(args); //@todo optimize?
            callback = args.pop();
        }
        else {
            callback = getCallback(node);
        }

        args = this.$convertArgs(name, args);

        // Set up multicall
        if (this.multicall) {
            if (!this.stack[this.url])
                this.stack[this.url] = this.getMulticallObject
                    ? this.getMulticallObject()
                    : [];

            this.getSingleCall(name, args, this.stack[this.url])
            return true;
        }

        // Get Data
        var _self = this,
            data  = options && options.message
                ? options.message
                : this.createMessage(node["method-name"] || name, args); //function of module

        function pCallback(data, state, extra){
            extra.data = data;

            if (state != apf.SUCCESS)
                callback.call(_self, null, state, extra);
            else if (_self.isValid && !_self.isValid(extra))
                callback.call(_self, null, apf.ERROR, extra);
            else
                callback.call(_self, _self.unserialize(extra.data), state, extra);
        }

        // Send the request
        var auth,
            url  = apf.getAbsolutePath(this.baseurl || apf.config.baseurl, this.url),
            o    = apf.extend({
                callback      : pCallback,
                async         : node.async,
                userdata      : node.userdata,
                nocache       : (this.nocache === false) ? false : true,
                data          : data,
                useXML        : this.$useXml || node.type == "xml",
                caching       : node.caching,
                ignoreOffline : node["ignore-offline"]
            }, options);

        //#ifdef __WITH_AUTH
        //@todo this shouldn't be in here
        if (node.auth && this.$auth) {
            if (auth = this.$auth.$credentials) {
                o.username = auth.username;
                o.password = auth.password;
            }
            else {
                return this.$auth.authRequired(function() {
                    auth = _self.$auth.$credentials
                    o.username = auth.username;
                    o.password = auth.password;
                    _self.$get(url, o);
                });
            }
        }
        //#endif

        return this.$get(url, o);
    };

    /**
     * Purge multicalled requests
     */
    this.purge = function(callback, userdata, async, extradata){
        //#ifdef __DEBUG
        if (!this.stack[this.url] || !this.stack[this.url].length) {
            throw new Error(apf.formatErrorString(0, null, "Executing a multicall", 
                "No RPC calls where executed before calling purge()."));
        }
        //#endif

        // Get Data
        var data = this.createMessage("multicall", [this.stack[this.url]]), //function of module
            url  = apf.getAbsolutePath(this.baseurl || apf.config.baseurl, this.url);
        if (extradata) {
            for (var vars = [], i = 0; i < extradata.length; i++) {
                vars.push(encodeURIComponent(extradata[i][0]) + "="
                    + encodeURIComponent(extradata[i][1] || ""))
            }
            url = url + (url.match(/\?/) ? "&" : "?") + vars.join("&");
        }

        var info = this.$get(url, {
            callback : callback,
            async    : async,
            userdata : userdata,
            nocache  : true,
            data     : data,
            useXML   : this.$useXml
        });

        this.stack[this.url] = this.getMulticallObject
            ? this.getMulticallObject()
            : [];

        //return info[1];
    };

    this.revert = function(modConst){
        this.stack[modConst.url] = this.getMulticallObject
            ? this.getMulticallObject()
            : [];
    };

    this.getStackLength = function(){
        return this.stack[this.url] ? this.stack[this.url].length : 0;
    };

    /**
     * Loads aml definition
     */
    this.$addMethod = function(amlNode){
        if (amlNode.localName != "method"){
            // #ifdef __DEBUG
            throw new Error(apf.formatErrorString(0, this,
                "Parsing RPC Teleport node",
                "Found element which is not a method", this));
            // #endif
            return false;
        }
        
        var name = amlNode.name,
            cb   = amlNode.receive || this.receive,
            i    = 0,
            l    = amlNode.childNodes.length,
            node;

        this[name] = function(){
            return this.call(name, arguments);
        };

        if (cb)
            amlNode.callback = cb;

        this.$methods[name] = amlNode;

        if (!amlNode.names)
            amlNode.names = [];
        for (; i < l; i++) {
            node = amlNode.childNodes[i];
            if (node.localName == "param" || node.localName == "variable") //@todo deprecate variable
                amlNode.names.push(node);
        }

        return true;
    };

    this.$removeMethod = function(amlNode) {
        var name = amlNode.name;
        delete this[name];
        delete this.$methods[name];
    };

    this.$setAuth = function(amlNode) {
        this.$auth = amlNode;
    };

    /*
    this.addEventListener("DOMNodeInserted", function(e){
        var node = e.currentTarget;
        if (node.parentNode != this)
            return;

        this.register(node);
    });

    this.addEventListener("DOMNodeRemoved", function(e){
        var node = e.currentTarget;
        // we support two levels deep:
        if (!(node.parentNode == this || node.parentNode.parentNode == this))
            return;

        this.unregister(node);
    });*/
    
    // #ifdef __WITH_DATA
    this.exec = function(method, args, callback, options){
        if (!options) options = {};

        //force multicall if needed;
        if (options.multicall)
            this.forceMulticall = true;
    
        //Set information later neeed
        //#ifdef __DEBUG
        if (!this[method])
            throw new Error(apf.formatErrorString(0, null, "Saving/Loading data",
                "Could not find RPC function by name '" + method + "' in data "
              + "instruction '" + options.instruction + "'"));
        //#endif
        
        var props = this.$methods[method];

        if (options.userdata)
            props.userdata = options.userdata;
    
        if (!this.multicall)
            props.callback = callback; //&& this[method].async
    
        //Call method
        var retvalue = this.call(method, args, options);
    
        if (this.multicall)
            return this.purge(callback, "&@^%!@"); //Warning!! @todo Make multicall work with offline
        else if (options.multicall) {
            this.forceMulticall = false;
            return this;
        }
    
        //#ifdef __WITH_OFFLINE
        if (typeof apf.offline != "undefined" && !apf.offline.onLine)
            return;
        //#endif
    
        //Call callback for sync calls
        if (!this.multicall && !props.async && callback)
            callback(retvalue, apf.SUCCESS, {tpModule: this});
    };
    // #endif

    /*
     * Post a form with ajax
     *
     * @param form     form
     * @param function callback  Called when http result is received
     * /
     this.submitForm = function(form, callback, callName) {
         this.addMethod('postform', callback);
         this.urls['postform'] = form.action;
         var args = [];
         for (var i = 0; i < form.elements.length; i++) {
             var name = form.elements[i].name.split("[");
             for(var j = 0; j < name.length; j++) {
                 //Hmm problem with sequence of names... have to get that from the variable sequence...
             }
             args[] = form.elements[i].value;
         }

         this['postform'].apply(this, args);
     };
     */
}).call(apf.rpc.prototype = new apf.Teleport());

apf.config.$inheritProperties["baseurl"] = 1;

apf.aml.setElement("rpc", apf.rpc);

// #endif
