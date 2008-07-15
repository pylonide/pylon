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

// #ifdef __TP_RPC_JSOP
// #define __TP_RPC 1

/**
 * @constructor
 */
jpf.jsop = function(){
    this.supportMulticall = false;
    this.multicall        = false;
    this.mcallname        = "system.multicall";
    this.protocol         = "POST";
    this.useXML           = false;
    this.id               = 0;
    this.namedArguments   = true;
    
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
        var o = {};
        o[name] = args;//vars;
        obj.push(o);
    }
    
    // Create message to send
    this.serialize = function(functionName, args){
        this.fName = functionName;
        this.id++;
        
        //Construct the XML-RPC message
        if (this.multicall) {
            return jpf.serialize(args[0]);
        }
        else {
            var o = {};
            o[functionName] = args;
            return jpf.serialize(o);
        }
    }
    
    this.__HeaderHook = function(http){
        http.setRequestHeader('Accept', 'text/javascript, text/html, application/xml, text/xml, */*');
        http.setRequestHeader('x-requested-with', 'XMLHttpRequest');
        http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        //http.setRequestHeader('X-JSON-RPC', this.fName);
    }
    
    this.unserialize = function(str){
        return str;
        var obj = eval('obj=' + str);
        return obj.result;
    }
    
    // Check Received Data for errors
    // Check Received Data for errors
    this.checkErrors = function(data, http, extra){
        return jpf.XMLDatabase.getXml(data, true);
    }
}

// #endif
