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

// #ifdef __SUPPORT_Opera
function runOpera(){
    var setTimeoutOpera = window.setTimeout;
    var lookupOperaCall = [];
    window.setTimeout = function(call, time){
        if (typeof call == "string") 
            return setTimeoutOpera(call, time);
        return setTimeoutOpera("lookupOperaCall["
            + (lookupOperaCall.push(call) - 1) + "]()", time);
    }
    
    //HTMLHtmlElement = document.createElement("html").constructor;
    //HTMLElement = {};
    //HTMLElement.prototype = HTMLHtmlElement.__proto__.__proto__;
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
    
    //#ifdef __SUPPORT_XPATH
    
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
    Element.prototype.selectNodes = function(sExpr){
        var doc = this.ownerDocument;
        if (!doc.selectSingleNode) {
            doc.selectSingleNode = HTMLDocument.prototype.selectSingleNode;
            doc.selectNodes = HTMLDocument.prototype.selectNodes;
        }
        
        if (doc.selectNodes) 
            return doc.selectNodes(sExpr, this);
        else 
            throw new Error(jpf.formatErrorString(1047, null, "XPath Selection", "Method selectNodes is only supported by XML Nodes"));
    };
    
    //XMLDocument.selectSingleNode
    Document.prototype.selectSingleNode     =
    XMLDocument.prototype.selectSingleNode  =
    HTMLDocument.prototype.selectSingleNode = function(sExpr, contextNode){
        var nodeList = this.selectNodes(sExpr + "[1]", contextNode ? contextNode : null);
        return nodeList.length > 0 ? nodeList[0] : null;
    };
    
    //Element.selectSingleNode
    Element.prototype.selectSingleNode = function(sExpr){
        var doc = this.ownerDocument;
        if (!doc.selectSingleNode) {
            doc.selectSingleNode = HTMLDocument.prototype.selectSingleNode;
            doc.selectNodes = HTMLDocument.prototype.selectNodes;
        }
        
        if (doc.selectSingleNode) 
            return doc.selectSingleNode(sExpr, this);
        else 
            throw new Error(jpf.formatErrorString(1048, null, "XPath Selection", "Method selectSingleNode is only supported by XML Nodes. \nInfo : " + e));
    };
    
    //#endif
    
    //#ifdef __WITH_APP
    
    jpf.getWidthDiff = function(oHtml){
        return Math.max(0, (parseInt(jpf.getStyle(oHtml, "padding-left")) || 0)
            + (parseInt(jpf.getStyle(oHtml, "padding-right")) || 0)
            + (parseInt(jpf.getStyle(oHtml, "border-left-width")) || 0)
            + (parseInt(jpf.getStyle(oHtml, "border-right-width")) || 0));
    };
    
    jpf.getHeightDiff = function(oHtml){
        return Math.max(0, (parseInt(jpf.getStyle(oHtml, "padding-top")) || 0)
            + (parseInt(jpf.getStyle(oHtml, "padding-bottom")) || 0)
            + (parseInt(jpf.getStyle(oHtml, "border-top-width")) || 0)
            + (parseInt(jpf.getStyle(oHtml, "border-bottom-width")) || 0));
    };
    
    jpf.getDiff = function(oHtml){
        var pNode = oHtml.parentNode;
        var nSibling = oHtml.nextSibling;
        if (!oHtml.offsetHeight) 
            document.body.appendChild(oHtml);
        
        /*
         alert(
         jpf.getStyle(oHtml, "padding") + ":" + jpf.getStyle(oHtml, "border-width") + ":" + oHtml.offsetWidth + ":" + jpf.getStyle(oHtml, "width") + ":" + oHtml.clientWidth + ":" + oHtml.currentStyle.width + "\n" +
         jpf.getStyle(oHtml, "padding") + ":" + jpf.getStyle(oHtml, "border-width") + ":" + oHtml.offsetHeight + ":" + jpf.getStyle(oHtml, "height") + ":" + oHtml.clientHeight + ":" + oHtml.currentStyle.height + "\n" +
         diff
         );
         */
        var diff = [Math.max(0, parseInt(jpf.getStyle(oHtml, "padding-left"))
            + parseInt(oHtml.currentStyle.paddingRight)
            + parseInt(jpf.getStyle(oHtml, "border-left-width"))
            + parseInt(jpf.getStyle(oHtml, "border-right-width")) || 0),
            Math.max(0, parseInt(jpf.getStyle(oHtml, "padding-top"))
            + parseInt(oHtml.currentStyle.paddingBottom)
            + parseInt(jpf.getStyle(oHtml, "border-top-width"))
            + parseInt(jpf.getStyle(oHtml, "border-bottom-width")) || 0)];
        //if (oHtml.tagName.match(/frame/i)) 
            //alert(diff);
        //alert(parseInt(oHtml.currentStyle.paddingLeft) + ":" +  parseInt(oHtml.currentStyle.paddingRight) + ":" +  parseInt(oHtml.currentStyle.borderLeftWidth) + ":" +  parseInt(oHtml.currentStyle.borderRightWidth));
        
        pNode.insertBefore(oHtml, nSibling);
        
        return diff;
    };
    
    // #endif
    
    jpf.importClass(runNonIe, true, self);
}

// #endif
