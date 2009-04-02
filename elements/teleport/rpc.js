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
 * Baseclass for rpc in teleport. Modules are available for
 * SOAP, XML-RPC, CGI, JSON-RPC and several proprietary protocols.
 * Example:
 * This example shows an rpc element using the xmlrpc protocol. It contains
 * two methods which can be called. The return of the first method is handled
 * by a javascript function called processSearch.
 * <pre class="code">
 *  <j:teleport>
 *      <j:rpc id="comm" protocol="xmlrpc">
 *          <j:method
 *            name    = "searchProduct"
 *            receive = "processSearch" />
 *          <j:method
 *            name = "loadProduct" />
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
 * </pre>
 *
 * @define rpc
 * @attribute {String} soap-xmlns   the url that uniquely identifies the xml namespace for the message
 * @attribute {String} soap-prefix  the prefix that is paired with the message xml namespace
 * @addnode teleport
 * @allowchild method
 *
 * @constructor
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 * @default_private
 */
jpf.rpc = function(){
    if (!this.supportMulticall)
        this.multicall = false;

    this.stack   = {};
    this.urls    = {};
    this.tagName = "rpc";
    this.useHTTP = true;

    this.TelePortModule = true;
    this.routeServer    = jpf.host + "/cgi-bin/rpcproxy.cgi";
    this.autoroute      = false;
    this.namedArguments = false;

    var _self = this;

    this.addMethod = function(name, callback, names, async, caching, ignoreOffline){
        this[name] = function(){
            return this.call(name, arguments);
        }

        this[name].async         = async;
        this[name].caching       = caching;
        this[name].names         = names;
        this[name].ignoreOffline = ignoreOffline;

        if (callback)
            this[name].callback = callback;

        return true;
    }

    this.setCallback = function(name, func){
        this[name].callback = func;
    }

    this.$convertArgs = function(name, args){
        if (!this.namedArguments)
            return args.slice();

        var nodes = this[name].names;
        if (!nodes || !nodes.length)
            return {};

        var name, value, result = {};
        for (var j = 0, i = 0; i < nodes.length; i++) {
            name = nodes[i].getAttribute("name");

            if (nodes[i].getAttribute("value"))
                value = jpf.parseExpression(nodes[i].getAttribute("value"));
            else {
                value = args[j++];

                if (jpf.isNot(value) && nodes[i].getAttribute("default"))
                    value = jpf.parseExpression(nodes[i].getAttribute("default"));
            }

            //Encode string optionally
            value = jpf.isTrue(nodes[i].getAttribute("encoded"))
                ? encodeURIComponent(value)
                : value;

            result[name] = value;
        }

        return result;
    }

    this.call = function(name, args, options){
        args = this.$convertArgs(name, args);

        // Set up multicall
        if (this.multicall) {
            if (!this.stack[this.url])
                this.stack[this.url] = this.getMulticallObject
                    ? this.getMulticallObject()
                    : new Array();

            this.getSingleCall(name, args, this.stack[this.url])
            return true;
        }

        var callback = (typeof this[name].callback == "string"
            ? self[this[name].callback]
            : this[name].callback) || function(){};

        // Get Data
        var data = this.serialize(name, args); //function of module

        function pCallback(data, state, extra){
            extra.data = data;

            if(state != jpf.SUCCESS)
                callback(null, state, extra);
            else if (_self.isValid && !_self.isValid(extra))
                callback(null, jpf.ERROR, extra);
            else
                callback(_self.unserialize(extra.data), state, extra);
        }

        // Sent the request
        var url  = jpf.getAbsolutePath(this.baseurl, this.url);
        var info = this.get(url, pCallback, jpf.extend({
            async    : this[name].async,
            userdata : this[name].userdata,
            nocache  : true,
            data     : data,
            useXML   : this.useXML,
            caching  : this[name].caching,
            ignoreOffline : this[name].ignoreOffline
        }, options));

        return info;
    }

    /**
     * Purge multicalled requests
     */
    this.purge = function(callback, userdata, async, extradata){
        //#ifdef __DEBUG
        if (!this.stack[this.url] || !this.stack[this.url].length)
            throw new Error(jpf.formatErrorString(0, null, "Executing a multicall", "No RPC calls where executed before calling purge()."));
        //#endif

        // Get Data
        var data = this.serialize("multicall", [this.stack[this.url]]); //function of module
        var url  = jpf.getAbsolutePath(this.baseurl, this.url);
        if (extradata) {
            for (var vars = [], i = 0; i < extradata.length; i++) {
                vars.push(encodeURIComponent(extradata[i][0]) + "="
                    + encodeURIComponent(extradata[i][1] || ""))
            }
            url = url + (url.match(/\?/) ? "&" : "?") + vars.join("&");
        }

        var info = this.get(url, callback, {
            async    : async,
            userdata : userdata,
            nocache  : true,
            data     : data,
            useXML   : this.useXML
        });

        this.stack[this.url] = this.getMulticallObject
            ? this.getMulticallObject()
            : [];

        //return info[1];
    }

    this.revert = function(modConst){
        this.stack[modConst.url] = this.getMulticallObject
            ? this.getMulticallObject()
            : [];
    }

    this.getStackLength = function(){
        return this.stack[this.url] ? this.stack[this.url].length : 0;
    }

    /**
     * Loads jml definition
     * @todo opt to rename this to .$loadJml()
     *
     * @attribute {String}  url              the location of the server that is recipient of the rpc messages.
     * @attribute {String}  protocol         the name of the plugin that is used to provide the messages.
     * @attribute {Boolean} [multicall]      whether the call is stacked until purge() is called.
     * @attribute {Number}  [timeout]        the number of milliseconds after which the call is considered timed out.
     * @attribute {Boolean} [autoroute]      whether the call should be routed through a proxy when a permission error occurs due to the same domein policy.
     * @attribute {Boolean} [async]          whether the call is executed in the backround. Default is true. When set to false the application hangs while this call is executed.
     * @attribute {Boolean} [caching]        whether the call is cached. Default is false. When set to true any call with the same data will return immediately with the cached result.
     * @define method   element specifying a method available within the rpc element.
     * @allowchild variable
     * @attribute {String}  name             the name of the method. This name will be available on the rpc object as a javascript method.
     * Example:
     * <pre class="code">
     *  <j:teleport>
     *      <j:rpc id="comm" protocol="xmlrpc">
     *          <j:method name="save" />
     *      </j:rpc>
     *  </j:teleport>
     *
     *  <j:script>
     *      comm.save(data);
     *  </j:script>
     * </pre>
     * @attribute {String}  [url]            the location of the server that is recipient of the rpc message.
     * @attribute {String}  [callback]       the name of the method that handles the return of the call.
     * @attribute {Boolean} [ignore-offline] whether the method should not be stored for later execution when offline.
     * @define variable element specifying an argument of a method in an rpc element.
     * @attribute {String}  name             the argument name.
     * @attribute {String}  [value]          the value of the argument.
     * @attribute {String}  [default]        the default value of the argument. If no value is specified when this function is called, the default value is used.
     */
    this.load = function(x){
        this.$jml       = x;
        this.timeout   = parseInt(x.getAttribute("timeout")) || this.timeout;
        this.url       = jpf.parseExpression(x.getAttribute("url"))
        this.baseurl   = jpf.parseExpression(
                             jpf.xmldb.getInheritedAttribute(
                                this.$jml, "baseurl")) || "";
        this.multicall = x.getAttribute("multicall") == "true";
        this.autoroute = x.getAttribute("autoroute") == "true";

        if (this.url)
            this.server = this.url.replace(/^(.*\/\/[^\/]*)\/.*$/, "$1") + "/";

        if (this.$load)
            this.$load(x);

        var q = x.childNodes;
        for (var url, i = 0; i < q.length; i++) {
            if (q[i].nodeType != 1)
                continue;

            //#ifdef __DEBUG
            if (q[i][jpf.TAGNAME] != "method") {
                throw new Error(jpf.formatErrorString(0, this,
                    "Parsing RPC Teleport node",
                    "Found element which is not a method", q[i]));
            }
            //#endif

            url = jpf.parseExpression(q[i].getAttribute("url"));
            if (url)
                this.urls[q[i].getAttribute("name")] = url;

            //Add Method
            this.addMethod(q[i].getAttribute("name"),
                q[i].getAttribute("receive") || x.getAttribute("receive"),
                q[i].getElementsByTagName("*"), //var nodes = $xmlns(q[i], "variable", jpf.ns.jml);
                !jpf.isFalse(q[i].getAttribute("async")),
                jpf.isTrue(q[i].getAttribute("caching")),
                jpf.isTrue(q[i].getAttribute("ignore-offline")));
        }
    }

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
     }
     */
}

// #ifdef __WITH_DATA_INSTRUCTIONS
//instrType, data, options, xmlContext, callback, multicall, userdata, arg, isGetRequest
jpf.datainstr.rpc = function(xmlContext, options, callback){
    var parsed = options.parsed || this.parseInstructionPart(
        options.instrData.join(":"), xmlContext, options.args, options);

    if (options.preparse) {
        options.parsed = parsed;
        options.preparse = -1;
        return;
    }

    var args   = parsed.arguments;
    var q      = parsed.name.split(".");
    var obj    = eval(q[0]);
    var method = q[1];

    //#ifdef __DEBUG
    if (!obj)
        throw new Error(jpf.formatErrorString(0, null, "Saving/Loading data",
            "Could not find RPC object by name '" + q[0] + "' in data \
            '" + options.instruction + "'"));
    //#endif

    //force multicall if needed;
    if (options.multicall)
        obj.forceMulticall = true;

    //Set information later neeed
    //#ifdef __DEBUG
    if (!obj[method])
        throw new Error(jpf.formatErrorString(0, null, "Saving/Loading data",
            "Could not find RPC function by name '" + method + "' in data \
            instruction '" + options.instruction + "'"));
    //#endif

    if (options.userdata)
        obj[method].userdata = options.userdata;

    if (!obj.multicall)
        obj[method].callback = callback; //&& obj[method].async

    //Call method
    var retvalue = obj.call(method, args, options);

    if (obj.multicall)
        return obj.purge(callback, "&@^%!@"); //Warning!! @todo Make multicall work with offline
    else if (options.multicall) {
        obj.forceMulticall = false;
        return obj;
    }

    //#ifdef __WITH_OFFLINE
    if(typeof jpf.offline != "undefined" && !jpf.offline.onLine)
        return;
    //#endif

    //Call callback for sync calls
    if (!obj.multicall && !obj[method].async && callback)
        callback(retvalue);
}

// #endif

// #endif
