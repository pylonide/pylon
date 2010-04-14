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

// #ifdef __TP_RPC_JSON

/**
 * Implementation of the JSON-RPC protocol as a module for the RPC
 * plugin of apf.teleport. 
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
 * @constructor
 *
 * @addenum rpc[@protocol]:jsonrpc
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
apf.jsonrpc = function(){
    this.supportMulticall = false;
    this.multicall        = false;
    
    this.method           = "POST";
    this.useXML           = false;
    this.id               = 0;
    this.namedArguments   = false;
    
    this.getSingleCall = function(name, args, obj){
        obj.push({
            method: name,
            params: args
        });
    };
    
    // Create message to send
    this.createMessage = function(functionName, args){
        this.fName = functionName;
        this.id++;
        
        //Construct the XML-RPC message
        var message = "{'method':'" + functionName + "','params':"
            + apf.serialize(args) + ",'id':" + this.id + "}";
        return message;
    };
    
    this.$headerHook = function(http){
        http.setRequestHeader("X-JSON-RPC", this.fName);
    };
    
    this.unserialize = function(str){
        var obj = JSON.parse(str);
        return obj.result;
    };
};

// #endif
