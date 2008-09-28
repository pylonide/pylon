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

// #ifdef __JFRAME || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Component displaying a frame with a title containing other components.
 *
 * @classDescription		This class creates a new frame
 * @return {Frame} Returns a new frame
 * @type {Frame}
 * @constructor
 * @allowchild {components}, {anyjml}
 * @addnode components:frame
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 *
 * @inherits jpf.Presentation
 */
jpf.frame = jpf.component(jpf.GUI_NODE, function(){
    this.canHaveChildren = true;
    this.$focussable     = false;
    
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {"main" : [["caption", "@caption"]]};
    // #endif
    
    /**** Properties and Attributes ****/
    
    this.$supportedProperties.push("caption");

    this.$propHandlers["caption"] = function(value){
        if (this.oCaption) 
            this.oCaption.nodeValue = value;
    }
    
    this.setCaption = function(value){
        this.setProperty("caption", value);
    }
    
    /**** Init ****/
    
    this.draw = function(){
        //Build Main Skin
        this.oExt     = this.$getExternal(); 
        this.oCaption = this.$getLayoutNode("main", "caption", this.oExt);
        var oInt      = this.$getLayoutNode("main", "container", this.oExt);
        
        /* #ifdef __WITH_EDITMODE
        if(this.editable)
        #endif */
        // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
            this.$makeEditable("main", this.oExt, this.jml);
        // #endif
        
        this.oInt = this.oInt 
            ? jpf.JmlParser.replaceNode(oInt, this.oInt) 
            : jpf.JmlParser.parseChildren(this.jml, oInt, this);
    }
    
    this.$loadJml = function(x){
    }
}).implement(jpf.Presentation);

// #endif
