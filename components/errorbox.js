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

// #ifdef __JERRORBOX || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Component showing an error message when the attached component 
 * is in erroneous state and has the invalidmsg="" attribute specified.
 * In most cases the errorbox component is implicit and will be created 
 * automatically. 
 *
 * @classDescription		This class creates a new errorbox
 * @return {Errorbox} Returns a new errorbox
 * @type {Errorbox}
 * @constructor
 * @allowchild {anyxhtml}
 * @addnode components:errorbox
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.errorbox = function(pHtmlNode){
    jpf.register(this, "errorbox", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ***********************
            Inheritance
    ************************/
    this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {"Main" : [["container","@invalidmsg"]]};
    // #endif
    
    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    this.setMessage = function(value){
        // #ifndef __WITH_EDITMODE
        if(value.indexOf(";")>-1){
            value = value.split(";");
            value = "<strong>" + value[0] + "</strong>" + value[1];
        }
        this.oInt.innerHTML = value;
        //#endif
    }
    
    /* *********
        INIT
    **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    /* #ifdef __WITH_EDITMODE
    this.hide = function(){}
    #endif */
    
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal(); 
        this.oInt = this.__getLayoutNode("Main", "container", this.oExt);
        
        this.hide();
    }
    
    this.__loadJml = function(x){
        if (x.firstChild)
            this.setMessage(x.firstChild.nodeValue);
        
        /* #ifdef __WITH_EDITMODE
        if (this.editable && this.form.elements[x.getAttribute("for")]) {
            this.oInt.innerHTML = this.form.elements[x.getAttribute("for")]
                .jml.getAttribute("invalidmsg");
            
            this.__makeEditable("Main", this.oExt, 
                this.form.elements[x.getAttribute("for")].jml);
            
            this.show();
        }
        #endif */
    }
}
// #endif