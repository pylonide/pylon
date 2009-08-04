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

// #ifdef __TP_RPC_REST
// #define __TP_RPC 1

/**
 * Implementation of the Common Gateway Interface (REST) as a module for the RPC
 * plugin of apf.teleport.
 * Example:
 * Ajax.org Markup Language
 * <code>
 *  <a:teleport>
 *      <a:rpc id="comm" protocol="rest">
 *          <a:method
 *            name        = "deleteProduct"
 *            url         = "http://example.com/products"
 *            http-method = "DELETE"
 *            receive     = "processDelete">
 *          </a:method>
 *          <a:method
 *            name        = "createProduct"
 *            url         = "http://example.com/products"
 *            http-method = "POST">
 *          </a:method>
 *      </a:rpc>
 *  </a:teleport>
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
 * Remarks:
 * Calls can be made to a server using rest variables with a special {@link term.datainstruction data instruction}
 * format.
 * <code>
 *  get="url:http://www.bla.nl?blah=10&foo={@bar}&example=[10+5]"
 *  set="url.post:http://www.bla.nl?blah=10&foo={/bar}&example=[10+5]"
 * </code>
 *
 * @addenum rpc[@protocol]:rest
 *
 * @constructor
 *
 * @inherits apf.Class
 * @inherits apf.BaseComm
 * @inherits apf.http
 * @inherits apf.rpc
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @author      Mike de Boer (mike AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @default_private
 */
apf.rest = function(){
    var reqMethods = {};
    
    this.supportMulticall = false;
    this.namedArguments   = false;
    this.nocache          = false;

    // Register Communication Module
    apf.teleport.register(this);

    // Stand Alone
    if (!this.uniqueId) {
        apf.makeClass(this);
        this.implement(apf.BaseComm, apf.http, apf.rpc);
    }

    this.unserialize = function(str){
        return str;
    };

    this.getSingleCall = function(name, args, obj){
        obj.push(args);
    };

    // Create message to send
    this.serialize = function(functionName, args){
        if (!this.baseUrl)
            this.baseUrl = this.url;

        var options = reqMethods[functionName],
            body    = "NOTIFY|SEND|POST|PUT".indexOf(options.method) > -1 ? args.pop() : "",
            url;

        this.method = options.method;
        if (options.type)
            this.contentType = options.type;

        this.url    = (url = this.urls[functionName]
            ? this.urls[functionName]
            : this.baseUrl) + (args.length 
                ? (url.charAt(url.length - 1) == "/" 
                    ? ""
                    : "/") + args.join("/")
                : "");

        return body;
    };

    this.$load = function(x){
        var q = x.childNodes;
        for (var i = 0, l = q.length; i < l; i++) {
            if (q[i].nodeType != 1) continue;
            reqMethods[q[i].getAttribute("name")] = {
                method : (q[i].getAttribute("http-method") || "GET").toUpperCase(),
                type   : q[i].getAttribute("content-type")  || ""
            }
        }
    };
};

// #endif
