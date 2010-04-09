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

//#ifdef __AMLTELEPORT && __TP_RPC

/**
 * element specifying a method available within the rpc element.
 *
 * @attribute {String}  name             the name of the method. This name will
 *                                       be available on the rpc object as a
 *                                       javascript method.
 * Example:
 * <code>
 *  <a:rpc id="comm" protocol="xmlrpc">
 *      <a:method name="save" />
 *  </a:rpc>
 *
 *  <a:script>
 *      comm.save(data);
 *  </a:script>
 * </code>
 * @attribute {String}  [callback]       the name of the method that handles
 *                                       the return of the call.
 * @attribute {Boolean} [async]          whether the call is executed in the
 *                                       backround. Default is true. When set
 *                                       to false the application hangs while
 *                                       this call is executed.
 * @attribute {Boolean} [caching]        whether the call is cached. Default
 *                                       is false. When set to true any call
 *                                       with the same data will return immediately
 *                                       with the cached result.
 * @attribute {Boolean} [ignore-offline] whether the method should not be stored
 *                                       for later execution when offline.
 * @attribute {Boolean} [method-name]    the name sent to the server.
 *
 * @attribute {String}  [type]           the type of the returned data
 * Possible values:
 * xml  returns the response as an xml document
 *
 * @allowchild variable
 */
apf.method = function(struct, tagName){
    this.$init(tagName || "method", apf.NODE_HIDDEN, struct);

    this.async             = true;
    this.caching           = false;
    this["ignore-offline"] = false;
};

(function(){
    this.$parsePrio = "002";
    
    this.$booleanProperties["async"]          = true;
    this.$booleanProperties["caching"]        = true;
    this.$booleanProperties["ignore-offline"] = true;

    this.$supportedProperties.push("name", "receive", "async", "caching",
        "ignore-offline", "method-name", "type", "url");

    this.$propHandlers["ignore-offline"] = function(value){
        this.ignoreOffline = value;
    };
    
    this.$propHandlers["method-name"] = function(value){
        this.methodName = value;
    };

    /**** DOM Handlers ****/

    this.addEventListener("DOMNodeInserted", function(e){
        if (this.parentNode.$addMethod && e.currentTarget == this)
            this.parentNode.$addMethod(this);
    });
    
    this.addEventListener("DOMNodeRemoved", function(e){
        if (this.parentNode.$removeMethod && e.currentTarget == this)
            this.parentNode.$removeMethod(this);
    });

    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        if (this.parentNode.$addMethod)
            this.parentNode.$addMethod(this);
    });
}).call(apf.method.prototype = new apf.AmlElement());

apf.aml.setElement("method", apf.method);
// #endif