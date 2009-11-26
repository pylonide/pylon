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

// #ifdef __SUPPORT_OPERA
/**
 * Compatibility layer for Opera browsers.
 * @private
 */
apf.runOpera = function (){
    /*var setTimeoutOpera = window.setTimeout;
    var lookupOperaCall = [];
    window.setTimeout = function(call, time){
        if (typeof call == "string") 
            return setTimeoutOpera(call, time);
        return setTimeoutOpera("lookupOperaCall["
            + (lookupOperaCall.push(call) - 1) + "]()", time);
    }*/
    
    //HTMLHtmlElement = document.createElement("html").constructor;
    //HTMLElement = {};
    //HTMLElement.prototype = HTMLHtmlElement.apf.__proto__.apf.__proto__;
    //HTMLDocument = Document = document.constructor;
    var x = new DOMParser();
    XMLDocument = DOMParser.constructor;
    //Element = x.parseFromString("<Single />", "text/xml").documentElement.constructor;
    x = null;
    
    /* ***************************************************************************
     XML Serialization
     ****************************************************************************/
    //XMLDocument.xml
    
    //Node.xml
    /*Node.prototype.serialize = function(){
     return (new XMLSerializer()).serializeToString(this);
     }*/
    //Node.xml
    
    Node.prototype.serialize        = 
    XMLDocument.prototype.serialize =
    Element.prototype.serialize     = function(){
        return (new XMLSerializer()).serializeToString(this);
    };
    
    //#ifdef __PARSER_XPATH
    
    //XMLDocument.selectNodes
    Document.prototype.selectNodes     = 
    XMLDocument.prototype.selectNodes  =
    HTMLDocument.prototype.selectNodes = function(sExpr, contextNode){
        var oResult = this.evaluate(sExpr, (contextNode ? contextNode : this),
            this.createNSResolver(this.documentElement),
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        var nodeList = new Array(oResult.snapshotLength);
        nodeList.expr = sExpr;
        for (var i = 0; i < nodeList.length; i++) 
            nodeList[i] = oResult.snapshotItem(i);
        return nodeList;
    };
    
    //Element.selectNodes
    Text.prototype.selectNodes =
    Element.prototype.selectNodes = function(sExpr){
        var doc = this.ownerDocument;
        if (!doc.selectSingleNode) {
            doc.selectSingleNode = HTMLDocument.prototype.selectSingleNode;
            doc.selectNodes = HTMLDocument.prototype.selectNodes;
        }
        
        if (doc.selectNodes) 
            return doc.selectNodes(sExpr, this);
        else 
            throw new Error(apf.formatErrorString(1047, null, "XPath Selection", "Method selectNodes is only supported by XML Nodes"));
    };
    
    //XMLDocument.selectSingleNode
    Document.prototype.selectSingleNode     =
    XMLDocument.prototype.selectSingleNode  =
    HTMLDocument.prototype.selectSingleNode = function(sExpr, contextNode){
        var nodeList = this.selectNodes(sExpr + "[1]", contextNode ? contextNode : null);
        return nodeList.length > 0 ? nodeList[0] : null;
    };
    
    //Element.selectSingleNode
    Text.prototype.selectSingleNode =
    Element.prototype.selectSingleNode = function(sExpr){
        var doc = this.ownerDocument;
        if (!doc.selectSingleNode) {
            doc.selectSingleNode = HTMLDocument.prototype.selectSingleNode;
            doc.selectNodes = HTMLDocument.prototype.selectNodes;
        }
        
        if (doc.selectSingleNode) 
            return doc.selectSingleNode(sExpr, this);
        else 
            throw new Error(apf.formatErrorString(1048, null, "XPath Selection", "Method selectSingleNode is only supported by XML Nodes. \nInfo : " + e));
    };
    
    //#endif
    
    var serializer = new XMLSerializer();
    apf.insertHtmlNodes = function(nodeList, htmlNode, beforeNode) {
        var frag = document.createDocumentFragment();
        for (var node, a = [], i = 0, l = nodeList.length; i < l; i++) {
            if (!(node = nodeList[i])) continue;
            frag.appendChild(node);
        }
        (beforeNode || htmlNode).insertAdjacentHTML(beforeNode
            ? "beforebegin"
            : "beforeend", apf.html_entity_decode(serializer.serializeToString(frag)));//.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/<([^>]+)\/>/g, "<$1></$1>");
    };

    apf.insertHtmlNode = function(xmlNode, htmlNode, beforeNode, s) {
        if (!s) {
            s = xmlNode.serialize 
                ? xmlNode.serialize(true)
                : ((xmlNode.nodeType == 3 || xmlNode.nodeType == 4 || xmlNode.nodeType == 2)
                    ? xmlNode.nodeValue
                    : serializer.serializeToString(xmlNode));
        }
        
        (beforeNode || htmlNode).insertAdjacentHTML(beforeNode
            ? "beforebegin"
            : "beforeend", serializer.serializeToString(frag));//apf.html_entity_decode

        return beforeNode ? beforeNode.previousSibling : htmlNode.lastChild;
    };
    
    if (apf.runNonIe)
        apf.runNonIe();
        //apf.importClass(apf.runNonIe, true, self);
}

// #endif
