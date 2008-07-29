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
 */
jpf.frame = function(pHtmlNode){
    jpf.register(this, "frame", GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;

    /* ***********************
            Inheritance
    ************************/
    this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {"Main" : [["caption", "@caption"]]};
    // #endif
    
    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    this.setCaption = function(value){
        this.oCaption.nodeValue = value;
    }
        
    /* *********
        INIT
    **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    this.draw = function(){
        //Build Main Skin
        this.oExt     = this.__getExternal(); 
        this.oCaption = this.__getLayoutNode("Main", "caption", this.oExt);
        var oInt      = this.__getLayoutNode("Main", "container", this.oExt);
        
        /* #ifdef __WITH_EDITMODE
        if(this.editable)
        #endif */
        // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
            this.__makeEditable("Main", this.oExt, this.jml);
        // #endif
        
        this.oInt = this.oInt 
            ? jpf.JMLParser.replaceNode(oInt, this.oInt) 
            : jpf.JMLParser.parseChildren(this.jml, oInt, this);
    }
    
    this.__loadJML = function(x){
        if (x.getAttribute("caption"))
            this.setCaption(x.getAttribute("caption"));
    }
}

// #endif
