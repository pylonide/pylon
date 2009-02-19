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

//#ifdef __PARSER_XSD || __WITH_XFORMS || __WITH_MODEL_VALIDATION
//Non validating parser

/**
 * Object returning an implementation of an XSD parser.
 *
 * @classDescription        This class creates a new XSD parser
 * @return {XSDImplementation} Returns a new XSD parser
 * @type {XSDImplementation}
 * @constructor
 * @parser
 *
 * @allownode simpleType, complexType
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.XSDImplementation = function(){
    var typeHandlers = {
        //XSD datetypes [L10n potential]
        "xsd:dateTime": function(value){
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
        "xsd:time": function(value){
            value.match(/^(\d{2}):(\d{2}):(\d{2})$/);

            var dt = new Date(value);
            if (dt.getHours() != parseFloat(RegExp.$1))
                return false;
            if (dt.getMinutes() != parseFloat(RegExp.$2))
                return false;
            if (dt.getSeconds() != parseFloat(RegExp.$3))
                return false;

            return true;
        },
        "xsd:date": function(value){
            value = value.replace(/-/g, "/");
            value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (!RegExp.$3 || RegExp.$3.length < 4)
                return false;

            var dt = new Date(RegExp.$2 + "/" + RegExp.$1 + "/" + RegExp.$3); //@todo this is a dutch date, localization...
            if (dt.getFullYear() != parseFloat(RegExp.$3))
                return false;
            if (dt.getMonth() != parseFloat(RegExp.$2) - 1)
                return false;
            if (dt.getDate() != parseFloat(RegExp.$1))
                return false;

            return true;
        },
        "xsd:gYearMonth": function(value){
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
        "xsd:gYear": function(value){
            value.match(/^\/?(\d{4})(?:\d\d)?(?:\w|[\+\-]\d{2}:\d{2})?$/);
            if (!RegExp.$1 || RegExp.$1.length < 4)
                return false;

            var dt = new Date(value);
            if (dt.getFullYear() != parseFloat(RegExp.$1))
                return false;

            return true;
        },
        "xsd:gMonthDay": function(value){
            value = value.replace(/-/g, "/");
            value.match(/^\/\/(\d{2})\/(\d{2})(?:\w|[\+\-]\d{2}:\d{2})?$/);

            var dt = new Date(value);
            if (dt.getMonth() != parseFloat(RegExp.$1) - 1)
                return false;
            if (dt.getDate() != parseFloat(RegExp.$2))
                return false;

            return true;
        },
        "xsd:gDay": function(value){
            value = value.replace(/-/g, "/");
            value.match(/^\/{3}(\d{2})(?:\w|[\+\-]\d{2}:\d{2})?$/);

            var dt = new Date(value);
            if (dt.getDate() != parseFloat(RegExp.$1))
                return false;

            return true;
        },
        "xsd:gMonth": function(value){
            value = value.replace(/-/g, "/");
            value.match(/^\/{2}(\d{2})(?:\w|[\+\-]\d{2}:\d{2})?$/);

            var dt = new Date(value);
            if (dt.getMonth() != parseFloat(RegExp.$1) - 1)
                return false;

            return true;
        },

        //XSD datetypes
        "xsd:string": function(value){
            return typeof value == "string";
        },
        "xsd:boolean": function(value){
            return /^(true|false)$/i.test(value);
        },
        "xsd:base64Binary": function(value){
            return true;
        },
        "xsd:hexBinary": function(value){
            return /^(?:0x|x|#)?[A-F0-9]{0,8}$/i.test(value);
        },
        "xsd:float": function(value){
            return parseFloat(value) == value;
        },
        "xsd:decimal": function(value){
            return /^[0-9\.\-,]+$/.test(value);
        },
        "xsd:double": function(value){
            return parseFloat(value) == value;
        },
        "xsd:anyURI": function(value){
            return /^(?:\w+:\/\/)?(?:(?:[\w\-]+\.)+(?:[a-z]+)|(?:(?:1?\d?\d?|2[0-4]9|25[0-5])\.){3}(?:1?\d\d|2[0-4]9|25[0-5]))(?:\:\d+)?(?:\/([^\s\\\%]+|%[\da-f]{2})*)?$/i
                .test(value);
        },
        "xsd:QName": function(value){
            return true;
        },
        "xsd:normalizedString": function(value){
            return true;
        },
        "xsd:token": function(value){
            return true;
        },
        "xsd:language": function(value){
            return true;
        },
        "xsd:Name": function(value){
            return true;
        },
        "xsd:NCName": function(value){
            return true;
        },
        "xsd:ID": function(value){
            return true;
        },
        "xsd:IDREF": function(value){
            return true;
        },
        "xsd:IDREFS": function(value){
            return true;
        },
        "xsd:NMTOKEN": function(value){
            return true;
        },
        "xsd:NMTOKENS": function(value){
            return true;
        },
        "xsd:integer": function(value){
            return parseInt(value) == value;
        },
        "xsd:nonPositiveInteger": function(value){
            return parseInt(value) == value && value <= 0;
        },
        "xsd:negativeInteger": function(value){
            return parseInt(value) == value && value < 0;
        },
        "xsd:long": function(value){
            return parseInt(value) == value && value >= -2147483648
                && value <= 2147483647;
        },
        "xsd:int": function(value){
            return parseInt(value) == value;
        },
        "xsd:short": function(value){
            return parseInt(value) == value && value >= -32768 && value <= 32767;
        },
        "xsd:byte": function(value){
            return parseInt(value) == value && value >= -128 && value <= 127;
        },
        "xsd:nonNegativeInteger": function(value){
            return parseInt(value) == value && value >= 0;
        },
        "xsd:unsignedLong": function(value){
            return parseInt(value) == value && value >= 0 && value <= 4294967295;
        },
        "xsd:unsignedInt": function(value){
            return parseInt(value) == value && value >= 0;
        },
        "xsd:unsignedShort": function(value){
            return parseInt(value) == value && value >= 0 && value <= 65535;
        },
        "xsd:unsignedByte": function(value){
            return parseInt(value) == value && value >= 0 && value <= 255;
        },
        "xsd:positiveInteger": function(value){
            return parseInt(value) == value && value > 0;
        },

        //XForms datatypes
        "xforms:listItem": function(value){
            return true;
        },
        "xforms:listItems": function(value){
            return true;
        },
        "xforms:dayTimeDuration": function(value){
            return true;
        },
        "xforms:yearMonthDuration": function(value){
            return true;
        },

        //Javeline PlatForm datatypes
        "jpf:url": function(value){
            //@todo please write this
        },
        "jpf:website": function(value){
            //@todo please make this better
            return /^(?:http:\/\/)?([\w-]+\.)+\w{2,4}$/.test(value.trim());
        },
        "jpf:email": function(value){
            return /^[A-Z0-9\.\_\%\-]+@(?:[A-Z0-9\-]+\.)+[A-Z]{2,4}$/i
                .test(value.trim());
        },
        "jpf:creditcard": function(value){
            value = value.replace(/ /g, "");
            value = value.pad(21, "0", jpf.PAD_LEFT);
            for (var total = 0, r, i = value.length; i >= 0; i--) {
                r = value.substr(i, 1) * (i % 2 + 1);
                total += r > 9 ? r - 9 : r;
            }
            return total % 10 === 0;
        },
        "jpf:expdate": function(value){
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
        "jpf:wechars": function(value){
            return /^[0-9A-Za-z\xC0-\xCF\xD1-\xD6\xD8-\xDD\xDF-\xF6\xF8-\xFF -\.',]+$/
              .test(value)
        },
        "jpf:phonenumber": function(value){
            return /^[\d\+\- \(\)]+$/.test(value)
        },
        "jpf:faxnumber": function(value){
            return /^[\d\+\- \(\)]+$/.test(value)
        },
        "jpf:mobile": function(value){
            return /^[\d\+\- \(\)]+$/.test(value)
        }
    };

    var custumTypeHandlers = {};

    this.parse = function(xmlNode){
        if (xmlNode[jpf.TAGNAME] == "complextype")
            this.parseComplexType(xmlNode);
        else
            if (xmlNode[jpf.TAGNAME] == "simpletype")
                this.parseSimpleType(xmlNode);
            else {
                var i, nodes = $xmlns(xmlNode, "complextype", jpf.ns.xsd);
                for (i = 0; i < nodes.length; i++)
                    this.parseComplexType(nodes[i]);

                nodes = $xmlns(xmlNode, "simpletype", jpf.ns.xsd);
                for (i = 0; i < nodes.length; i++)
                    this.parseSimpleType(nodes[i]);
            }
    };

    this.getValue = function(xmlNode){
        return xmlNode.nodeType == 1
            ? jpf.getXmlValue(xmlNode, "text()")
            : xmlNode.nodeValue;
    };

    this.matchType = function(value, type){
        //check if type is type
        if (typeHandlers[type])
            return typeHandlers[type](value);
        return true;
    };

    this.parseComplexType = function(xmlNode){
        var func;

        custumTypeHandlers[xmlNode.getAttribute("name")] = func;
    };

    /* ***************** SIMPLE TYPES *******************/

    /*
     enumeration     Defines a list of acceptable values
     fractionDigits Specifies the maximum number of decimal places allowed. Must be equal to or greater than zero
     length             Specifies the exact number of characters or list items allowed. Must be equal to or greater than zero
     maxExclusive     Specifies the upper bounds for numeric values (the value must be less than this value)
     maxInclusive     Specifies the upper bounds for numeric values (the value must be less than or equal to this value)
     maxLength         Specifies the maximum number of characters or list items allowed. Must be equal to or greater than zero
     minExclusive     Specifies the lower bounds for numeric values (the value must be greater than this value)
     minInclusive     Specifies the lower bounds for numeric values (the value must be greater than or equal to this value)
     minLength         Specifies the minimum number of characters or list items allowed. Must be equal to or greater than zero
     pattern             Defines the exact sequence of characters that are acceptable
     totalDigits     Specifies the exact number of digits allowed. Must be greater than zero
     */
    var simpleTypeHandler = {
        //Direct childnodes
        "restriction": function(xmlNode, func){
            func.push("if (!jpf.XSDParser.matchType(value, '"
                + xmlNode.getAttribute("base") + "')) return false;");

            var nodes = xmlNode.childNodes;
            for (var i = 0; i < nodes.length; i++) {
                if (simpleTypeHandler[nodes[i][jpf.TAGNAME]])
                    simpleTypeHandler[nodes[i][jpf.TAGNAME]](nodes[i], func);
            }
        },

        "list": function(xmlNode, func){},

        "union": function(xmlNode, func){},

        //Subnodes
        //These should also allow for dates
        "mininclusive": function(xmlNode, func){
            func.push("if (parseFloat(value) < " + xmlNode.getAttribute("value")
                + ") return false;");
        },
        "maxinclusive": function(xmlNode, func){
            func.push("if (parseFloat(value) > " + xmlNode.getAttribute("value")
                + ") return false;");
        },
        "minexclusive": function(xmlNode, func){
            func.push("if (parseFloat(value) => " + xmlNode.getAttribute("value")
                + ") return false;");
        },
        "maxexclusive": function(xmlNode, func){
            func.push("if (parseFloat(value) =< " + xmlNode.getAttribute("value")
                + ") return false;");
        },
        //This should also check for list items
        "maxlength": function(xmlNode, func){
            func.push("if (value.length > " + xmlNode.getAttribute("value")
                + ") return false;");
        },
        //This should also check for list items
        "minlength": function(xmlNode, func){
            func.push("if (value.length < " + xmlNode.getAttribute("value")
                + ") return false;");
        },
        //This should also check for list items
        "length": function(xmlNode, func){
            func.push("if (value.length != " + xmlNode.getAttribute("value")
                + ") return false;");
        },
        "fractiondigits": function(xmlNode, func){
            func.push("if (parseFloat(value) == value && value.split('.')[1].length != "
                + xmlNode.getAttribute("value") + ") return false;");
        },
        "totaldigits": function(xmlNode, func){
            func.push("if (new String(parseFloat(value)).length == "
                + xmlNode.getAttribute("value") + ") return false;");
        },
        "pattern": function(xmlNode, func){
            func.push("if (!/^" + xmlNode.getAttribute("value")
                .replace(/(\/|\^|\$)/g, "\\$1") + "$/.test(value)) return false;");
        },
        "enumeration": function(xmlNode, func){
            if (func.enum_done) return;

            var enum_nodes = $xmlns(xmlNode.parentNode, "enumeration", jpf.ns.xsd);
            func.enum_done = true;
            for (var re = [], k = 0; k < enum_nodes.length; k++)
                re.push(enum_nodes[k].getAttribute("value"));
            func.push("if (!/^(?:" + re.join("|") + ")$/.test(value)) return false;");
        },
        "maxscale": function(xmlNode, func){
            //http://www.w3.org/TR/2006/WD-xmlschema11-2-20060217/datatypes.html#element-maxScale
        },
        "minscale": function(xmlNode, func){
            //http://www.w3.org/TR/2006/WD-xmlschema11-2-20060217/datatypes.html#element-minScale
        }
    };

    this.parseSimpleType = function(xmlNode){
        var func = [];
        func.push("var value = jpf.XSDParser.getValue(xmlNode);");

        var nodes = xmlNode.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (simpleTypeHandler[nodes[i][jpf.TAGNAME]])
                simpleTypeHandler[nodes[i][jpf.TAGNAME]](nodes[i], func);
        }

        func.push("return true;");
        custumTypeHandlers[xmlNode.getAttribute("name")] =
            new Function('xmlNode', func.join("\n"));
    };

    this.checkType = function(type, xmlNode){
        if (typeHandlers[type]) {
            var value = this.getValue(xmlNode);
            return typeHandlers[type](value);
        }
        else {
            if (custumTypeHandlers[type]) {
                return custumTypeHandlers[type](xmlNode);
            }
            else {
                //@todo MIKE: to be implemented?
            }
        }
    };
};

jpf.XSDParser = new jpf.XSDImplementation();
//#endif
