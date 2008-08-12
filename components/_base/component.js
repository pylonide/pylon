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

// #ifdef __WITH_APP

/**
 * Note: we REALLY don't care about execution speed for this one! It will be
 * optimized by reformatting it using Jaw (compile-time), like C-style macros.
 * @param {Object} nodeType
 */
jpf.component = function(nodeType, oBase) {
    var fC = function() {
        this.__init.apply(this, arguments);
    };
    
    if (oBase) {
        if (typeof oBase == "function")
            fC.prototype.base = oBase;
        else
            fC.prototype = oBase;
    }

    fC.prototype.nodeType      = nodeType || NOGUI_NODE;
    fC.prototype.ownerDocument = jpf.document;
    
    //#ifdef __DESKRUN
    if(nodeType == MF_NODE)
        DeskRun.register(fC.prototype);
    //#endif
    
    fC.prototype.inherit = jpf.inherit;
    
    if (typeof fC.prototype['__init'] != "function") {
        var aImpl;
        fC.implement = function() {
            aImpl = Array.prototype.slice.call(arguments);
            return fC;
        }
        
        fC.prototype.__init = function(pHtmlNode, sName){
            if (typeof sName != "string") 
                throw new Error(0, jpf.formErrorString(0, this, "Dependencies not met, please provide a component name"));

            this.tagName    = sName;
            this.pHtmlNode  = pHtmlNode || document.body;
            this.pHtmlDoc   = this.pHtmlNode.ownerDocument;
            
            this.uniqueId   = jpf.all.push(this) - 1;
            
            this.focussable = true; // Each object can get the focus by default
            
            /** 
             * @inherits jpf.Class
             * @inherits jpf.JmlNode
             */
            this.inherit(jpf.Class);
            this.inherit.apply(this, aImpl || []);
            this.inherit(jpf.JmlNode, this.base || jpf.K);
            
            if (this['init'] && typeof this.init == "function")
                this.init();
        }
    }
    
    return fC;
};

// #endif
