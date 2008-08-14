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

// #ifdef __TP_RPC_JPHP
// #define __TP_RPC 1

/**
 * @constructor
 */
jpf.jphp = function(){
    this.supportMulticall = true;
    this.multicall        = false;
    this.mcallname        = "multicall";
    this.protocol         = "POST";
    this.useXML           = true;
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
    
    // Serialize Objects
    var serialize = {
        host: this,
        
        object: function(ob){
            var ob = ob.valueOf();
            
            var length = 0, x = "";
            for (prop in ob) {
                if (typeof this[prop] != "function") {
                    length++;
                    //WEIRD FUCKED UP INTERNET EXPLORER BUG
                    var r = prop;
                    x += this.host.doSerialize(r) + ";"
                        + this.host.doSerialize(ob[r])
                        + (typeof ob[r] == "object" || typeof ob[r] == "array"
                          ? "" : ";");
                }
            }
            
            if (ob.className) 
                return "O:" + ob.className.length + ":\"" + ob.className
                    + "\":" + length + ":{" + x.substr(0, x.length) + "}";
            return "a:" + length + ":{" + x.substr(0, x.length) + "}";
        },
        
        string: function(str){
            var str = str.replace(/[\r]/g, "");
            str     = str.replace(/\]\]/g, "\]-\]-\]").replace(/\]\]/g, "\]-\]-\]");
            return "s:" + str.length + ":\"" + str + "\"";
        },
        
        number: function(nr){
            if (nr == parseInt(nr)) 
                return "i:" + nr;
            else 
                if (nr == parseFloat(nr)) 
                    return "d:" + nr;
                else 
                    return this["boolean"](false);
        },
        
        "boolean": function(b){
            return "b:" + (b == true ? 1 : 0);
        },
        
        array: function(ar){
            var x = "a:" + ar.length + ":{";
            for (var i = 0; i < ar.length; i++) 
                x += "i:" + i + ";" + this.host.doSerialize(ar[i]) 
                    + (i < ar.length
                      && typeof ar[i] != "object"
                      && typeof ar[i] != "array" ? ";" : "");
            
            return x + "}";
        }
    }
    
    this.unserialize = function(str){
        return eval(str.replace(/\|-\|-\|/g, "]]").replace(/\|\|\|/g, "\\n"));
    }
    
    this.doSerialize = function(args){
        if (typeof args == "function") {
            throw new Error(0, "Cannot Parse functions");
        }
        else 
            if (jpf.isNot(args)) 
                return serialize["boolean"](false);
        
        return serialize[args.dataType || "object"](args);
    }
    
    // Create message to send
    this.serialize = function(functionName, args){
        //Construct the XML-RPC message
        var message = "<?xml version='1.0' encoding='UTF-16'?><run m='"
            + functionName + "'><![CDATA[";
        //for(i=0;i<args.length;i++){
        message += this.doSerialize(args);
        //}
        
        return message + "]]></run>";
    }
    
    // Check Received Data for errors
    this.checkErrors = function(data, http){
        //handle method result
        if (data && data.tagName == "data") {
            data = data.firstChild.nodeValue;
            
            //error handling
            if (data && data[0] == "error") 
                throw new Error(10, data[1]);
        }
        else 
            throw new Error(1083, jpf.formatErrorString(1083, null, "Checking for errors", "Malformed RPC Message: Parse Error\n\n:'" + http.responseText + "'"));
        
        return data;
    }
}

// #endif
