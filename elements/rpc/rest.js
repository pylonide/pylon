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

/**
 * Implementation of the Common Gateway Interface (REST) as a module for the RPC
 * plugin of apf.teleport.
 * Example:
 * Ajax.org Markup Language
 * <code>
 *  <a:rpc id="comm" protocol="rest">
 *      <a:method
 *        name        = "deleteProduct"
 *        url         = "http://example.com/products"
 *        http-method = "DELETE"
 *        receive     = "processDelete" />
 *      <a:method
 *        name        = "createProduct"
 *        url         = "http://example.com/products"
 *        http-method = "POST" />
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
 * Remarks:
 * Calls can be made to a server using rest variables with a special
 * {@link term.datainstruction data instruction}
 * format.
 * <code>
 *  get="http://www.bla.nl?blah=10&foo=[@bar]&example=[10+5]"
 *  set="post http://www.bla.nl?blah=10&foo={/bar}&example=[10+5]"
 * </code>
 *
 * @addenum rpc[@protocol]:rest
 *
 * @constructor
 *
 * @inherits apf.Teleport
 * @inherits apf.http
 * @inherits apf.rpc
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @author      Mike de Boer (mike AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @default_private
 */
apf.rest = function(){
    this.supportMulticall = false;
    this.namedArguments   = false;
    this.nocache          = false;

    this.unserialize = function(str){
        return str;
    };

    this.getSingleCall = function(name, args, obj){
        obj.push(args);
    };

    // Create message to send
    this.createMessage = function(functionName, args){
        if (!this.baseUrl)
            this.baseUrl = this.url;

        var options = this.$methods[functionName];

        //#ifdef __DEBUG
        if ("NOTIFY|SEND|POST|PUT".indexOf(options["http-method"]) > -1)
            apf.console.log("Found method " + options["http-method"] + ". Taking body from last argument");
        //#endif
        
        var body = "NOTIFY|SEND|POST|PUT".indexOf(options["http-method"].toUpperCase()) > -1 ? args.pop() : "",
            url;

        this.method = options["http-method"];
        if (options["content-type"])
            this.contentType = options["content-type"];

        var i     = 0,
            l     = args.length;
        for (; i < l; ++i)
            args[i] = encodeURIComponent(args[i]);

        this.url    = (url = options.url
            ? options.url
            : this.baseUrl) + (l 
                ? (url.charAt(url.length - 1) == "/" 
                    ? ""
                    : "/") + args.join("/")
                : "");

        this.contentType = body ? "application/x-www-form-urlencoded" : null;
        return body;
    };
};

// #endif
