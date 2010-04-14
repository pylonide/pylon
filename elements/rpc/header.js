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

/**
 * Implementation of an RPC protocol which encodes the variable information in 
 * the HTTP headers of the request.
 * Example:
 * Ajax.org Markup Language
 * <code>
 *  <a:rpc id="comm" protocol="header">
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
 *     </a:method>
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
 * @constructor
 *
 * @addenum rpc[@protocol]:header
 *
 * @inherits apf.Teleport
 * @inherits apf.http
 * @inherits apf.rpc
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @default_private
 */
apf.header = function(){
    this.supportMulticall = false;
    this.method           = "GET";
    this.vartype          = "header";
    this.isXML            = true;
    this.namedArguments   = true;
    
    this.unserialize = function(str){
        return str;
    };
    
    // Create message to send
    this.createMessage = function(functionName, args){
        for (var hFunc = [], i = 0, l = args.length; i < l; i++) {
            if (!args[i][0] || !args[i][1]) 
                continue;
            
            // #ifdef __DEBUG
            apf.console.info("<strong>" + args[i][0] + ":</strong> " + args[i][1]
                + "<br />", "teleport");
            // #endif
            
            http.setRequestHeader(args[i][0], args[i][1]);
        }
        
        this.$HeaderHook = new Function("http", hFunc.join("\n"));
        
        return "";
    };
};

// #endif
