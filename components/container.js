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

// #ifdef __JCONTAINER || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Component containing other components that are hidden by default.
 *
 * @constructor
 * @allowchild {components}, {anyjml}
 * @define container
 * @addnode components
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits jpf.Presentation
 * @inherits jpf.DelayedRender
 * @inherits jpf.Validation
 */
jpf.container = jpf.component(jpf.NODE_VISIBLE, function(pHtmlNode){
    this.canHaveChildren = true;
    this.$focussable     = false;
    
    this.$show = function(){ 
        // #ifdef __WITH_DELAYEDRENDER
        this.render();
        // #endif 
    }
    
    this.$draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal();
        
        //#ifndef __WITH_EDITMODE
        this.setInactive();
        //#endif
    }
    
    this.$loadJml = function(x){
        var oInt  = this.$getLayoutNode("main", "container", this.oExt) 
            || this.oExt;

        this.oInt = this.oInt
            ? jpf.JmlParser.replaceNode(oInt, this.oInt)
            : jpf.JmlParser.parseChildren(this.$jml, oInt, this, true);
        
        this.hide();
    }
}).implement(
    // #ifdef __WITH_DELAYEDRENDER
    jpf.DelayedRender,
    // #endif
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    jpf.Validation,
    //#endif
    jpf.Presentation
);

// #endif