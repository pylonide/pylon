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
// #define __TP_RPC 1

/**
 * Implementation of the JSON-RPC protocol.
 *
 * @classDescription		This class creates a new JSON-RPC TelePort module.
 * @return {JsonRpc} Returns a new JSON-RPC TelePort module.
 * @type {JsonRpc}
 * @constructor
 *
 * @addenum rpc[@protocol]:jsonrpc
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.jsonrpc = function(){
    this.supportMulticall = false;
    this.multicall        = false;
    
    this.protocol         = "POST";
    this.useXML           = false;
    this.id               = 0;
    this.namedArguments   = false;
    
    // Register Communication Module
    jpf.Teleport.register(this);
    
    
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
    
    this.getSingleCall = function(name, args, obj){
        obj.push({
            method: name,
            params: args
        });
    }
    
    // Create message to send
    this.serialize = function(functionName, args){
        this.fName = functionName;
        this.id++;
        
        //Construct the XML-RPC message
        var message = '{"method":"' + functionName + '","params":'
            + jpf.serialize(args) + ',"id":' + this.id + '}';
        return message;
    }
    
    this.__HeaderHook = function(http){
        http.setRequestHeader('X-JSON-RPC', this.fName);
    }
    
    this.unserialize = function(str){
        var obj = eval('obj=' + str);
        return obj.result;
    }
    
    // Check Received Data for errors
    this.checkErrors = function(data, http){
        return data;
    }
}

// #endif
