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

/**
 * Implementation of an RPC protocol which encodes the data in a serialized 
 * format in the same way as the php createMessage() function does. It requires
 * json in return. This protocol was originally designed to make use of the 
 * native unserializer methods on both sides of the line.
 * Example:
 * Ajax.org Markup Language
 * <code>
 *  <a:rpc id="comm" protocol="jphp">
 *      <a:method 
 *        name    = "searchProduct" 
 *        receive = "processSearch" />
 *      <a:method 
 *        name = "loadProduct" />
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
 * @addenum rpc[@protocol]:jphp
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
apf.jphp = function(){
    this.supportMulticall = true;
    this.multicall        = false;
    this.mcallname        = "multicall";
    this.method           = "POST";
    this.useXML           = true;
    this.namedArguments   = false;
    
    // Serialize Objects
    var createMessage = {
        host: this,
        
        //Object
        0: function(ob){
            var ob = ob.valueOf();
            
            var length = 0, x = "", prop;
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
        
        //String
        5: function(str){
            var str = str.replace(/[\r]/g, "");
            str     = str.replace(/\]\]/g, "\]-\]-\]").replace(/\]\]/g, "\]-\]-\]");
            return "s:" + str.length + ":\"" + str + "\"";
        },
        
        //Number
        2: function(nr){
            if (nr == parseInt(nr)) 
                return "i:" + nr;
            else 
                if (nr == parseFloat(nr)) 
                    return "d:" + nr;
                else 
                    return this["boolean"](false);
        },
        
        //Boolean
        4: function(b){
            return "b:" + (b == true ? 1 : 0);
        },
        
        //Array
        1: function(ar){
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
    };
    
    this.doSerialize = function(args){
        if (typeof args == "function") {
            throw new Error("Cannot Parse functions");
        }
        else {
            if (apf.isNot(args)) 
                return createMessage["boolean"](false);
        }
        
        return createMessage[args.dataType || 0](args);
    };
    
    // Create message to send
    this.createMessage = function(functionName, args){
        //Construct the XML-RPC message
        return "<?xml version='1.0' encoding='UTF-16'?><run m='"
            + functionName + "'><![CDATA[" + this.doSerialize(args) + "]]></run>";
    };
    
    // Check Received Data for errors
    this.isValid = function(extra){
        var data = extra.data;
        
        //handle method result
        if (data && data.tagName == "data") {
            data = data.firstChild.nodeValue;
            
            //error handling
            if (data && data[0] == "error") {
                extra.message = data[1];
                return false;
            }
        }
        else {
            extra.message = "Malformed RPC Message: Parse Error\n\n:'" + http.responseText + "'";
            return false;
        }
        
        extra.data = data;
        return true;
    };
};

// #endif
