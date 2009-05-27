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

// #ifdef __TP_RPC_HEADER
// #define __TP_RPC 1

/**
 * Implementation of an RPC protocol which encodes the variable information in 
 * the HTTP headers of the request.
 * Example:
 * Javeline Markup Language
 * <code>
 *  <j:teleport>
 *      <j:rpc id="comm" protocol="header">
 *          <j:method 
 *            name    = "searchProduct" 
 *            receive = "processSearch">
 *              <j:variable name="search" />
 *              <j:variable name="page" />
 *              <j:variable name="textbanner" value="1" />
 *          </j:method>
 *          <j:method 
 *            name = "loadProduct">
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
 * @constructor
 *
 * @addenum rpc[@protocol]:header
 *
 * @inherits jpf.Class
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
jpf.header = function(){
    this.supportMulticall = false;
    this.method = "GET";
    this.vartype = "header";
    this.isXML = true;
    this.namedArguments = true;
    
    // Register Communication Module
    jpf.teleport.register(this);
    
    // Stand Alone
    if (!this.uniqueId) {
        jpf.makeClass(this);
        this.implement(jpf.BaseComm, jpf.http, jpf.rpc);
    }
    
    this.unserialize = function(str){
        return str;
    }
    
    // Create message to send
    this.serialize = function(functionName, args){
        for (var hFunc = [], i = 0; i < args.length; i++) {
            if (!args[i][0] || !args[i][1]) 
                continue;
            
            // #ifdef __DEBUG
            jpf.console.info("<strong>" + args[i][0] + ":</strong> " + args[i][1] + "<br />", "teleport");
            // #endif
            
            http.setRequestHeader(args[i][0], args[i][1]);
        }
        
        this.$HeaderHook = new Function('http', hFunc.join("\n"));
        
        return "";
    }
    
    this.$load = function(x){
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
}

// #endif
