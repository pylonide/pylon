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
// #ifdef __JLABEL || __INC_ALL
// #define __JBASESIMPLE 1

/**
 * Component displaying rectangle containing text usually specifying
 * a description of another component or user interface element.
 * Optionally when clicked it can set the focus on another JML component.
 *
 * @classDescription		This class creates a new label
 * @return {Label} Returns a new label
 * @type {Label}
 * @constructor
 * @allowchild {smartbinding}
 * @addnode components:label
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */

jpf.label = function(pHtmlNode){
    jpf.register(this, "label", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc = this.pHtmlNode.ownerDocument;
    
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {
        "main": [["caption", "text()"]]
    };
    // #endif
    
    this.setValue = function(value){
        this.value = value;
        this.oInt.innerHTML = value;
    };
    
    this.$supportedProperties.push("value");
    this.$propHandlers["value"] = function(value){
        this.oInt.innerHTML = value;
    };
    
    var forJmlNode;
    this.setFor = function(jmlNode){
        forJmlNode = jmlNode;
    };
    
    /* ***************
     DATABINDING
     ****************/
    /* *********
     INIT
     **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal();
        this.oInt = this.$getLayoutNode("main", "caption", this.oExt);
        if (this.oInt.nodeType != 1) 
            this.oInt = this.oInt.parentNode;
        
        this.oExt.onmousedown = function(){
            if (this.host.formEl && this.host.formEl.nodeType == jpf.GUI_NODE) {
                //this.host.formEl.focus();
                jpf.window.$focus(this.host.formEl);
            }
        }
    };
    
    //#ifdef __JSUBMITFORM
    this.setFormEl = function(formEl){
        this.formEl = formEl;
    };
    //#endif
    
    this.$loadJml = function(x){
        if (x.firstChild) {
            if (x.childNodes.length > 1 || x.firstChild.nodeType == 1) {
                this.setValue("");
                jpf.JmlParser.parseChildren(x, this.oExt, this);
            }
            else 
                this.setValue(x.firstChild.nodeValue);
        }
        
        /* #ifdef __WITH_EDITMODE
         if(this.editable)
         #endif */
        // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
        this.$makeEditable("main", this.oExt, this.jml);
        // #endif
        
        //#ifdef __JSUBMITFORM
        
        //Set Form
        var y = x;
        do {
            y = y.parentNode;
        }
        while (y.tagName && !y.tagName.match(/submitform|xforms$/) 
          && y.parentNode && y.parentNode.nodeType != 9);
        
        if (y.tagName && y.tagName.match(/submitform|xforms$/)) {
            //#ifdef __DEBUG
            if (!y.tagName.match(/submitform|xforms$/)) 
                throw new Error(jpf.formatErrorString(1004, this, "Textbox", "Could not find Form element whilst trying to bind to it's Data."));
            if (!y.getAttribute("id")) 
                throw new Error(jpf.formatErrorString(1005, this, "Textbox", "Found Form element but the id attribute is empty or missing."));
            //#endif
            
            this.form = eval(y.getAttribute("id"));
        }
        
        //Please make this working without the submitform
        //if(x.getAttribute("for") && this.form) this.form.addConnectQueue(this, this.setFormEl, x.getAttribute("for"));
    
        // #endif
    };
    
    this.inherit(jpf.BaseSimple); /** @inherits jpf.BaseSimple */
    //TBD: what is this with two/ three underscores variation??
    this.$_focus = this.$focus;
    this.$focus  = function(){
        if (forJmlNode) 
            forJmlNode.focus();
        this.$focus();
    };
}

//#endif
