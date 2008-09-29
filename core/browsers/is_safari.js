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

// #ifdef __SUPPORT_Safari
function runSafari(){
    var setTimeoutSafari = window.setTimeout;
    var lookupSafariCall = [];
    window.setTimeout = function(call, time){
        if (typeof call == "string") 
            return setTimeoutSafari(call, time);
        return setTimeoutSafari("lookupSafariCall["
            + (lookupSafariCall.push(call) - 1) + "]()", time);
    }
    
    if (jpf.isSafariOld) {
        HTMLHtmlElement = document.createElement("html").constructor;
        Node            = HTMLElement = {};
        HTMLElement.prototype = HTMLHtmlElement.__proto__.__proto__;
        HTMLDocument    = Document = document.constructor;
        var x           = new DOMParser();
        XMLDocument     = x.constructor;
        Element         = x.parseFromString("<Single />", "text/xml").documentElement.constructor;
        x               = null;
    }
    
    /* ***************************************************************************
     XML Serialization
     ****************************************************************************/
    //XMLDocument.xml
    Document.prototype.serialize    = 
    Node.prototype.serialize        =
    XMLDocument.prototype.serialize = function(){
        return (new XMLSerializer()).serializeToString(this);
    };
    //Node.xml
    /*Node.prototype.serialize = function(){
     return (new XMLSerializer()).serializeToString(this);
     }*/
    //Node.xml
    
    //#ifdef __SUPPORT_XPATH
    
    if (jpf.isSafariOld || jpf.isSafari) {
        //XMLDocument.selectNodes
        HTMLDocument.prototype.selectNodes =
        XMLDocument.prototype.selectNodes  = function(sExpr, contextNode){
            return jpf.XPath.selectNodes(sExpr, contextNode || this);
        };
        
        //Element.selectNodes
        Element.prototype.selectNodes = function(sExpr, contextNode){
            return jpf.XPath.selectNodes(sExpr, contextNode || this);
        };
        
        //XMLDocument.selectSingleNode
        HTMLDocument.prototype.selectSingleNode =
        XMLDocument.prototype.selectSingleNode  = function(sExpr, contextNode){
            return jpf.XPath.selectNodes(sExpr, contextNode || this)[0];
        };
        
        //Element.selectSingleNode
        Element.prototype.selectSingleNode = function(sExpr, contextNode){
            return jpf.XPath.selectNodes(sExpr, contextNode || this)[0];
        };
        
        jpf.importClass(runXpath, true, self);
        jpf.importClass(runXslt, true, self);
    }
    /*else{
     //XMLDocument.selectNodes
     HTMLDocument.prototype.selectNodes =
     XMLDocument.prototype.selectNodes = function(sExpr, contextNode){
     var oResult = this.evaluate(sExpr, (contextNode?contextNode:this), this.createNSResolver(this.documentElement), XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
     var nodeList = new Array(oResult.snapshotLength);
     nodeList.expr = sExpr;
     for(i=0;i<nodeList.length;i++) nodeList[i] = oResult.snapshotItem(i);
     return nodeList;
     
     }
     
     //Element.selectNodes
     Element.prototype.selectNodes = function(sExpr){
     var doc = this.ownerDocument;
     if(doc.selectNodes)
     return doc.selectNodes(sExpr, this);
     else
     throw new Error(jpf.formatErrorString(1047, null, "xPath selection", "Method selectNodes is only supported by XML Nodes"));
     };
     
     //XMLDocument.selectSingleNode
     HTMLDocument.prototype.selectSingleNode =
     XMLDocument.prototype.selectSingleNode = function(sExpr, contextNode){
     var nodeList = this.selectNodes(sExpr + "[1]", contextNode?contextNode:null);
     return nodeList.length > 0 ? nodeList[0] : null;
     }
     
     //Element.selectSingleNode
     Element.prototype.selectSingleNode = function(sExpr){
     var doc = this.ownerDocument;
     if(doc.selectSingleNode)
     return doc.selectSingleNode(sExpr, this);
     else
     throw new Error(jpf.formatErrorString(1048, null, "XPath Selection", "Method selectSingleNode is only supported by XML Nodes. \nInfo : " + e));
     };
     }*/
    // #endif
    
    jpf.importClass(runNonIe, true, self);
}

// #endif
