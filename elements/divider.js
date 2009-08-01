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
// #ifdef __JDIVIDER || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Element displaying a divider. For use in toolbars, menu's and such.
 * @define divider
 * @constructor
 */
apf.divider = apf.component(apf.NODE_VISIBLE, function() {
    this.$domHandlers["reparent"].push(function(beforeNode, pNode, withinParent){
        if (!this.$amlLoaded)
            return;
        
        if (!withinParent && this.skinName != pNode.skinName) {
            //@todo for now, assuming dom garbage collection doesn't leak
            this.loadAml();
        }
    });
    
    /**
     * @ref amlNode#show
     */
    this.show = function(){
        this.oExt.style.display = "block";
    }
    
    /**
     * @ref amlNode#hide
     */
    this.hide = function(){
        this.oExt.style.display = "none";
    }
    
    /**
     * @private
     */
    this.$loadAml = function(x) {
        this.$aml = x;

        var parentNode = this.parentNode;
        if (parentNode.$hasLayoutNode && parentNode.$hasLayoutNode("divider")) {
            this.skinName = this.parentNode.skinName;
            this.oExt = apf.xmldb.htmlImport(
                this.parentNode.$getLayoutNode("divider"), this.pHtmlNode);
        }
        else {
            this.implement(apf.Presentation);
            this.$loadSkin();
            this.oExt = this.$getExternal("main");
        } 
    }
});

//#endif