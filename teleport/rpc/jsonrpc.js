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

// Serialize Objects
jpf.JSONSerialize = {
    object: function(o){
        var str = [];
        for (var prop in o) {
            str.push('"' + prop.replace(/(["\\])/g, '\\$1') + '": '
                + jpf.serialize(o[prop]));
        }
        
        return "{" + str.join(", ") + "}";
    },
    
    string: function(s){
        s = '"' + s.replace(/(["\\])/g, '\\$1') + '"';
        return s.replace(/(\n)/g, "\\n").replace(/\r/g, "");
    },
    
    number: function(i){
        return i.toString();
    },
    
    "boolean": function(b){
        return b.toString();
    },
    
    date: function(d){
        var padd = function(s, p){
            s = p + s;
            return s.substring(s.length - p.length);
        };
        var y   = padd(d.getUTCFullYear(), "0000");
        var m   = padd(d.getUTCMonth() + 1, "00");
        var d   = padd(d.getUTCDate(), "00");
        var h   = padd(d.getUTCHours(), "00");
        var min = padd(d.getUTCMinutes(), "00");
        var s   = padd(d.getUTCSeconds(), "00");
        
        var isodate = y + m + d + "T" + h + ":" + min + ":" + s;
        
        return '{"jsonclass":["sys.ISODate", ["' + isodate + '"]]}';
    },
    
    array: function(a){
        for (var q = [], i = 0; i < a.length; i++) 
            q.push(jpf.serialize(a[i]));
        
        return "[" + q.join(", ") + "]";
    }
}

/**
 * @todo allow for XML serialization
 */
jpf.serialize = function(args){
    if (typeof args == "function" || jpf.isNot(args)) 
        return "null";
    return jpf.JSONSerialize[args.dataType || "object"](args);
}

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
