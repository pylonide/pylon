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
 * @constructor
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
