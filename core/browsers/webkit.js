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

// #ifdef __SUPPORT_WEBKIT
/**
 * Compatibility layer for Webkit based browsers.
 * @private
 */
apf.runWebkit = function(){
    //#ifdef __SUPPORT_SAFARI2
    if (!apf.isChrome) {
        var setTimeoutSafari = window.setTimeout;
        self.lookupSafariCall = [];
        window.setTimeout = function(call, time){
            if (typeof call == "string") 
                return setTimeoutSafari(call, time);
            return setTimeoutSafari("self.lookupSafariCall["
                + (self.lookupSafariCall.push(call) - 1) + "]()", time);
        }
        
        if (apf.isSafariOld) {
            HTMLHtmlElement = document.createElement("html").constructor;
            Node            = HTMLElement = {};
            HTMLElement.prototype = HTMLHtmlElement.apf.__proto__.apf.__proto__;
            HTMLDocument    = Document = document.constructor;
            var x           = new DOMParser();
            XMLDocument     = x.constructor;
            Element         = x.parseFromString("<Single />", "text/xml").documentElement.constructor;
            x               = null;
        }
        if (!XMLDocument.prototype.__defineGetter__) {
            Document.prototype.serialize    = 
            Node.prototype.serialize        =
            XMLDocument.prototype.serialize = function(){
                return (new XMLSerializer()).serializeToString(this);
            };
        }
    }
    //#endif
    
    //#ifdef __PARSER_XPATH
    
    if (apf.isWebkit) {
        //XMLDocument.selectNodes
        HTMLDocument.prototype.selectNodes =
        XMLDocument.prototype.selectNodes  = function(sExpr, contextNode){
            return apf.XPath.selectNodes(sExpr, contextNode || this);
        };
        
        //Element.selectNodes
        Text.prototype.selectNodes    =
        Element.prototype.selectNodes = function(sExpr, contextNode){
            return apf.XPath.selectNodes(sExpr, contextNode || this);
        };
        
        //XMLDocument.selectSingleNode
        HTMLDocument.prototype.selectSingleNode =
        XMLDocument.prototype.selectSingleNode  = function(sExpr, contextNode){
            return apf.XPath.selectNodes(sExpr, contextNode || this)[0];
        };
        
        //Element.selectSingleNode
        Text.prototype.selectSingleNode    =
        Element.prototype.selectSingleNode = function(sExpr, contextNode){
            return apf.XPath.selectNodes(sExpr, contextNode || this)[0];
        };
        
        apf.importClass(apf.runXpath, true, self);
        apf.importClass(apf.runXslt,  true, self);
    }
    
    var serializer = new XMLSerializer();
    apf.insertHtmlNodes = function(nodeList, htmlNode, beforeNode) {
        var node,
            frag = document.createDocumentFragment(),
            a = [], i = 0, l = nodeList.length;
        for (; i < l; i++) {
            if (!(node = nodeList[i])) continue;
            frag.appendChild(node);
        }

        (beforeNode || htmlNode).insertAdjacentHTML(beforeNode
            ? "beforebegin"
            : "beforeend", apf.html_entity_decode(serializer.serializeToString(frag))
                .replace(/<([^>]+)\/>/g, "<$1></$1>"));
    };

    apf.insertHtmlNode = function(xmlNode, htmlNode, beforeNode, s) {
        if (!s) {
            s = apf.html_entity_decode(xmlNode.serialize 
                ? xmlNode.serialize(true)
                : ((xmlNode.nodeType == 3 || xmlNode.nodeType == 4 || xmlNode.nodeType == 2)
                    ? xmlNode.nodeValue
                    : serializer.serializeToString(xmlNode)));
        }
        
        (beforeNode || htmlNode).insertAdjacentHTML(beforeNode
            ? "beforebegin"
            : "beforeend", s.replace(/<([^>]+)\/>/g, "<$1></$1>"));

        return beforeNode ? beforeNode.previousSibling : htmlNode.lastChild;
    };

    // #endif
    
    if (apf.runNonIe)
        apf.runNonIe();
    //apf.importClass(apf.runNonIe, true, self);
};

// #endif
