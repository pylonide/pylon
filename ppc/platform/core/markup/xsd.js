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

//#ifdef __PARSER_XSD

/**
 * Object creating the XML Schema namespace for the aml parser.
 *
 * @constructor
 * @parser
 *
 * @allownode simpleType, complexType
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.xsd = new apf.AmlNamespace();
apf.setNamespace("http://www.w3.org/2001/XMLSchema", apf.xsd);

apf.xsd.typeHandlers = {
    "http://www.w3.org/2001/XMLSchema" : {
        //XSD datetypes [L10n potential]
        "dateTime": function(value){
            value = value.replace(/-/g, "/");
    
            value.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
            if (!RegExp.$3 || RegExp.$3.length < 4)
                return false;
    
            var dt = new Date(value);
            if (dt.getFullYear() != parseFloat(RegExp.$3))
                return false;
            if (dt.getMonth() != parseFloat(RegExp.$2) - 1)
                return false;
            if (dt.getDate() != parseFloat(RegExp.$1))
                return false;
            if (dt.getHours() != parseFloat(RegExp.$4))
                return false;
            if (dt.getMinutes() != parseFloat(RegExp.$5))
                return false;
            if (dt.getSeconds() != parseFloat(RegExp.$5))
                return false;
    
            return true;
        },
        "time": function(value){
            value.match(/^(\d{2}):(\d{2}):(\d{2})$/);
    
            var dt = new Date("21/06/1980 " + value);
            if (dt.getHours() != parseFloat(RegExp.$1))
                return false;
            if (dt.getMinutes() != parseFloat(RegExp.$2))
                return false;
            if (dt.getSeconds() != parseFloat(RegExp.$3))
                return false;
    
            return true;
        },
        "date": function(value){
            value = value.replace(/-/g, "/");
            value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (!RegExp.$3 || RegExp.$3.length < 4)
                return false;
    
            //@todo this is a dutch date, localization...
            var dt = new Date(RegExp.$2 + "/" + RegExp.$1 + "/" + RegExp.$3);
            if (dt.getFullYear() != parseFloat(RegExp.$3))
                return false;
            if (dt.getMonth() != parseFloat(RegExp.$2) - 1)
                return false;
            if (dt.getDate() != parseFloat(RegExp.$1))
                return false;
    
            return true;
        },
        "gYearMonth": function(value){
            value = value.replace(/-/g, "/");
            value.match(/^\/?(\d{4})(?:\d\d)?\/(\d{2})(?:\w|[\+\-]\d{2}:\d{2})?$/);
            if (!RegExp.$1 || RegExp.$1.length < 4)
                return false;
    
            var dt = new Date(value);
            if (dt.getFullYear() != parseFloat(RegExp.$))
                return false;
            if (dt.getMonth() != parseFloat(RegExp.$2) - 1)
                return false;
    
            return true;
        },
        "gYear": function(value){
            value.match(/^\/?(\d{4})(?:\d\d)?(?:\w|[\+\-]\d{2}:\d{2})?$/);
            if (!RegExp.$1 || RegExp.$1.length < 4)
                return false;
    
            var dt = new Date(value);
            if (dt.getFullYear() != parseFloat(RegExp.$1))
                return false;
    
            return true;
        },
        "gMonthDay": function(value){
            value = value.replace(/-/g, "/");
            value.match(/^\/\/(\d{2})\/(\d{2})(?:\w|[\+\-]\d{2}:\d{2})?$/);
    
            var dt = new Date(value);
            if (dt.getMonth() != parseFloat(RegExp.$1) - 1)
                return false;
            if (dt.getDate() != parseFloat(RegExp.$2))
                return false;
    
            return true;
        },
        "gDay": function(value){
            value = value.replace(/-/g, "/");
            value.match(/^\/{3}(\d{2})(?:\w|[\+\-]\d{2}:\d{2})?$/);
    
            var dt = new Date(value);
            if (dt.getDate() != parseFloat(RegExp.$1))
                return false;
    
            return true;
        },
        "gMonth": function(value){
            value = value.replace(/-/g, "/");
            value.match(/^\/{2}(\d{2})(?:\w|[\+\-]\d{2}:\d{2})?$/);
    
            var dt = new Date(value);
            if (dt.getMonth() != parseFloat(RegExp.$1) - 1)
                return false;
    
            return true;
        },
    
        //XSD datetypes
        "string": function(value){
            return typeof value == "string";
        },
        "boolean": function(value){
            return /^(true|false)$/i.test(value);
        },
        "base64Binary": function(value){
            return true;
        },
        "hexBinary": function(value){
            return /^(?:0x|x|#)?[A-F0-9]{0,8}$/i.test(value);
        },
        "float": function(value){
            return parseFloat(value) == value;
        },
        "decimal": function(value){
            return /^[0-9\.\-,]+$/.test(value);
        },
        "double": function(value){
            return parseFloat(value) == value;
        },
        "anyURI": function(value){
            return /^(?:\w+:\/\/)?(?:(?:[\w\-]+\.)+(?:[a-z]+)|(?:(?:1?\d?\d?|2[0-4]9|25[0-5])\.){3}(?:1?\d\d|2[0-4]9|25[0-5]))(?:\:\d+)?(?:\/([^\s\\\%]+|%[\da-f]{2})*)?$/i
                .test(value);
        },
        "QName": function(value){
            return true;
        },
        "normalizedString": function(value){
            return true;
        },
        "token": function(value){
            return true;
        },
        "language": function(value){
            return true;
        },
        "Name": function(value){
            return true;
        },
        "NCName": function(value){
            return true;
        },
        "ID": function(value){
            return true;
        },
        "IDREF": function(value){
            return true;
        },
        "IDREFS": function(value){
            return true;
        },
        "NMTOKEN": function(value){
            return true;
        },
        "NMTOKENS": function(value){
            return true;
        },
        "integer": function(value){
            return parseInt(value) == value;
        },
        "nonPositiveInteger": function(value){
            return parseInt(value) == value && value <= 0;
        },
        "negativeInteger": function(value){
            return parseInt(value) == value && value < 0;
        },
        "long": function(value){
            return parseInt(value) == value && value >= -2147483648
                && value <= 2147483647;
        },
        "int": function(value){
            return parseInt(value) == value;
        },
        "short": function(value){
            return parseInt(value) == value && value >= -32768 && value <= 32767;
        },
        "byte": function(value){
            return parseInt(value) == value && value >= -128 && value <= 127;
        },
        "nonNegativeInteger": function(value){
            return parseInt(value) == value && value >= 0;
        },
        "unsignedLong": function(value){
            return parseInt(value) == value && value >= 0 && value <= 4294967295;
        },
        "unsignedInt": function(value){
            return parseInt(value) == value && value >= 0;
        },
        "unsignedShort": function(value){
            return parseInt(value) == value && value >= 0 && value <= 65535;
        },
        "unsignedByte": function(value){
            return parseInt(value) == value && value >= 0 && value <= 255;
        },
        "positiveInteger": function(value){
            return parseInt(value) == value && value > 0;
        }
    },
    
    //#ifdef __WITH_XFORMS
    "http://www.w3.org/2002/xforms" : {
        //XForms datatypes
        "listItem": function(value){
            return true;
        },
        "listItems": function(value){
            return true;
        },
        "dayTimeDuration": function(value){
            return true;
        },
        "yearMonthDuration": function(value){
            return true;
        }
    },
    //#endif
    
    "http://ajax.org/2005/aml" : {
        //Ajax.org Platform datatypes
        "url": function(value){
            //@todo please make this better
            return /\b(https?|ftp):\/\/([\-A-Z0-9.]+)(\/[\-A-Z0-9+&@#\/%=~_|!:,.;]*)?(\?[\-A-Z0-9+&@#\/%=~_|!:,.;]*)?/i.test(value.trim());
        },
        "website": function(value){
            //@todo please make this better
            return /^(?:http:\/\/)?([\w-]+\.)+\w{2,4}$/.test(value.trim());
        },
        "email": function(value){
            // @see http://fightingforalostcause.net/misc/2006/compare-email-regex.php
            return /^([\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+\.)*[\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+@((((([a-z0-9]{1}[a-z0-9\-]{0,62}[a-z0-9]{1})|[a-z])\.)+[a-z]{2,6})|(\d{1,3}\.){3}\d{1,3}(\:\d{1,5})?)$/i
                .test(value.trim());
        },
        "creditcard": function(value){
            value = value.replace(/ /g, "");
            value = value.pad(21, "0", apf.PAD_LEFT);
            for (var total = 0, r, i = value.length; i >= 0; i--) {
                r = value.substr(i, 1) * (i % 2 + 1);
                total += r > 9 ? r - 9 : r;
            }
            return total % 10 === 0;
        },
        "expdate": function(value){
            value = value.replace(/-/g, "/");
            value = value.split("/");//.match(/(\d{2})\/(\d{2})/);
            var dt = new Date(value[0] + "/01/" + value[1]);
            //if(fulldate && dt.getFullYear() != parseFloat(value[1])) return false;
            if (dt.getYear() != parseFloat(value[1]))
                return false;//!fulldate &&
            if (dt.getMonth() != parseFloat(value[0]) - 1)
                return false;
    
            return true;
        },
        "wechars": function(value){
            return /^[0-9A-Za-z\xC0-\xCF\xD1-\xD6\xD8-\xDD\xDF-\xF6\xF8-\xFF -\.',]+$/
              .test(value)
        },
        "phonenumber": function(value){
            return /^[\d\+\- \(\)]+$/.test(value)
        },
        "faxnumber": function(value){
            return /^[\d\+\- \(\)]+$/.test(value)
        },
        "mobile": function(value){
            return /^[\d\+\- \(\)]+$/.test(value)
        }
    }
};

apf.xsd.custumTypeHandlers = {};

apf.xsd.matchType = function(value, type){
    var split  = type.split(":"),
        prefix = split[0],
        doc    = apf.document,
        ns     = doc.$prefixes[prefix];
    type = split[1];
    if (prefix == "xsd")
        ns = "http://www.w3.org/2001/XMLSchema";
    if (!ns) 
        ns = doc.namespaceURI || apf.ns.xhtml;
    
    var c = this.typeHandlers[ns];
    
    //check if type is type
    if (c && c[type])
        return c[type](value);
    
    throw new Error(apf.formatErrorString(0, null, 
        "Validating XSD Type", "Could not find type: " + type));
       
    return true;
};

apf.xsd.checkType = function(type, xmlNode){
    var value = typeof xmlNode == "object"
        ? apf.queryValue(xmlNode)
        : xmlNode;
    
    if (type.indexOf(":") > -1) {
        var split  = type.split(":"),
            prefix = split[0],
            name   = split[1],
            doc    = apf.document,
            ns     = doc.$prefixes[prefix];
        if (prefix == "xsd")
            ns = "http://www.w3.org/2001/XMLSchema";
        if (!ns) 
            ns = doc.namespaceURI || apf.ns.xhtml;
        
        var c = this.typeHandlers[ns];
        if (c && c[name])
            return c[name](value);
    }

    if (this.custumTypeHandlers[type]) {
        return this.custumTypeHandlers[type](value);
    }
    else {
        //@todo MIKE: to be implemented?
    }
};

//#endif
