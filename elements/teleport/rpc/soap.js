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

// #ifdef __TP_RPC_SOAP
// #define __TP_RPC 1

/**
 * Implementation of the SOAP RPC protocol.
 * Implementation of the Common Gateway Interface (CGI) as a module for the RPC
 * plugin of jpf.teleport. 
 * Example:
 * Javeline Markup Language
 * <code>
 *  <j:teleport>
 *      <j:rpc id="comm" 
 *        protocol    = "soap" 
 *        url         = "http://example.com/show-product.php" 
 *        soap-prefix = "m" 
 *        soap-xmlns  = "http://example.com">
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
 * @addenum rpc[@protocol]:soap
 *
 * @inherits jpf.Class
 * @inherits jpf.BaseComm
 * @inherits jpf.http
 * @inherits jpf.rpc
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.soap = function(){
    this.supportMulticall = false;
    this.method         = "POST";
    this.useXML           = true;

    this.nsName           = "m";
    this.nsURL            = "http://www.javeline.org";
    
    this.namedArguments   = true;

    // Register Communication Module
    jpf.teleport.register(this);

    // Stand Alone
    if (!this.uniqueId) {
        jpf.makeClass(this);
        this.inherit(jpf.BaseComm, jpf.http, jpf.rpc);
    }

    // Serialize Objects
    var serialize = {
        host : this,

        object : function(o){
            var wo = o;//.valueOf();

            for (prop in wo) {
                if (typeof wo[prop] != "function" && prop != "type") {
                    retstr += this.host.doSerialize(wo[prop], prop);
                }
            }

            return retstr;
        },

        string : function(s){
            return s.replace(/\]\]/g, "] ]");//"<![CDATA[" + s.replace(/\]\]/g, "] ]") + "]]>";
        },

        number : function(i){
            return i;
        },

        "boolean" : function(b){
            return b == true ? 1 : 0;
        },

        date : function(d){
            //Could build in possibilities to express dates
            //in weeks or other iso8601 possibillities
            //hmmmm ????
            //19980717T14:08:55
            return doYear(d.getUTCYear()) + doZero(d.getMonth())
                + doZero(d.getUTCDate()) + "T" + doZero(d.getHours())
                + ":" + doZero(d.getMinutes()) + ":" + doZero(d.getSeconds());

            function doZero(nr) {
                nr = String("0" + nr);
                return nr.substr(nr.length-2, 2);
            }

            function doYear(year) {
                if (year > 9999 || year < 0)
                    XMLRPC.handleError(new Error("Unsupported year: " + year));

                year = String("0000" + year)
                return year.substr(year.length - 4, 4);
            }
        },

        array : function(a){
            var retstr = "";
            for(var i = 0; i < a.length; i++)
                retstr += this.host.doSerialize(a[i], "item");

            return retstr;
        }
    }

    this.doSerialize = function(args, name){
        var c    = name ? args : args[1];
        var name = name ? name : args[0];

        if (typeof c == "function") throw new Error("Cannot Parse functions");

        if (c === false)
            return '<' + name + ' xsi:null="1"/>';
        else
            return '<' + name + ' ' + this.getXSIType(c) + '>'
                + serialize[c.dataType || "object"](c) + '</' + name + '>';
    }

    // get xsi:type
    this.getXSIType = function(c){
        if (!c.dataType) return '';
        else if (c.dataType == "array")
            return 'xsi:type="SOAP-ENC:Array" SOAP-ENC:arrayType="xsd:ur-type['
                + c.length + ']"';
        else if (c.dataType == "number")
            return 'xsi:type="' + (parseInt(c) == c ? "xsd:int" : "xsd:float")
                + '"';
        else if (c.dataType == "data")
            return 'xsi:type="xsd:timeInstant"';
        else
            return 'xsi:type="xsd:' + c.dataType + '"';
    }

    // Create message to send
    this.serialize = function(functionName, args){
        //Construct the SOAP message

        var message = '<?xml version="1.0"?>' +
        '<SOAP-ENV:Envelope SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/1999/XMLSchema" xmlns:xsi="http://www.w3.org/1999/XMLSchema-instance">' +
        '<SOAP-ENV:Body>' +
        '<' + this.nsName + ':' + functionName + ' xmlns:'
            + this.nsName + '="' + this.nsURL + '">'

        for (var i = 0; i < args.length; i++) {
            message += this.doSerialize(args[i]);
        }

        message += '</' + this.nsName + ':' + functionName
            + '></SOAP-ENV:Body></SOAP-ENV:Envelope>';

        return message;
    }

    this.$HeaderHook = function(http){
        http.setRequestHeader('SOAPAction', '"'
            + this.url.replace(/http:\/\/.*\/([^\/]*)$/, "$1") + '"');
    }

    this.unserialize = function(data){
        return data;
        var ret, i;

        //xsi:type
        var type = data.getAttribute("xsi:type");
        switch (type) {
            case "xsd:string":
                return (data.firstChild)
                    ? new String(data.firstChild.nodeValue)
                    : "";
                break;
            case "xsd:int":
            case "xsd:double":
            case "xsd:float":
                return (data.firstChild) ? new Number(data.firstChild.nodeValue) : 0;
                break;
            case "xsd:timeInstant":
                /*
                Have to read the spec to be able to completely
                parse all the possibilities in iso8601
                07-17-1998 14:08:55
                19980717T14:08:55
                */

                var sn = jpf.dateSeparator;

                if(/^(\d{4})(\d{2})(\d{2})T(\d{2}):(\d{2}):(\d{2})/
                  .test(data.firstChild.nodeValue)){//data.text)){
                    return new Date(RegExp.$2 + sn + RegExp.$3 + sn +
                                    RegExp.$1 + " " + RegExp.$4 + ":" +
                                    RegExp.$5 + ":" + RegExp.$6);
                }
                else {
                    return new Date();
                }
                break;
            case "xsd:boolean":
                return Boolean(isNaN(parseInt(data.firstChild.nodeValue))
                    ? (data.firstChild.nodeValue == "true")
                    : parseInt(data.firstChild.nodeValue))
                break;
            case "SOAP-ENC:base64":
                return jpf.crypt.Base64.decode(data.firstChild.nodeValue);
                break;
            case "SOAP-ENC:Array":
                var nodes = data.childNodes;

                ret = [];
                for (var i = 0; i < nodes.length; i++) {
                    if(nodes[i].nodeType != 1)
                        continue;
                    ret.push(this.unserialize(nodes[i]));
                }

                return ret;
                break;
            default:
                //Custom Type
                if (type && !self[type])
                    throw new Error(jpf.formatErrorString(1084, null, "SOAP", "Invalid Object Specified in SOAP message: " + type));

                var nodes = data.childNodes;
                var o = type ? new self[type] : {};

                ret = new Array();
                for(var i = 0; i < nodes.length; i++) {
                    if (nodes[i].nodeType != 1) continue;
                    ret[nodes[i].tagName] = this.unserialize(nodes[i]);
                }

                return ret;
                break;
        }
    }

    // Check Received Data for errors
    this.isValid = function(extra){
        /*
        var fault = data.selectSingleNode("Fault");
        if (fault) {
            var nr  = fault.selectSingleNode("faultcode/text()").nodeValue;
            var msg = "\n" + fault.selectSingleNode("faultstring/text()").nodeValue;
            throw new Error(nr, msg);
        }
        else if (data.getElementsByTagName("Errors")) {
            var fault = data.getElementsByTagName("Errors")[0];
            var nr    = fault.selectSingleNode("node()/node()/text()").nodeValue;
            var msg   = "\n" + fault.selectSingleNode("node()/node()[2]/text()").nodeValue;
            throw new Error(nr, msg);
        }
        */

        var data = extra.data;

        // IE Hack
        if (!jpf.supportNamespaces)
            data.ownerDocument.setProperty("SelectionNamespaces",
                "xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xds='http://www.w3.org/2001/XMLSchema' xmlns:SOAP-ENV='http://schemas.xmlsoap.org/soap/envelope/'");

        rvalue = data.getElementsByTagName("SOAP-ENV:Body")[0];///node()/node()[2]
        if (!rvalue && data.getElementsByTagNameNS)
            rvalue = data.getElementsByTagNameNS("http://schemas.xmlsoap.org/soap/envelope/", "Body")[0]

        extra.data = rvalue;
        
        return true;
    }

    this.$load = function(x){
        if (x.getAttribute("soap-prefix"))
            this.nsName = x.getAttribute("soap-prefix");
        if (x.getAttribute("soap-xmlns"))
            this.nsURL = x.getAttribute("soap-xmlns");
    }
}

// #endif
