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
// #ifdef __JHTMLWRAPPER || __INC_ALL

/**
 * @private
 * @constructor
 */
jpf.HtmlWrapper = function(pHtmlNode, htmlNode, namespace){
    this.uniqueId  = jpf.all.push(this) - 1;
    this.inherit   = jpf.inherit;
    this.oExt      = htmlNode;
    this.pHtmlDoc  = document;
    this.pHtmlNode = pHtmlNode;
    
    // #ifdef __WITH_ANCHORING
    this.inherit(jpf.Anchoring); /** @inherits jpf.Anchoring */
    // #endif
    
    // #ifdef __WITH_ALIGNMENT
    this.inherit(jpf.Alignment); /** @inherits jpf.Alignment */
    // #endif
    
    var copy = htmlNode.cloneNode();
    // #ifdef __WITH_ALIGNMENT
    this.enableAlignment = function(purge){
        var l = jpf.layout.get(this.pHtmlNode); // , (x.parentNode.getAttribute("margin") || "").split(/,\s*/)might be optimized by splitting only once
        if (!this.aData) {
            if (x.getAttribute(namespace + ":align")) 
                x.setAttribute("align", x.getAttribute(namespace + ":align"));
            if (x.getAttribute(namespace + ":lean")) 
                x.setAttribute("lean", x.getAttribute(namespace + ":lean"));
            if (x.getAttribute(namespace + ":edge")) 
                x.setAttribute("edge", x.getAttribute(namespace + ":edge"));
            if (x.getAttribute(namespace + ":weight")) 
                x.setAttribute("weight", x.getAttribute(namespace + ":weight"));
            if (x.getAttribute(namespace + ":splitter")) 
                x.setAttribute("splitter", x.getAttribute(namespace + ":splitter"));
            if (x.getAttribute(namespace + ":width")) 
                x.setAttribute("width", x.getAttribute(namespace + ":width"));
            if (x.getAttribute(namespace + ":height")) 
                x.setAttribute("height", x.getAttribute(namespace + ":height"));
            if (x.getAttribute(namespace + ":min-width")) 
                x.setAttribute("min-width", x.getAttribute(namespace + ":min-width"));
            if (x.getAttribute(namespace + ":min-height")) 
                x.setAttribute("min-height", x.getAttribute(namespace + ":min-height"));
            
            this.aData = jpf.layout.parseXml(x, l, this);
            this.aData.stackId = this.parentNode.aData.children.push(this.aData) - 1;
            this.aData.parent = this.parentNode;
        }
        else {
            //put aData back here
        }
        
        if (purge) 
            this.purgeAlignment();
    }
    //#endif
}

//#endif
