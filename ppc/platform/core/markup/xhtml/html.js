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

//#ifdef __PARSER_XHTML

/**
 * @todo description
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.XhtmlHtmlElement = function(struct, tagName){
    this.$init(tagName || "html", apf.NODE_VISIBLE, struct);
    
    //#ifdef __WITH_CONTENTEDITABLE
    this.$coreHtml   = true;
    //#endif
    
    this.$ext        = document.documentElement;
    this.$ext.host   = this;
    
    this.$int        = document.body;
    this.$tabList    = []; //Prevents documentElement from being focussed
    this.$focussable = apf.KEYBOARD;
    this.focussable  = true;
    this.visible     = true;
    this.$isWindowContainer = true;
    //this.focus = function(){ this.dispatchEvent("focus"); };
    //this.blur  = function(){ this.dispatchEvent("blur"); };
    
    this.implement(apf.Focussable);
    
    //#ifdef __WITH_FOCUS
    apf.window.$addFocus(this);
    //#endif
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        var i, l, n, a, c,
            attr = this.attributes, doc = this.ownerDocument;
        for (i = 0, l = attr.length; i < l; i++) {
            n = (a = attr[i]).nodeName.split(":");
            if (n[0] == "xmlns") {
                if (c = n[1]) {
                    doc.$prefixes[c] = a.nodeValue;
                    doc.$namespaceURIs[a.nodeValue] = c;
                }
                else {
                    doc.namespaceURI = a.nodeValue;
                }
            }
        }
        
        if (!doc.namespaceURI)
            doc.namespaceURI = apf.ns.xhtml;
    });
};
apf.XhtmlHtmlElement.prototype = new apf.XhtmlElement();

apf.xhtml.setElement("html", apf.XhtmlHtmlElement);
// #endif
