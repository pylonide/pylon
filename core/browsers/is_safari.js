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
    //#ifdef __SUPPORT_Safari2
    if (!jpf.isChrome) {
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
        
        if (!XMLDocument.__defineGetter__) {
            Document.prototype.serialize    = 
            Node.prototype.serialize        =
            XMLDocument.prototype.serialize = function(){
                return (new XMLSerializer()).serializeToString(this);
            };
        }
    }
    //#endif
    
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

    // #endif
    
    jpf.importClass(runNonIe, true, self);
}

// #endif
