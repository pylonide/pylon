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

/**
 * Implementation of the SOAP RPC protocol.
 * Implementation of the Common Gateway Interface (CGI) as a module for the RPC
 * plugin of apf.teleport. 
 * Example:
 * Ajax.org Markup Language
 * <code>
 *  <a:rpc id="comm" 
 *    protocol    = "soap" 
 *    url         = "http://example.com/show-product.php" 
 *    soap-prefix = "m" 
 *    soap-xmlns  = "http://example.com">
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
 * @addenum rpc[@protocol]:soap
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.soap = function(){
    this.supportMulticall = false;
    this.method           = "POST";
    this.useXML           = true;

    this.nsName           = "m";
    this.nsURL            = "http://www.ajax.org";
    
    this.namedArguments   = true;
    
    // Serialize Objects
    var createMessage = {
        host : this,

        //Object
        0 : function(o){
            var prop, retstr, wo = o;//.valueOf();

            for (prop in wo) {
                if (typeof wo[prop] != "function" && prop != "type") {
                    retstr += this.host.doSerialize(wo[prop], prop);
                }
            }

            return retstr;
        },

        //String
        5 : function(s){
            return s.replace(/\]\]/g, "] ]");//"<![CDATA[" + s.replace(/\]\]/g, "] ]") + "]]>";
        },

        //Number
        2 : function(i){
            return i;
        },

        //Boolean
        4 : function(b){
            return b == true ? 1 : 0;
        },

        //Date
        3 : function(d){
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

        //Array
        1 : function(a){
            var retstr = "";
            for(var i = 0; i < a.length; i++)
                retstr += this.host.doSerialize(a[i], "item");

            return retstr;
        }
    }

    this.doSerialize = function(args, name){
        var c    = name ? args : args[1],
            name = name ? name : args[0];

        if (typeof c == "function") throw new Error("Cannot Parse functions");

        if (c === false)
            return '<' + name + ' xsi:null="1"/>';
        else
            return '<' + name + ' ' + this.getXSIType(c) + '>'
                + createMessage[c.dataType || 0](c) + '</' + name + '>';
    }

    // get xsi:type
    this.getXSIType = function(c){
        if (!c.dataType)
            return '';
        else if (c.dataType == apf.ARRAY)
            return 'xsi:type="SOAP-ENC:Array" SOAP-ENC:arrayType="xsd:ur-type['
                + c.length + ']"';
        else if (c.dataType == apf.NUMBER)
            return 'xsi:type="' + (parseInt(c) == c ? "xsd:int" : "xsd:float")
                + '"';
        else if (c.dataType == "data")
            return 'xsi:type="xsd:timeInstant"';
        else
            return 'xsi:type="xsd:' + c.dataType + '"';
    }

    // Create message to send
    this.createMessage = function(functionName, args){
        //Construct the SOAP message
        var message = ['<?xml version="1.0"?>',
        '<SOAP-ENV:Envelope SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"',
        ' xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/"',
        ' xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"',
        ' xmlns:xsd="http://www.w3.org/1999/XMLSchema"',
        ' xmlns:xsi="http://www.w3.org/1999/XMLSchema-instance">',
        "<SOAP-ENV:Body><",
            this.nsName, ":", functionName, " xmlns:",
            this.nsName, "=\"", this.nsURL, "\">"]

         for (var param in args) {
             message.push(this.doSerialize(args[param], param));
         }

        message.push("</", this.nsName, ":", functionName,
           "></SOAP-ENV:Body></SOAP-ENV:Envelope>");

        return message.join("");
    }

    this.$headerHook = function(http){
        http.setRequestHeader('SOAPAction', '"'
            + this.url.replace(/http:\/\/.*\/([^\/]*)$/, "$1") + '"');
    }

    this.unserialize = function(data){
        return data;
        var ret, i, nodes;

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
                return (data.firstChild) ? parseFloat(data.firstChild.nodeValue) : 0;
                break;
            case "xsd:timeInstant":
                /*
                Have to read the spec to be able to completely
                parse all the possibilities in iso8601
                07-17-1998 14:08:55
                19980717T14:08:55
                */

                var sn = apf.dateSeparator;

                if (/^(\d{4})(\d{2})(\d{2})T(\d{2}):(\d{2}):(\d{2})/
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
                return apf.crypt.Base64.decode(data.firstChild.nodeValue);
                break;
            case "SOAP-ENC:Array":
                nodes = data.childNodes;

                ret = [];
                for (i = 0; i < nodes.length; i++) {
                    if(nodes[i].nodeType != 1)
                        continue;
                    ret.push(this.unserialize(nodes[i]));
                }

                return ret;
                break;
            default:
                //Custom Type
                if (type && !self[type]) {
                    throw new Error(apf.formatErrorString(1084, null, "SOAP", 
                        "Invalid Object Specified in SOAP message: " + type));
                }

                nodes = data.childNodes;
                var o = type ? new self[type] : {};

                ret = [];
                for(i = 0; i < nodes.length; i++) {
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
        if (!apf.supportNamespaces)
            data.ownerDocument.setProperty("SelectionNamespaces",
                "xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xds='http://www.w3.org/2001/XMLSchema' xmlns:SOAP-ENV='http://schemas.xmlsoap.org/soap/envelope/'");

        var rvalue = data.getElementsByTagName("SOAP-ENV:Body")[0];///node()/node()[2]
        if (!rvalue && data.getElementsByTagNameNS)
            rvalue = data.getElementsByTagNameNS("http://schemas.xmlsoap.org/soap/envelope/", "Body")[0]

        extra.data = rvalue;
        
        return true;
    }

    this.addEventListener("DOMNodeInsertedIntoDocument", function() {
        this.nsName = this["soap-prefix"] || this.nsName;
        this.nsURL  = this["soap-xmlns"] || this.nsURL;
    });
};

// #endif
