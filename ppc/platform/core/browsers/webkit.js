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
        $setTimeout = function(call, time){
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
    
    //#ifdef __SUPPORT_CHROME
    if (XMLHttpRequest.prototype.sendAsBinary === undefined) {
        if (window.ArrayBuffer) {
            /**
             * Binary support for Chrome 7+ which implements [ECMA-262] typed arrays
             * 
             * For more information, see <http://www.khronos.org/registry/typedarray/specs/latest/>.
             */
            XMLHttpRequest.prototype.sendAsBinary = function(string) {
                var bytes = Array.prototype.map.call(string, function(c) {
                    return c.charCodeAt(0) & 0xff;
                });
                this.send(new Uint8Array(bytes));
            };
        }
    }
    //#endif
    
    //#ifdef __PARSER_XPATH
    
    // #ifdef __DEPRECATED
    if (false && apf.isWebkit) {
        //XMLDocument.selectNodes
        HTMLDocument.prototype.selectNodes =
        XMLDocument.prototype.selectNodes  = 
        Text.prototype.selectNodes         =
        Attr.prototype.selectNodes         =
        Element.prototype.selectNodes      = function(sExpr, contextNode){
            return apf.XPath.selectNodes(sExpr, contextNode || this);
        };
        
        //XMLDocument.selectSingleNode
        HTMLDocument.prototype.selectSingleNode =
        XMLDocument.prototype.selectSingleNode  = 
        Text.prototype.selectSingleNode         =
        Attr.prototype.selectSingleNode         =
        Element.prototype.selectSingleNode      = function(sExpr, contextNode){
            return apf.XPath.selectNodes(sExpr, contextNode || this)[0];
        };
        
        apf.importClass(apf.runXpath, true, self);
        apf.importClass(apf.runXslt,  true, self);
    }
    //#endif
    
    HTMLDocument.prototype.selectNodes = XMLDocument.prototype.selectNodes = function(sExpr, contextNode){
        if (sExpr.substr(0,2) == "//")
            sExpr = "." + sExpr;
        
        try {
            var oResult = this.evaluate(sExpr, (contextNode || this),
                this.createNSResolver(this.documentElement),
                7, null);//XPathResult.ORDERED_NODE_SNAPSHOT_TYPE
        }
        catch(ex) {
            try {
                var oResult = this.evaluate("child::" + sExpr, (contextNode || this),
                    this.createNSResolver(this.documentElement),
                    7, null);//XPathResult.ORDERED_NODE_SNAPSHOT_TYPE
            }
            catch(ex) {
                throw new Error("XPath error: " + ex.message + "\nLine: " + ex.lineNumber  + "\nExpression: '" + sExpr + "'");
            }
        }
        
        var nodeList = new Array(oResult.snapshotLength);
        nodeList.expr = sExpr;
        for (var i = nodeList.length - 1; i >= 0; i--) 
            nodeList[i] = oResult.snapshotItem(i);
        return nodeList;
    };
    
    //Element.selectNodes
    Text.prototype.selectNodes =
    Attr.prototype.selectNodes =
    Element.prototype.selectNodes = function(sExpr){
       return this.ownerDocument.selectNodes(sExpr, this);
    };
    
    //XMLDocument.selectSingleNode
    HTMLDocument.prototype.selectSingleNode = XMLDocument.prototype.selectSingleNode = function(sExpr, contextNode){
        var nodeList = this.selectNodes("(" + sExpr + ")[1]", contextNode ? contextNode : null);
        return nodeList.length > 0 ? nodeList[0] : null;
    };
    
    //Element.selectSingleNode
    Text.prototype.selectSingleNode =
    Attr.prototype.selectSingleNode =
    Element.prototype.selectSingleNode = function(sExpr){
        return this.ownerDocument.selectSingleNode(sExpr, this);
    };
    
    // #endif
    
    var serializer = new XMLSerializer();
    apf.insertHtmlNodes = function(nodeList, htmlNode, beforeNode, s) {
        var node, frag, a, i, l;
        if (nodeList) {
	        frag = document.createDocumentFragment();
	        a = [], i = 0, l = nodeList.length;
	        for (; i < l; i++) {
	            if (!(node = nodeList[i])) continue;
	            frag.appendChild(node);
	        }
        }
        
        (beforeNode || htmlNode).insertAdjacentHTML(beforeNode
            ? "beforebegin"
            : "beforeend", s || apf.html_entity_decode(serializer.serializeToString(frag))
                .replace(/<([^>]+)\/>/g, "<$1></$1>"));
    };

    apf.insertHtmlNode = function(xmlNode, htmlNode, beforeNode, s) {
        if (htmlNode.nodeType != 11 && !htmlNode.style)
            return htmlNode.appendChild(xmlNode);
        
        if (!s) {
            s = apf.html_entity_decode(xmlNode.serialize 
                ? xmlNode.serialize(true)
                : ((xmlNode.nodeType == 3 || xmlNode.nodeType == 4 || xmlNode.nodeType == 2)
                    ? xmlNode.nodeValue
                    : serializer.serializeToString(xmlNode)));
        }
        
        (beforeNode || htmlNode).insertAdjacentHTML(beforeNode
            ? "beforebegin"
            : "beforeend", s.match(/<(IMG|LINK|META|BR|HR|BASEFONT)[^\/>]*/i) ? s.replace(/<([^>]+)\/>/g, "<$1 />") : s.replace(/<([^>]+)\/>/g, "<$1></$1>"));

        return beforeNode ? beforeNode.previousSibling : htmlNode.lastChild;
    };

    apf.getHtmlLeft = function(oHtml){
        return oHtml.offsetLeft;
    };

    apf.getHtmlRight = function(oHtml){
        var p;
        return (((p = oHtml.offsetParent).tagName == "BODY" 
          ? apf.getWindowWidth()
          : p.offsetWidth)
            - oHtml.offsetLeft - oHtml.offsetWidth
            - (parseInt(apf.getStyle(p, "borderLeftWidth")) || 0)
            - (parseInt(apf.getStyle(p, "borderRightWidth")) || 0));
    };

    apf.getHtmlTop = function(oHtml){
        return oHtml.offsetTop
    };

    apf.getHtmlBottom = function(oHtml){
        var p;
        return (((p = oHtml.offsetParent).tagName == "BODY" 
          ? apf.getWindowHeight()
          : p.offsetHeight)
            - oHtml.offsetTop - oHtml.offsetHeight
            - (parseInt(apf.getStyle(p, "borderTopWidth")) || 0)
            - (parseInt(apf.getStyle(p, "borderBottomWidth")) || 0));
    };

    apf.getBorderOffset = function(oHtml){
        return [0,0];
    };
    
    if (apf.runNonIe)
        apf.runNonIe();
};

// #endif
